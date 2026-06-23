from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.config import settings
from app.database import get_db
from app.utils.app_error import AppError

security = HTTPBearer(auto_error=False)

class UserContext:
    def __init__(self, user_id: str, email: str, role: list[str]):
        self.user_id = user_id
        self.email = email
        self.role = role

async def _decode_token(token: str, db: AsyncSession) -> UserContext:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except ExpiredSignatureError:
        raise AppError(401, "Token expired")
    except JWTError:
        raise AppError(401, "Invalid token")

    user_id = payload.get("sub") or payload.get("userId")
    if not user_id:
        raise AppError(401, "Invalid token")

    # Version check
    if "v" in payload:
        from app.models.user import User
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user or user.deleted or not user.active:
            raise AppError(401, "User is inactive or deleted")
        if payload["v"] != user.token_version:
            raise AppError(401, "Token revoked")

    role = payload.get("role", [])
    if isinstance(role, str):
        role = [role]
    return UserContext(user_id=str(user_id), email=payload.get("email", ""), role=role)

async def authenticate(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    if not credentials:
        raise AppError(401, "Missing or invalid Authorization header")
    return await _decode_token(credentials.credentials, db)

async def optional_authenticate(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[UserContext]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    try:
        return await _decode_token(token, db)
    except HTTPException:
        return None
