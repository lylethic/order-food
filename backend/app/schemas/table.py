from pydantic import BaseModel, Field
from typing import Optional, List

class BatchQRRequest(BaseModel):
    from_: Optional[int] = Field(None, alias="from")
    to: Optional[int] = None
    tables: Optional[List[str]] = None

    model_config = {"populate_by_name": True}

class VerifyTableResponse(BaseModel):
    valid: bool
    tableNumber: Optional[str] = None

class TableQRResponse(BaseModel):
    tableNumber: str
    url: str
    token: str

class BatchQRResponse(BaseModel):
    tables: List[TableQRResponse]
