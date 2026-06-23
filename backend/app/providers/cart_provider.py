from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.menu_item import MenuItem
from app.models.menu_item_image import MenuItemImage

class CartProvider:
    async def find_by_user_id(self, db: AsyncSession, user_id: int) -> Optional[Cart]:
        result = await db.execute(
            select(Cart)
            .options(selectinload(Cart.cart_items).selectinload(CartItem.menu_item).selectinload(MenuItem.menu_item_images))
            .where(Cart.user_id == user_id, Cart.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_by_session_id(self, db: AsyncSession, session_id: str) -> Optional[Cart]:
        result = await db.execute(
            select(Cart)
            .options(selectinload(Cart.cart_items).selectinload(CartItem.menu_item).selectinload(MenuItem.menu_item_images))
            .where(Cart.session_id == session_id, Cart.user_id.is_(None), Cart.deleted == False)
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Cart:
        cart = Cart(user_id=user_id, session_id=session_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        return cart

    async def find_item(self, db: AsyncSession, cart_id: int, menu_item_id: int, modifications: List[str]) -> Optional[CartItem]:
        result = await db.execute(
            select(CartItem).where(
                CartItem.cart_id == cart_id,
                CartItem.menu_item_id == menu_item_id,
                CartItem.modifications == modifications,
                CartItem.deleted == False,
            )
        )
        return result.scalar_one_or_none()

    async def add_item(self, db: AsyncSession, cart_id: int, menu_item_id: int, quantity: int, modifications: List[str]) -> CartItem:
        item = CartItem(cart_id=cart_id, menu_item_id=menu_item_id, quantity=quantity, modifications=modifications)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    async def update_item(self, db: AsyncSession, item_id: int, **data) -> Optional[CartItem]:
        await db.execute(update(CartItem).where(CartItem.id == item_id).values(**data))
        await db.commit()
        result = await db.execute(select(CartItem).where(CartItem.id == item_id))
        return result.scalar_one_or_none()

    async def remove_item(self, db: AsyncSession, item_id: int) -> None:
        await db.execute(update(CartItem).where(CartItem.id == item_id).values(deleted=True))
        await db.commit()

    async def delete_item(self, db: AsyncSession, item_id: int) -> None:
        await db.execute(delete(CartItem).where(CartItem.id == item_id))
        await db.commit()

    async def delete_cart(self, db: AsyncSession, cart_id: int) -> None:
        await db.execute(update(Cart).where(Cart.id == cart_id).values(deleted=True))
        await db.commit()

    async def clear_items_by_cart_id(self, db: AsyncSession, cart_id: int) -> None:
        await db.execute(update(CartItem).where(CartItem.cart_id == cart_id, CartItem.deleted == False).values(deleted=True))
        await db.commit()

cart_provider = CartProvider()
