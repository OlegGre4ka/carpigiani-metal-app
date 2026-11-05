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
    # How the articles are shown (5.11): "article" — the chosen one open for reading (its menu
    # item leads to the address of the article); "list" — the chosen one as a big preview card
    # and the others under it two in a row, at the page's own address (href)
    layout: Mapped[str] = mapped_column(
        String(20), nullable=False, default="article", server_default="article"
    )
    # The address of a "list" page (5.11, the client enters it); unused by an "article" page
    # (4.11: its menu item leads to the article; the first addresses were freed for articles,
    # migration f6b8d0a2c4e7)
    href: Mapped[str | None] = mapped_column(String(300), nullable=True, unique=True)
    # Order in the "Support" menu: smaller number goes first
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # The topic of news shown on the page (deleting the topic keeps the page, without articles)
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("news_topics.id", ondelete="SET NULL"), nullable=True
    )
    # The article of the topic shown open on the page (4.11); none or deleted: the newest one
    main_news_id: Mapped[int | None] = mapped_column(
        ForeignKey("news.id", ondelete="SET NULL"), nullable=True
    )
    # Not used since 4.11 (the page shows an article of its topic); kept with what was saved
    blocks: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # The main photo at the top of the page (like the main photo of a news item)
    image: Mapped[str | None] = mapped_column(String(300), nullable=True)
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
