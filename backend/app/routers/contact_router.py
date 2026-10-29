"""Requests from the contact form of the site.

Each request is saved in the database first (nothing is lost), then an email goes to the
manager: to the "email for requests" of the contacts in the admin panel (before they are first
saved — CONTACT_EMAIL from .env, by default info@carpigiani.com.ua). Locally all mail lands in
Mailpit.
Spam protection without "I am not a robot" (29.10): a hidden trap field, a form sent too
fast (under MIN_FILL_MS after it opened) and a limit per address. A bot gets the usual
"ok" and nothing is kept, so it does not learn it was caught.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Request, status

from app.db.session import DbSession
from app.models import ContactRequest
from app.routers.settings_router import requests_email
from app.schemas.contact import ContactCreate
from app.services.mailer import send_email
from app.services.rate_limit import check_rate_limit, client_ip

router = APIRouter(prefix="/api/contact", tags=["contact"])
log = logging.getLogger(__name__)

# Faster than this after the form opened: not a person
MIN_FILL_MS = 3000


def notify(request: ContactRequest, to: str) -> None:
    lines = [
        f"Ім'я: {request.name or '—'}",
        f"Email: {request.email}",
        f"Телефон: {request.phone or '—'}",
    ]
    if request.subject:
        lines.append(f"Запит щодо: {request.subject}")
    if request.page:
        lines.append(f"Сторінка: {request.page}")
    lines += ["", request.message or "(без повідомлення)"]
    subject = (
        f"Заявка з сайту: {request.subject}" if request.subject else "Заявка з сайту"
    )
    try:
        send_email(to, subject, "\n".join(lines))
    except Exception:  # the request is saved anyway; the manager sees it later
        log.exception("Contact request %s: email was not sent", request.id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(
    data: ContactCreate, request: Request, db: DbSession, background: BackgroundTasks
):
    # A bot: filled the hidden field or sent the form too fast. Answer as usual, keep nothing
    if data.website or data.filled_ms < MIN_FILL_MS:
        log.warning(
            "Contact request dropped as a bot (trap=%s, filled in %s ms, ip %s)",
            bool(data.website), data.filled_ms, client_ip(request),
        )  # fmt: skip
        return {"ok": True}
    check_rate_limit(
        f"contact-ip:{client_ip(request)}", limit=5, window_seconds=10 * 60
    )

    saved = ContactRequest(
        name=data.name,
        email=data.email,
        phone=data.phone,
        message=data.message,
        subject=data.subject,
        page=data.page,
        lang=data.lang,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    # The email goes after the answer, so the visitor does not wait for the mail server
    background.add_task(notify, saved, requests_email(db))
    return {"ok": True}
