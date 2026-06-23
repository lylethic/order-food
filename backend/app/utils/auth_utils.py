import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.config import settings

ACCESS_TOKEN_EXPIRY_MINUTES = settings.ACCESS_TOKEN_EXPIRY
REFRESH_TOKEN_EXPIRY_DAYS = settings.REFRESHTOKEN_EXPIRYTIME
ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MINUTES * 60
ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_SECONDS * 1000
REFRESH_TOKEN_EXPIRY_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_SECONDS * 1000
MAX_SESSIONS = 5

def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()

import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError):
        return False

def generate_refresh_token() -> str:
    return secrets.token_hex(40)

def generate_token_family() -> str:
    return str(uuid.uuid4())

def generate_access_token(user_id: int, token_version: int, email: str, roles: list[str]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)
    payload = {
        "sub": str(user_id),
        "v": token_version,
        "userId": str(user_id),
        "email": email,
        "role": roles,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
