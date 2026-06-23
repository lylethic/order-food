from sqlalchemy import BigInteger, String, Boolean, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from .base import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1), nullable=True)
    tag: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="menu_items")
    menu_item_images: Mapped[List["MenuItemImage"]] = relationship("MenuItemImage", back_populates="menu_item", cascade="all, delete-orphan")
    menu_item_comments: Mapped[List["MenuItemComment"]] = relationship("MenuItemComment", back_populates="menu_item", cascade="all, delete-orphan")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="menu_item")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="menu_item")
    vat_configuration: Mapped[Optional["VatConfiguration"]] = relationship("VatConfiguration", back_populates="menu_item", uselist=False)
