from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Brand(Base):
    """A manufacturer whose equipment the site shows (Carpigiani, IFI, ISA, ...): the top level
    of the catalogue. Brand → its categories → their subcategories → equipment.
    The site's "Manufacturers" menu and the "Equipment catalog" menu are built from this table.
    A hidden brand is not shown anywhere on the site (menus, its page, its categories)."""

    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Short name in the address, also the link of its categories: "ifi" → page /ifi
    key: Mapped[str] = mapped_column(
        String(40), nullable=False, unique=True, index=True
    )
    title_uk: Mapped[str] = mapped_column(String(120), nullable=False)
    title_en: Mapped[str] = mapped_column(String(120), nullable=False)
    # Logo: a file in the uploads folder ("brands/abc.webp") or a picture of the site ("/images/...")
    logo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Order in the menus: smaller number goes first
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Its page on the site (/ifi), built in the admin panel like the pages of categories.
    # Title: empty until the page is saved (the site then shows the name of the brand).
    page_title_uk: Mapped[str | None] = mapped_column(String(200), nullable=True)
    page_title_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Line under the title; empty: not shown
    subtitle_uk: Mapped[str] = mapped_column(String(400), nullable=False, default="")
    subtitle_en: Mapped[str] = mapped_column(String(400), nullable=False, default="")
    # Blocks of the page (the same as on category pages, plus "Categories": its category cards);
    # null: never saved, the page shows only the category cards
    blocks: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # All its equipment with filter chips (by category) at the bottom of the page
    show_equipment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Categories whose filter chip is switched off (their equipment stays under "All")
    hidden_chips: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    @property
    def href(self) -> str:
        """Address of the brand's page on the site."""
        return f"/{self.key}"
