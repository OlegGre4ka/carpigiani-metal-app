"""Sending emails over SMTP.

Locally all mail goes to Mailpit (http://localhost:8025): nothing reaches real inboxes.
For the live site set real SMTP values in .env.
"""

import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.environ.get("SMTP_HOST", "mailpit")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "1025"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_TLS = os.environ.get("SMTP_TLS", "false").lower() == "true"
MAIL_FROM = os.environ.get("MAIL_FROM", "Carpigiani <noreply@carpigiani.com.ua>")


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    message = EmailMessage()
    message["From"] = MAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    if html:
        message.add_alternative(html, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
        if SMTP_TLS:
            smtp.starttls()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)
