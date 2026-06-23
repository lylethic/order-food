from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Optional, List
from app.models.menu_item_image import MenuItemImage

class MenuItemImageProvider:
    async def find_by_menu_item(self, db: AsyncSession, menu_item_id: int) -> List[MenuItemImage]:
        result = await db.execute(
            select(MenuItemImage)
            .where(MenuItemImage.menu_item_id == menu_item_id)
            .order_by(MenuItemImage.is_primary.desc(), MenuItemImage.display_order.asc())
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, menu_item_id: int, image_url: str, is_primary: bool = False, display_order: int = 0) -> MenuItemImage:
        img = MenuItemImage(menu_item_id=menu_item_id, image_url=image_url, is_primary=is_primary, display_order=display_order)
        db.add(img)
        await db.commit()
        await db.refresh(img)
        return img

    async def set_primary(self, db: AsyncSession, menu_item_id: int, image_id: int) -> None:
        await db.execute(update(MenuItemImage).where(MenuItemImage.menu_item_id == menu_item_id).values(is_primary=False))
        await db.execute(update(MenuItemImage).where(MenuItemImage.id == image_id).values(is_primary=True))
        await db.commit()

    async def delete(self, db: AsyncSession, image_id: int) -> None:
        await db.execute(delete(MenuItemImage).where(MenuItemImage.id == image_id))
        await db.commit()

menu_item_image_provider = MenuItemImageProvider()
