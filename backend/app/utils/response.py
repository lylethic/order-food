from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Any, Optional

def send_response(
    data: Any = None,
    message: str = "",
    message_en: str = "",
    status_code: int = 200,
    success: bool = True,
    errors: list = [],
) -> JSONResponse:
    content = {
        "success": success,
        "status_code": status_code,
        "message": message,
        "message_en": message_en,
        "data": data,
        "errors": errors,
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content),
    )
