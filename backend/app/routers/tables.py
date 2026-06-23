from fastapi import APIRouter, Depends
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_admin
from app.services import table_service
from app.utils.response import send_response
from app.utils.app_error import AppError
from app.schemas.table import BatchQRRequest, VerifyTableResponse, TableQRResponse, BatchQRResponse
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("/tables/verify", response_model=ApiResponse[VerifyTableResponse])
async def verify_table(table: str, sid: str):
    if not table or not sid:
        raise AppError(400, "Thiếu tham số table hoặc sid")
    table_service.validate_table_number(table)
    valid = table_service.verify_token(table, sid)
    return send_response(
        data={"valid": valid, "tableNumber": table if valid else None},
        message="Token hợp lệ" if valid else "Token không hợp lệ",
        message_en="Token valid" if valid else "Token invalid",
    )

@router.post("/tables/{tableNumber}/qr", response_model=ApiResponse[TableQRResponse])
async def generate_qr(tableNumber: str, current_user: UserContext = Depends(is_admin)):
    table_service.validate_table_number(tableNumber)
    url = table_service.generate_qr_url(tableNumber)
    token = table_service.generate_token(tableNumber)
    return send_response(
        data={"tableNumber": tableNumber, "url": url, "token": token},
        message="Tạo QR thành công",
        message_en="QR generated successfully",
    )

@router.post("/tables/qr/batch", response_model=ApiResponse[BatchQRResponse])
async def generate_qr_batch(body: BatchQRRequest, current_user: UserContext = Depends(is_admin)):
    tables_list = body.tables
    from_ = body.from_
    to_ = body.to
    table_numbers = []

    if tables_list and isinstance(tables_list, list) and len(tables_list) > 0:
        if len(tables_list) > 300:
            raise AppError(400, "Tối đa 300 bàn mỗi lần")
        table_numbers = [str(t) for t in tables_list]
    elif from_ is not None and to_ is not None:
        from_n, to_n = int(from_), int(to_)
        if from_n < 1 or to_n < from_n:
            raise AppError(400, "Phạm vi không hợp lệ (from ≥ 1, to ≥ from)")
        if to_n - from_n + 1 > 300:
            raise AppError(400, "Tối đa 300 bàn mỗi lần")
        table_numbers = [str(i) for i in range(from_n, to_n + 1)]
    else:
        raise AppError(400, "Cần cung cấp { from, to } hoặc { tables: [...] }")

    tables_data = []
    for tn in table_numbers:
        table_service.validate_table_number(tn)
        tables_data.append({
            "tableNumber": tn,
            "url": table_service.generate_qr_url(tn),
            "token": table_service.generate_token(tn),
        })

    return send_response(
        data={"tables": tables_data},
        message=f"Tạo QR cho {len(tables_data)} bàn thành công",
        message_en=f"QR generated for {len(tables_data)} tables",
    )
