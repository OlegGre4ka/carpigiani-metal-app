from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class SiteSetting(Base):
    """Settings of the site the client changes in the admin panel, one row per kind
    ("contacts": phones, email, address, point on the map, hours, where requests go).
    The shape of each kind is in app/schemas/settings.py."""

    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
