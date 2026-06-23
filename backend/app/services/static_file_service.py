import os
import uuid
from typing import Optional
from app.config import settings
from app.utils.app_error import AppError

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/bmp", "application/pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_url(filename: str) -> str:
    return f"{settings.API_PUBLIC_URL}/uploads/{filename}"

def get_path_from_url(url: str) -> Optional[str]:
    """Extract local file path from URL."""
    prefix = f"{settings.API_PUBLIC_URL}/uploads/"
    if url.startswith(prefix):
        return os.path.join(UPLOAD_DIR, url[len(prefix):])
    # Relative path
    if url.startswith("uploads/"):
        return url
    return None

def delete_file(url_or_path: str) -> bool:
    path = get_path_from_url(url_or_path) or url_or_path
    try:
        if os.path.exists(path):
            os.remove(path)
            return True
        return False
    except Exception:
        return False

async def save_upload(file, allowed_types=None) -> str:
    """Save an UploadFile and return the URL."""
    ensure_upload_dir()
    at = allowed_types or ALLOWED_TYPES
    if file.content_type not in at:
        raise AppError(415, "Unsupported file type")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise AppError(413, "File too large (max 10 MB)")
    ext = (file.filename or "file").rsplit(".", 1)[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    return get_url(filename)
