from sqlalchemy import BigInteger, String, Boolean, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from .base import Base


class MenuItemComment(Base):
    __tablename__ = "menu_item_comments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Visible", nullable=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="menu_item_comments")
    user: Mapped["User"] = relationship("User", foreign_keys=[customer_id], back_populates="menu_item_comments")
    replies: Mapped[List["MenuItemCommentReply"]] = relationship("MenuItemCommentReply", back_populates="comment", cascade="all, delete-orphan")
