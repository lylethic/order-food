from pydantic import BaseModel, field_validator
from typing import Generic, TypeVar, Optional, Any, List

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    status_code: int = 200
    message: str = ""
    message_en: str = ""
    data: Optional[T] = None
    errors: List[Any] = []

class BaseSearchRequest(BaseModel):
    search: Optional[str] = None
    limit: int = 10
    cursor: Optional[int] = None
    order: str = "desc"

    @field_validator("order")
    @classmethod
    def validate_order(cls, v: str) -> str:
        if v not in ("asc", "desc"):
            return "desc"
        return v

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v: int) -> int:
        if v < 1:
            return 1
        if v > 100:
            return 100
        return v

class MenuItemCategorySearchRequest(BaseSearchRequest):
    categoryId: Optional[int] = None

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    limit: int
    nextCursor: Optional[int] = None
    hasNextPage: bool
