"""The contact form of the site: one form in two places (the "Contact us" window and the
form on equipment pages). Email is required, the phone is optional."""

import re
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE = re.compile(r"^\+?[\d\s()-]{7,25}$")


class ContactCreate(BaseModel):
    name: Annotated[str, Field(max_length=100)] = ""
    email: Annotated[str, Field(max_length=254)]
    phone: Annotated[str, Field(max_length=40)] = ""
    message: Annotated[str, Field(max_length=2000)] = ""
    # The equipment the request is about (set by the equipment page)
    subject: Annotated[str, Field(max_length=200)] = ""
    page: Annotated[str, Field(max_length=300)] = ""
    lang: Literal["uk", "en"] = "uk"
    # Trap for bots: a field people never see. Filled means a bot.
    website: Annotated[str, Field(max_length=200)] = ""
    # How long the form was open before sending, in milliseconds (set by the site). People
    # need several seconds; a bot sends at once or posts without the form at all (0).
    filled_ms: Annotated[int, Field(ge=0)] = 0

    @field_validator("name", "message", "subject", "page", "phone", "website")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def _check_email(cls, value: str) -> str:
        value = value.strip()
        if not EMAIL.match(value):
            raise ValueError("Вкажіть email, щоб ми могли відповісти")
        return value

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, value: str) -> str:
        value = value.strip()
        if value and not PHONE.match(value):
            raise ValueError("Перевірте номер телефону")
        return value
