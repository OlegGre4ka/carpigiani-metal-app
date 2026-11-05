"""Settings of the site edited in the admin panel."""

import re
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.page_blocks import Text200, Text600, clean_link

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


# ---------- Footer (5.11) ----------

# The networks the client can add: the site has an icon for each (components/site-footer.tsx)
Network = Literal[
    "facebook", "instagram", "youtube", "telegram", "viber", "tiktok", "linkedin"
]
# The blocks of the footer, in the order the client puts them
FooterBlockKey = Literal["company", "address", "contacts", "links"]
FOOTER_LOGOS = "/uploads/footer/"


class Social(BaseModel):
    network: Network
    url: Annotated[str, Field(max_length=500)]
    visible: bool = True

    @field_validator("url")
    @classmethod
    def _check(cls, value: str) -> str:
        value = value.strip()
        # A Viber link is viber://...; the others are web addresses
        if value.startswith("viber://") and " " not in value:
            return value
        if not value.startswith(("https://", "http://")) or " " in value:
            raise ValueError(
                "Посилання на соцмережу має бути повною адресою (https://...)"
            )
        return value


class FooterBlock(BaseModel):
    key: FooterBlockKey
    visible: bool = True


class FooterLink(BaseModel):
    title: Text200 = Text200()
    href: Annotated[str, Field(max_length=500)]

    @field_validator("href")
    @classmethod
    def _check(cls, value: str) -> str:
        value = clean_link(value)
        if not value:
            raise ValueError("Вкажіть адресу посилання, наприклад /news")
        return value


class Footer(BaseModel):
    """The footer of every page of the site (5.11): the text under the name of the company, its
    own logo (empty: the cone of the site), the socials, the order of the blocks and whether
    each is shown, and the block "Links". The name, the address, the phones and the email come
    from "Contacts"; the last line "© … · made by AO Studio" is always there."""

    about: Text600 = Text600()
    logo: Annotated[str, Field(max_length=300)] = ""
    socials: Annotated[list[Social], Field(max_length=10)] = []
    blocks: Annotated[list[FooterBlock], Field(min_length=4, max_length=4)]
    links_title: Text200 = Text200()
    links: Annotated[list[FooterLink], Field(max_length=10)] = []

    @field_validator("logo")
    @classmethod
    def _check_logo(cls, value: str) -> str:
        if value and (not value.startswith(FOOTER_LOGOS) or ".." in value):
            raise ValueError("Лого треба завантажити через адмін-панель")
        return value

    @field_validator("blocks")
    @classmethod
    def _each_once(cls, value: list[FooterBlock]) -> list[FooterBlock]:
        if len({block.key for block in value}) != len(value):
            raise ValueError("Кожен блок футера має бути один раз")
        return value


# What the footer had before the client saved it (the same as before 5.11). "Links" is there
# but hidden until the client fills and shows it.
DEFAULT_FOOTER = {
    "about": {
        "uk": "Обладнання для морозива та джелатерій. Італійська якість, сервіс в Україні.",
        "en": "Equipment for ice cream makers and gelaterias. Italian quality, service in Ukraine.",
    },
    "logo": "",
    "socials": [
        {
            "network": "facebook",
            "url": "https://www.facebook.com/gelato.in.ukraine",
            "visible": True,
        },
        {
            "network": "youtube",
            "url": "https://www.youtube.com/channel/UCv5TBtOrqlGHZxeSFxvvNSQ",
            "visible": True,
        },
        {
            "network": "instagram",
            "url": "https://www.instagram.com/carpigiani_ukraine/",
            "visible": True,
        },
    ],
    "blocks": [
        {"key": "company", "visible": True},
        {"key": "address", "visible": True},
        {"key": "contacts", "visible": True},
        {"key": "links", "visible": False},
    ],
    "links_title": {"uk": "Корисні посилання", "en": "Useful links"},
    "links": [],
}
