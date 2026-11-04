from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class SupportPage(Base):
    """A page of the "Support" menu (4.11): Carpigiani Gelato University, Technologies, and any
    other the client adds in the admin panel. Built from blocks like a category page; a topic of
    news can be tied to it: the news of the topic go at the bottom of the page and into the menu
    of articles on the right. On the right also a card "contact us" with its own title and text
    and the contact form."""

    __tablename__ = "support_pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title_uk: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    href: Mapped[str] = mapped_column(String(300), nullable=False, unique=True)
    # Order in the "Support" menu: smaller number goes first
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # The topic of news shown on the page (deleting the topic keeps the page, without articles)
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("news_topics.id", ondelete="SET NULL"), nullable=True
    )
    blocks: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # The card "contact us" on the right
    contact_title_uk: Mapped[str] = mapped_column(
        String(200), nullable=False, default=""
    )
    contact_title_en: Mapped[str] = mapped_column(
        String(200), nullable=False, default=""
    )
    contact_text_uk: Mapped[str] = mapped_column(
        String(600), nullable=False, default=""
    )
    contact_text_en: Mapped[str] = mapped_column(
        String(600), nullable=False, default=""
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
