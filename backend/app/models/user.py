from sqlalchemy import BigInteger, String, Boolean, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List
from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    img: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_guest: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    token_version: Mapped[int] = mapped_column(Integer, default=0)

    roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user", lazy="selectin")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    cart: Mapped[Optional["Cart"]] = relationship("Cart", back_populates="user", uselist=False)
    menu_item_comments: Mapped[List["MenuItemComment"]] = relationship("MenuItemComment", back_populates="user")
    menu_item_comment_replies: Mapped[List["MenuItemCommentReply"]] = relationship("MenuItemCommentReply", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
