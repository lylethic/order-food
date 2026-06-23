from fastapi import APIRouter, Depends, Request, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.schemas.common import ApiResponse
from app.schemas.auth import RegisterRequest, GuestRegisterRequest, LoginRequest, RefreshRequest, ChangePasswordRequest, AuthResponse, TokenPairResponse, SafeUser
from app.services import auth_service, cart_service
from app.utils.response import send_response
from app.utils.app_error import AppError
from app.config import settings

ROOT_PATH = "/api/v1/auth"
COOKIE_MAX_AGE = settings.REFRESHTOKEN_EXPIRYTIME * 24 * 60 * 60

router = APIRouter()

@router.post("/auth/register", response_model=ApiResponse[AuthResponse])
async def register(body: RegisterRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    req_ctx = {"headers": dict(request.headers), "ip": request.client.host if request.client else None}
    result = await auth_service.register(db, body.model_dump(), req_ctx)
    refresh_token = result.get("refreshToken", "")
    session_id = request.headers.get("x-session-id")
    if session_id and result.get("user"):
        try:
            await cart_service.merge_cart(db, int(result["user"]["id"]), session_id)
        except Exception:
            pass
    response.set_cookie("refreshToken", refresh_token, httponly=True, secure=settings.is_production, samesite="strict", path=ROOT_PATH, max_age=COOKIE_MAX_AGE)
    return send_response(data=result, message="Đăng ký tài khoản thành công", message_en="Account registered successfully")

@router.post("/auth/guestRegister", response_model=ApiResponse[AuthResponse])
async def guest_register(body: GuestRegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.guest_register(db, body.model_dump())
    return send_response(data=result, message="Đăng ký tài khoản thành công", message_en="Account registered successfully")

@router.post("/auth/login", response_model=ApiResponse[AuthResponse])
async def login(body: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    req_ctx = {"headers": dict(request.headers), "ip": request.client.host if request.client else None}
    try:
        result = await auth_service.login(db, body.model_dump(), req_ctx)
    except AppError as e:
        if e.status_code == 401:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=422, content={"success": False, "status_code": 422, "message": "Email hoặc password không đúng", "message_en": "Invalid email or password", "data": None, "errors": [{"field": "password", "message": "Email hoặc password không đúng"}]})
        raise
    session_id = request.headers.get("x-session-id")
    if session_id and result.get("user"):
        try:
            await cart_service.merge_cart(db, int(result["user"]["id"]), session_id)
        except Exception:
            pass
    refresh_token = result.get("refreshToken", "")
    response.set_cookie("refreshToken", refresh_token, httponly=True, secure=settings.is_production, samesite="strict", path=ROOT_PATH, max_age=COOKIE_MAX_AGE)
    return send_response(data=result, message="Đăng nhập thành công", message_en="Login successful")

@router.post("/auth/refresh", response_model=ApiResponse[TokenPairResponse])
async def refresh(request: Request, response: Response, body: RefreshRequest = RefreshRequest(), db: AsyncSession = Depends(get_db)):
    raw_token = request.cookies.get("refreshToken") or (body.refreshToken if body else None)
    if not raw_token:
        return send_response(success=False, status_code=401, message="Refresh token required", errors=[])
    req_ctx = {"headers": dict(request.headers), "ip": request.client.host if request.client else None}
    result = await auth_service.refresh_tokens(db, raw_token, req_ctx)
    response.set_cookie("refreshToken", result["refreshToken"], httponly=True, secure=settings.is_production, samesite="strict", path=ROOT_PATH, max_age=COOKIE_MAX_AGE)
    return send_response(data=result, message="Token refreshed", message_en="Token refreshed")

@router.post("/auth/logout", response_model=ApiResponse[None])
async def logout(request: Request, response: Response, body: RefreshRequest = RefreshRequest(), db: AsyncSession = Depends(get_db)):
    raw_token = request.cookies.get("refreshToken") or (body.refreshToken if body else "") or ""
    await auth_service.logout(db, raw_token)
    response.delete_cookie("refreshToken", path=ROOT_PATH)
    return send_response(message="Đăng xuất thành công", message_en="Logged out")

@router.post("/auth/logout-all", response_model=ApiResponse[None])
async def logout_all(response: Response, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    await auth_service.logout_all(db, int(current_user.user_id))
    response.delete_cookie("refreshToken", path=ROOT_PATH)
    return send_response(message="Tất cả phiên đã bị thu hồi", message_en="All sessions revoked")

@router.post("/auth/change-password", response_model=ApiResponse[TokenPairResponse])
async def change_password(body: ChangePasswordRequest, request: Request, response: Response, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    req_ctx = {"headers": dict(request.headers), "ip": request.client.host if request.client else None}
    result = await auth_service.change_password(db, int(current_user.user_id), body.currentPassword, body.newPassword, req_ctx)
    response.set_cookie("refreshToken", result.get("refreshToken", ""), httponly=True, secure=settings.is_production, samesite="strict", path=ROOT_PATH, max_age=COOKIE_MAX_AGE)
    return send_response(data=result, message="Đổi mật khẩu thành công", message_en="Password changed")

@router.get("/auth/me", response_model=ApiResponse[SafeUser])
async def me(current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    user = await auth_service.me(db, current_user.user_id)
    return send_response(data=user, message="Lấy thông tin người dùng thành công", message_en="User profile retrieved successfully")
