from fastapi import APIRouter
from app.utils.response import send_response
from app.schemas.common import ApiResponse
from typing import Any

router = APIRouter()

@router.get("/health", response_model=ApiResponse[Any])
async def health_check():
    return send_response(data={"status": "ok"}, message="Server is healthy", message_en="Server is healthy")
