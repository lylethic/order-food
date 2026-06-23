from fastapi import APIRouter, Depends, UploadFile, File
from app.middleware.auth import authenticate, UserContext
from app.services import static_file_service
from app.utils.response import send_response
from app.utils.app_error import AppError

router = APIRouter()

@router.post("/files/upload")
async def upload_file(file: UploadFile = File(...), current_user: UserContext = Depends(authenticate)):
    url = await static_file_service.save_upload(file)
    return send_response(data={"url": url}, message="Tải file lên thành công", message_en="File uploaded successfully")

@router.delete("/files/delete")
async def delete_file(url: str, current_user: UserContext = Depends(authenticate)):
    deleted = static_file_service.delete_file(url)
    return send_response(data={"deleted": deleted}, message="Xóa file thành công", message_en="File deleted successfully")
