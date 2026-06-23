from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    is_guest: Optional[bool] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    img: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    img: Optional[str] = None
    active: bool
    deleted: bool
    is_guest: Optional[bool] = None

    model_config = {"from_attributes": True}
