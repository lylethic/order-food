import hmac
import hashlib
from app.utils.app_error import AppError
from app.config import settings

MAX_TABLE_NUMBER_LENGTH = 10

def _get_secret() -> str:
    if not settings.QR_SECRET:
        raise AppError(500, "QR_SECRET chưa được cấu hình")
    return settings.QR_SECRET

def validate_table_number(table_number: str) -> None:
    if not table_number or not table_number.strip():
        raise AppError(400, "Số bàn không được để trống")
    if len(table_number) > MAX_TABLE_NUMBER_LENGTH:
        raise AppError(400, f"Số bàn không được quá {MAX_TABLE_NUMBER_LENGTH} ký tự")

def generate_token(table_number: str) -> str:
    secret = _get_secret()
    return hmac.new(secret.encode(), table_number.encode(), hashlib.sha256).hexdigest()[:16]

def verify_token(table_number: str, token: str) -> bool:
    if not token or len(token) < 16:
        return False
    try:
        expected = generate_token(table_number)
        provided = token[:16]
        return hmac.compare_digest(expected.encode(), provided.encode())
    except Exception:
        return False

def generate_qr_url(table_number: str) -> str:
    token = generate_token(table_number)
    base = settings.FRONTEND_URL.rstrip("/")
    from urllib.parse import quote
    return f"{base}/scan?table={quote(table_number)}&sid={token}"
