from pydantic import BaseModel
from typing import Optional, List

class AddToCartRequest(BaseModel):
    menu_item_id: str
    quantity: int = 1
    modifications: List[str] = []

class UpdateCartItemRequest(BaseModel):
    quantity: int
    modifications: Optional[List[str]] = None

class CartItemOut(BaseModel):
    id: str
    cart_id: str
    menu_item_id: str
    quantity: int
    modifications: Optional[List[str]] = None
    created: str

    model_config = {"from_attributes": True}

class CartOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    created: str
    updated: Optional[str] = None
    items: List[CartItemOut] = []

    model_config = {"from_attributes": True}
