from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CategoryPage(Base):
    """Page of an equipment category on the site (e.g. /gelato).

    The page is built from blocks (slider, text, photos, table...), kept as a list in `blocks`
    in the order they go on the site. The shape of every block is in app/schemas/page_blocks.py.
    """

    __tablename__ = "category_pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # One page per category; the page goes away together with its category
    category_id: Mapped[int] = mapped_column(
        ForeignKey("equipment_categories.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    title_uk: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), nullable=False)
    blocks: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
