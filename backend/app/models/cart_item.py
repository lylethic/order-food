from sqlalchemy import BigInteger, Integer, Boolean, DateTime, ForeignKey, func, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
from typing import Optional, List
from .base import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    cart_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("menu_items.id"), nullable=False)
    quantity: Mapped[Optional[int]] = mapped_column(Integer, default=1, nullable=True)
    modifications: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="cart_items")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="cart_items")
