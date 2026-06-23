from pydantic import BaseModel
from typing import Optional, List

class OrderItemCreate(BaseModel):
    menuItemId: str
    qty: int
    modifications: Optional[List[str]] = []

class CreateOrderRequest(BaseModel):
    tableNumber: str
    items: List[OrderItemCreate]
    customerId: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UpdateStatusRequest(BaseModel):
    status: str

class MarkOrderPaidRequest(BaseModel):
    paymentMethod: str
