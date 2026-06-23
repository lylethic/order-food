from sqlalchemy import BigInteger, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base import Base


class MenuItemCommentReply(Base):
    __tablename__ = "menu_item_comment_replies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    comment_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("menu_item_comments.id", ondelete="CASCADE"), nullable=False)
    staff_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    comment: Mapped["MenuItemComment"] = relationship("MenuItemComment", back_populates="replies")
    user: Mapped["User"] = relationship("User", foreign_keys=[staff_id], back_populates="menu_item_comment_replies")
