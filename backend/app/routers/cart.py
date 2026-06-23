from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import optional_authenticate, UserContext
from app.schemas.cart import (
    AddToCartRequest,
    UpdateCartItemRequest,
    CartOut,
    CartItemOut,
)
from app.schemas.common import ApiResponse
from app.services import cart_service
from app.utils.response import send_response
from typing import Optional

router = APIRouter()


@router.get("/cart", response_model=ApiResponse[CartOut])
async def get_cart(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserContext] = Depends(optional_authenticate),
):
    user_id = int(current_user.user_id) if current_user else None
    session_id = request.headers.get("x-session-id")
    cart = await cart_service.get_cart(db, user_id=user_id, session_id=session_id)
    return send_response(
        data=cart,
        message="Lấy giỏ hàng thành công",
        message_en="Cart retrieved successfully",
    )


@router.post("/cart/add", response_model=ApiResponse[CartItemOut])
async def add_to_cart(
    body: AddToCartRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserContext] = Depends(optional_authenticate),
):
    user_id = int(current_user.user_id) if current_user else None
    session_id = request.headers.get("x-session-id")
    item = await cart_service.add_to_cart(
        db,
        int(body.menu_item_id),
        body.quantity,
        body.modifications,
        user_id=user_id,
        session_id=session_id,
    )
    return send_response(
        data=item,
        message="Thêm vào giỏ hàng thành công",
        message_en="Item added to cart successfully",
    )


@router.put("/cart/update-item/{id}", response_model=ApiResponse[CartItemOut])
async def update_cart_item(
    id: int, body: UpdateCartItemRequest, db: AsyncSession = Depends(get_db)
):
    item = await cart_service.update_cart_item(
        db, id, body.quantity, body.modifications
    )
    return send_response(
        data=item,
        message="Cập nhật giỏ hàng thành công",
        message_en="Cart item updated successfully",
    )


@router.delete("/cart/remove/{id}", response_model=ApiResponse[None])
async def remove_from_cart(id: int, db: AsyncSession = Depends(get_db)):
    await cart_service.remove_from_cart(db, id)
    return send_response(
        message="Xóa khỏi giỏ hàng thành công",
        message_en="Item removed from cart successfully",
    )
