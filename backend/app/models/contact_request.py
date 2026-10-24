from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ContactRequest(Base):
    """A request sent from the contact form of the site (the "Contact us" window or the
    form on an equipment page). Kept here so no request is lost even if the email
    did not go out; the admin panel lists them ("Заявки")."""

    __tablename__ = "contact_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    # Optional
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # The equipment the request is about ("Carpigiani Maestro"); empty when sent from
    # the "Contact us" window on other pages
    subject: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    # Address of the page it was sent from ("/maestro") and its language
    page: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    lang: Mapped[str] = mapped_column(String(2), nullable=False, default="uk")
    # Opened in the admin panel ("Requests"); new ones are counted on its home page
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
