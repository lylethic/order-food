from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class VatConfigurationCreate(BaseModel):
    name: str
    rate: Decimal
    is_global: bool = False
    menu_item_id: Optional[int] = None


class VatConfigurationUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[Decimal] = None
    is_global: Optional[bool] = None
    menu_item_id: Optional[int] = None


class VatConfigurationOut(BaseModel):
    id: int
    name: str
    rate: Decimal
    is_global: bool
    menu_item_id: Optional[int] = None
    deleted: bool
    active: bool

    model_config = {"from_attributes": True}
