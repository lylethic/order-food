from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.providers.user_provider import user_provider
from app.providers.role_provider import role_provider
from app.providers.refresh_token_provider import refresh_token_provider
from app.utils.app_error import AppError
from app.utils.auth_utils import (
    hash_token, generate_refresh_token, generate_token_family,
    generate_access_token, ACCESS_TOKEN_EXPIRY_MINUTES, ACCESS_TOKEN_EXPIRY_SECONDS,
    REFRESH_TOKEN_EXPIRY_DAYS, REFRESH_TOKEN_EXPIRY_SECONDS, MAX_SESSIONS,
    hash_password, verify_password,
)
from typing import Optional

def to_safe_user(user) -> dict:
    return {
        "id": str(user.id),
        "email": user.email or "",
        "username": user.username,
        "name": user.name,
        "img": user.img,
    }

async def _issue_token_pair(
    db: AsyncSession,
    user,
    roles: list[str],
    req_ctx: dict,
) -> dict:
    raw_refresh = generate_refresh_token()
    hashed = hash_token(raw_refresh)
    family = generate_token_family()

    # Enforce max sessions
    count = await refresh_token_provider.count_active_sessions(db, user.id)
    if count >= MAX_SESSIONS:
        oldest = await refresh_token_provider.find_oldest_active_session(db, user.id)
        if oldest:
            await refresh_token_provider.revoke_by_id(db, oldest.id, "session_limit")

    # Extract IP
    headers = req_ctx.get("headers", {})
    ip = headers.get("x-forwarded-for") or req_ctx.get("ip")
    if isinstance(ip, list):
        ip = ip[0] if ip else None
    device_info = headers.get("user-agent")

    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)
    await refresh_token_provider.create(
        db,
        user_id=user.id,
        token=hashed,
        token_family=family,
        device_info=device_info,
        ip_address=ip,
        expires_at=expires_at,
    )

    access_token = generate_access_token(user.id, user.token_version, user.email or "", roles)
    return {"accessToken": access_token, "refreshToken": raw_refresh}

async def register(db: AsyncSession, dto: dict, req_ctx: dict = {}) -> dict:
    existing = await user_provider.find_by_email(db, dto["email"])
    if existing:
        raise AppError(409, "Email already registered")
    hashed_pw = hash_password(dto["password"])
    user = await user_provider.create(db, email=dto["email"], password=hashed_pw, username=dto.get("username"), name=dto.get("name"))
    role_name = dto.get("role") or "CUSTOMER"
    role = await role_provider.find_by_name(db, role_name)
    if role:
        await role_provider.assign_role(db, user.id, role.id)
    roles = [role_name]
    tokens = await _issue_token_pair(db, user, roles, req_ctx)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)).isoformat()
    refresh_expires_at = (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)).isoformat()
    return {"token": tokens["accessToken"], "expiresAt": expires_at, "refreshToken": tokens["refreshToken"], "refreshTokenExpiresAt": refresh_expires_at, "user": to_safe_user(user), "role": roles}

async def guest_register(db: AsyncSession, dto: dict) -> dict:
    existing = await user_provider.find_by_phone(db, dto["phone"])
    if existing:
        user = existing
    else:
        user = await user_provider.create_guest(db, name=dto["name"], phone=dto["phone"], is_guest=True)
    roles = ["GUEST"]
    tokens = await _issue_token_pair(db, user, roles, {})
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)).isoformat()
    return {"token": tokens["accessToken"], "expiresAt": expires_at, "user": to_safe_user(user), "role": roles}

async def login(db: AsyncSession, dto: dict, req_ctx: dict = {}) -> dict:
    user = await user_provider.find_by_email(db, dto["email"])
    if not user or not user.password:
        raise AppError(401, "Invalid email or password")
    if not verify_password(dto["password"], user.password):
        raise AppError(401, "Invalid email or password")
    roles = [ur.role.name for ur in user.roles if not ur.deleted] if user.roles else ["CUSTOMER"]
    if not roles:
        roles = ["CUSTOMER"]
    tokens = await _issue_token_pair(db, user, roles, req_ctx)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)).isoformat()
    refresh_expires_at = (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)).isoformat()
    return {"token": tokens["accessToken"], "expiresAt": expires_at, "refreshToken": tokens["refreshToken"], "refreshTokenExpiresAt": refresh_expires_at, "user": to_safe_user(user), "role": roles}

async def refresh_tokens(db: AsyncSession, raw_token: str, req_ctx: dict = {}) -> dict:
    hashed = hash_token(raw_token)
    stored = await refresh_token_provider.find_by_token(db, hashed)
    if not stored:
        raise AppError(401, "Invalid refresh token")
    if stored.revoked:
        await refresh_token_provider.revoke_family(db, stored.token_family)
        raise AppError(401, "Security alert: token reuse detected")
    if stored.expires_at < datetime.now(timezone.utc):
        raise AppError(401, "Refresh token expired")
    user = await user_provider.find_by_id(db, stored.user_id)
    if not user or user.deleted or not user.active:
        raise AppError(401, "User not found")
    await refresh_token_provider.revoke_by_id(db, stored.id, "rotation")
    roles = [ur.role.name for ur in user.roles if not ur.deleted] if user.roles else ["CUSTOMER"]
    tokens = await _issue_token_pair(db, user, roles, req_ctx)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)
    return {"accessToken": tokens["accessToken"], "expiresAt": expires_at.isoformat(), "expiresIn": ACCESS_TOKEN_EXPIRY_SECONDS, "refreshToken": tokens["refreshToken"], "refreshExpires": REFRESH_TOKEN_EXPIRY_SECONDS}

async def logout(db: AsyncSession, raw_token: str) -> None:
    if not raw_token:
        return
    hashed = hash_token(raw_token)
    stored = await refresh_token_provider.find_by_token(db, hashed)
    if stored:
        await refresh_token_provider.revoke_by_id(db, stored.id, "logout")

async def logout_all(db: AsyncSession, user_id: int) -> None:
    await db.execute(update(__import__('app.models.user', fromlist=['User']).User).where(__import__('app.models.user', fromlist=['User']).User.id == user_id).values(token_version=__import__('app.models.user', fromlist=['User']).User.token_version + 1))
    await db.commit()
    await refresh_token_provider.revoke_all_for_user(db, user_id)

async def change_password(db: AsyncSession, user_id: int, current_password: str, new_password: str, req_ctx: dict = {}) -> dict:
    from app.models.user import User as UserModel
    user = await user_provider.find_by_id(db, user_id)
    if not user:
        raise AppError(404, "User not found")
    if not verify_password(current_password, user.password or ""):
        raise AppError(401, "Current password is incorrect")
    if len(new_password) < 8:
        raise AppError(400, "New password must be at least 8 characters")
    new_hash = hash_password(new_password)
    await db.execute(update(UserModel).where(UserModel.id == user_id).values(password=new_hash, token_version=UserModel.token_version + 1))
    await db.commit()
    await refresh_token_provider.revoke_all_for_user(db, user_id)
    updated_user = await user_provider.find_by_id(db, user_id)
    roles = [ur.role.name for ur in updated_user.roles if not ur.deleted] if updated_user and updated_user.roles else ["CUSTOMER"]
    tokens = await _issue_token_pair(db, updated_user, roles, req_ctx)
    return tokens

async def me(db: AsyncSession, user_id: str) -> dict:
    user = await user_provider.find_by_id(db, int(user_id))
    if not user:
        raise AppError(404, "User not found")
    roles = [ur.role.name for ur in user.roles if not ur.deleted] if user.roles else ["CUSTOMER"]
    return {**to_safe_user(user), "role": roles or ["CUSTOMER"]}
