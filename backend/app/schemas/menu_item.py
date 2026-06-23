from pydantic import BaseModel
from typing import Optional, List

class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[int] = None
    tag: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    tag: Optional[str] = None
    active: Optional[bool] = None

class MenuItemOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[str] = None
    tag: Optional[str] = None
    active: bool
    deleted: bool
    rating: Optional[float] = None
    
    model_config = {"from_attributes": True}
