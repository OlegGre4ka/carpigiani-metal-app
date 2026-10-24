from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EquipmentCategory(Base):
    """Category of equipment or showcases. Shown as a card on the page of its brand:
    Carpigiani categories on the home page and /carpigiani, IFI on /ifi, ISA on /isa."""

    __tablename__ = "equipment_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Whose category it is: "carpigiani" (equipment), "ifi" or "isa" (showcases)
    brand: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="carpigiani",
        server_default="carpigiani",
        index=True,
    )
    title_uk: Mapped[str] = mapped_column(String(120), nullable=False)
    title_en: Mapped[str] = mapped_column(String(120), nullable=False)
    # Address of the category page: a page of the site (/gelato) or a full address (https://...)
    href: Mapped[str] = mapped_column(String(500), nullable=False)
    # File name of the photo in the uploads folder (always WebP)
    image: Mapped[str] = mapped_column(String(255), nullable=False)
    # Order on the page: smaller number goes first
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
