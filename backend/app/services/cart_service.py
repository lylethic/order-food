from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.cart_provider import cart_provider
from app.providers.menu_item_provider import menu_item_provider
from app.utils.app_error import AppError
from typing import Optional, List

async def get_cart(db: AsyncSession, user_id: Optional[int] = None, session_id: Optional[str] = None):
    if not user_id and not session_id:
        raise AppError(400, "UserId or SessionId is required")
    cart = None
    if user_id:
        cart = await cart_provider.find_by_user_id(db, user_id)
    elif session_id:
        cart = await cart_provider.find_by_session_id(db, session_id)
    if not cart:
        cart = await cart_provider.create(db, user_id=user_id, session_id=session_id if not user_id else None)
    return cart

async def add_to_cart(db: AsyncSession, menu_item_id: int, quantity: int, modifications: List[str], user_id: Optional[int] = None, session_id: Optional[str] = None):
    menu_item = await menu_item_provider.find_by_id(db, menu_item_id)
    if not menu_item or not menu_item.active:
        raise AppError(404, "Món ăn không tồn tại hoặc đã ngừng kinh doanh")
    cart = await get_cart(db, user_id, session_id)
    existing = await cart_provider.find_item(db, cart.id, menu_item_id, modifications)
    if existing:
        return await cart_provider.update_item(db, existing.id, quantity=(existing.quantity or 0) + quantity)
    return await cart_provider.add_item(db, cart.id, menu_item_id, quantity, modifications)

async def update_cart_item(db: AsyncSession, item_id: int, quantity: int, modifications: Optional[List[str]] = None):
    if quantity <= 0:
        await cart_provider.remove_item(db, item_id)
        return None
    data = {"quantity": quantity}
    if modifications is not None:
        data["modifications"] = modifications
    return await cart_provider.update_item(db, item_id, **data)

async def remove_from_cart(db: AsyncSession, item_id: int):
    await cart_provider.remove_item(db, item_id)

async def clear_cart(db: AsyncSession, user_id: Optional[int] = None, session_id: Optional[str] = None):
    if not user_id and not session_id:
        return
    cart = None
    if user_id:
        cart = await cart_provider.find_by_user_id(db, user_id)
    elif session_id:
        cart = await cart_provider.find_by_session_id(db, session_id)
    if cart:
        await cart_provider.clear_items_by_cart_id(db, cart.id)

async def merge_cart(db: AsyncSession, user_id: int, session_id: str):
    guest_cart = await cart_provider.find_by_session_id(db, session_id)
    if not guest_cart or not guest_cart.cart_items:
        return
    user_cart = await cart_provider.find_by_user_id(db, user_id)
    if not user_cart:
        user_cart = await cart_provider.create(db, user_id=user_id)
    for item in guest_cart.cart_items:
        if item.deleted:
            continue
        existing = await cart_provider.find_item(db, user_cart.id, item.menu_item_id, item.modifications or [])
        if existing:
            await cart_provider.update_item(db, existing.id, quantity=(existing.quantity or 0) + (item.quantity or 0))
            await cart_provider.delete_item(db, item.id)
        else:
            await cart_provider.update_item(db, item.id, cart_id=user_cart.id)
    await cart_provider.delete_cart(db, guest_cart.id)
