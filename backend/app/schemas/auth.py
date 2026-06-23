from pydantic import BaseModel, EmailStr
from typing import Optional, List

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None

class GuestRegisterRequest(BaseModel):
    name: str
    phone: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refreshToken: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class SafeUser(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    name: Optional[str] = None
    img: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    expiresAt: str
    user: SafeUser
    role: List[str]
    refreshToken: Optional[str] = None
    refreshTokenExpiresAt: Optional[str] = None

class TokenPairResponse(BaseModel):
    accessToken: str
    expiresAt: str
    expiresIn: int
    refreshToken: str
    refreshExpires: int
