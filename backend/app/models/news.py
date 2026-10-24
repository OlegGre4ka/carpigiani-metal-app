from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class NewsTopic(Base):
    """Topic of news ("Interesting", "Installations"...), like a folder: only a name and the
    address of its page on the site (typed by the client, as on the old site:
    /news/content/5-interesting). Its page lists the news of the topic; the topics are also
    the items of the "News" menu and the chips above the news."""

    __tablename__ = "news_topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title_uk: Mapped[str] = mapped_column(String(120), nullable=False)
    title_en: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    href: Mapped[str] = mapped_column(String(300), nullable=False)
    # Order in the menu and the chips: smaller number goes first
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


class News(Base):
    """One news item. Its card (photo, topic, date, title, short text) is in the list of news;
    its page (/210500-hlbny, the address as on the old site) is built in the same page builder
    as category and equipment pages, from blocks kept in `blocks` (app/schemas/page_blocks.py)."""

    __tablename__ = "news"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Topic is optional; when the topic is deleted the news stays, without a topic
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("news_topics.id", ondelete="SET NULL"), nullable=True, index=True
    )
    href: Mapped[str] = mapped_column(String(300), nullable=False)
    title_uk: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    # Date shown on the site; newer news go first
    published_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # Main photo: on the card and at the top of the page (address /uploads/pages/...)
    image: Mapped[str | None] = mapped_column(String(300), nullable=True)
    # Short text for the card
    summary_uk: Mapped[str] = mapped_column(String(600), nullable=False, default="")
    summary_en: Mapped[str] = mapped_column(String(600), nullable=False, default="")
    # A new news item is hidden until the client fills it and turns it on
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
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
