from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EquipmentPage(Base):
    """Page of one piece of equipment on the site (e.g. /labotronic).

    The equipment itself (name, photo, description, address of the page) is a card in the
    `items` of its subcategory; `item_id` is the id of that card. The page is built from
    the same blocks as category pages (app/schemas/page_blocks.py), in the same builder.
    """

    __tablename__ = "equipment_pages"
    __table_args__ = (UniqueConstraint("subcategory_id", "item_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # The page goes away together with its subcategory
    subcategory_id: Mapped[int] = mapped_column(
        ForeignKey("equipment_subcategories.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[str] = mapped_column(String(40), nullable=False)
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
