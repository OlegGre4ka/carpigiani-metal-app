from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EquipmentSubcategory(Base):
    """Subcategory of an equipment category (e.g. "Universal machines" in Gelato).

    It is a list of equipment shown on the category page by a "Subcategory" block.
    It has no page of its own on the site.
    """

    __tablename__ = "equipment_subcategories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # The subcategory goes away together with its category
    category_id: Mapped[int] = mapped_column(
        ForeignKey("equipment_categories.id", ondelete="CASCADE"), nullable=False
    )
    title_uk: Mapped[str] = mapped_column(String(120), nullable=False)
    title_en: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Equipment cards of the subcategory, in order (shape: app/schemas/pages.py)
    items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
