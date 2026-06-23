from sqlalchemy import BigInteger, String, Boolean, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base import Base


class MenuItemImage(Base):
    __tablename__ = "menu_item_images"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    is_primary: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    display_order: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="menu_item_images")
