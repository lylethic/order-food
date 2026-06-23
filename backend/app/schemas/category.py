from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    img: Optional[str] = None

class CategoryOut(BaseModel):
    id: str
    name: str
    img: Optional[str] = None
    deleted: bool
    active: bool

    model_config = {"from_attributes": True}
