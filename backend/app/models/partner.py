from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Partner(Base):
    """A partner of the company (4.11): its logo in the "Partners" strip on the home page of the
    site, before the footer (as on the old site). Kept by the client in the admin panel →
    "Загальні налаштування" → "Партнери"."""

    __tablename__ = "partners"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    # Logo: a file in the uploads folder ("partners/abc.webp") or a picture of the site
    # ("/images/...", the first partners)
    logo: Mapped[str] = mapped_column(String(300), nullable=False)
    # The site of the partner (opens in a new tab); empty: the logo is not a link
    url: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    # Order in the strip: smaller number goes first
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
