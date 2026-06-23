from sqlalchemy import BigInteger, String, Boolean, DateTime, Numeric, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from decimal import Decimal
from .base import Base


class VatConfiguration(Base):
    __tablename__ = "vat_configurations"

    __table_args__ = (
        CheckConstraint(
            "(is_global = true AND menu_item_id IS NULL) OR (is_global = false AND menu_item_id IS NOT NULL)",
            name="vat_config_target_check",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    is_global: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    menu_item_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("menu_items.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=True
    )
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    menu_item: Mapped[Optional["MenuItem"]] = relationship("MenuItem", back_populates="vat_configuration")