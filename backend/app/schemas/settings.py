"""Settings of the site edited in the admin panel."""

import re
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.page_blocks import Text200

PHONE = re.compile(r"^\+?[\d\s()-]{7,25}$")


class Phone(BaseModel):
    """A phone as it is shown ("+38 044 465 5543"); the link tel:… is made from its digits."""

    label: Annotated[str, Field(max_length=30)]

    @field_validator("label")
    @classmethod
    def _check(cls, value: str) -> str:
        value = value.strip()
        if not PHONE.match(value):
            raise ValueError(f"Перевірте телефон: {value or '(порожньо)'}")
        return value


class Contacts(BaseModel):
    """Contacts of the company: on the "Contacts" page, in the footer and under the contact form."""

    phones: Annotated[list[Phone], Field(min_length=1, max_length=4)]
    email: EmailStr
    company: Text200 = Text200()
    street: Text200 = Text200()
    city: Text200 = Text200()
    hours: Text200 = Text200()
    # The point on the map (the client clicks the map in the admin panel)
    lat: Annotated[float, Field(ge=-90, le=90)]
    lng: Annotated[float, Field(ge=-180, le=180)]
    # Where the requests from the contact form go (not shown on the site)
    requests_email: EmailStr


# What the site shows until the client saves the contacts (the same as before). The point is
# approximate: the client puts the exact one by clicking the map in the admin panel.
DEFAULT_CONTACTS = {
    "phones": [{"label": "+38 044 465 5543"}, {"label": "+38 067 244 1109"}],
    "email": "info@carpigiani.com.ua",
    "company": {"uk": "ТОВ «ХОЛОД»", "en": "KHOLOD LLC"},
    "street": {"uk": "вул. Шумського, 1, оф. 317", "en": "1 Shumskoho St, office 317"},
    "city": {"uk": "Київ, 02098", "en": "Kyiv, 02098, Ukraine"},
    "hours": {"uk": "Пн–Пт: 9:00–18:00", "en": "Mon–Fri: 9:00–18:00"},
    "lat": 50.4296,
    "lng": 30.6189,
    "requests_email": "info@carpigiani.com.ua",
}


FONT_KEY = r"^[a-z0-9-]{2,40}$"


class General(BaseModel):
    """General settings of the site (29.10): the fonts of the titles and of the texts. The
    keys are the fonts of the site (frontend/lib/site-fonts.ts); an unknown key is shown as
    the usual font there."""

    font_title: Annotated[str, Field(pattern=FONT_KEY)]
    font_text: Annotated[str, Field(pattern=FONT_KEY)]


# Until the client saves the general settings
DEFAULT_GENERAL = {"font_title": "inter-tight", "font_text": "inter-tight"}
