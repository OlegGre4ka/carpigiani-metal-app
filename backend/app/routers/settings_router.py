"""Settings of the site edited in the admin panel: the contacts, the general settings (the
fonts of the site) and the footer (5.11).

Public: the site gets the contacts in its language (without the email for requests), the
fonts and the footer.
Admin (login required): read and save them; find an address on the map (OpenStreetMap search).
"""

import json
import os
import re
from typing import Annotated
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.db.session import DbSession
from app.models import SiteSetting
from app.schemas.page_blocks import Lang, pick
from app.schemas.settings import (
    DEFAULT_CONTACTS,
    DEFAULT_FOOTER,
    DEFAULT_GENERAL,
    FOOTER_COLUMNS,
    FOOTER_LOGOS,
    Contacts,
    Footer,
    General,
)
from app.services.auth import get_current_user
from app.services.images import delete_image, image_url, save_image

public_router = APIRouter(prefix="/api/pages", tags=["settings"])
admin_router = APIRouter(
    prefix="/api/admin/settings",
    tags=["settings (admin)"],
    dependencies=[Depends(get_current_user)],
)


def contacts_of(db: DbSession) -> dict:
    """The saved contacts, or the ones the site had before they were first saved."""
    row = db.get(SiteSetting, "contacts")
    if row is None:
        # Before the first save requests go where they went before (.env)
        return {
            **DEFAULT_CONTACTS,
            "requests_email": os.environ.get(
                "CONTACT_EMAIL", DEFAULT_CONTACTS["requests_email"]
            ),
        }
    return row.data


def requests_email(db: DbSession) -> str:
    """Where the requests from the contact form go."""
    return contacts_of(db)["requests_email"]


def tel(label: str) -> str:
    """ "+38 044 465 5543" → "tel:+380444655543" """
    return "tel:" + re.sub(r"[^\d+]", "", label)


@public_router.get("/contacts")
def get_contacts(db: DbSession, lang: Lang = "uk") -> dict:
    data = contacts_of(db)
    return {
        "phones": [
            {"label": p["label"], "href": tel(p["label"])} for p in data["phones"]
        ],
        "email": data["email"],
        "company": pick(data["company"], lang),
        "street": pick(data["street"], lang),
        "city": pick(data["city"], lang),
        "hours": pick(data["hours"], lang),
        "lat": data["lat"],
        "lng": data["lng"],
    }


@admin_router.get("/contacts", response_model=Contacts)
def read_contacts(db: DbSession):
    return contacts_of(db)


@admin_router.put("/contacts", response_model=Contacts)
def save_contacts(data: Contacts, db: DbSession):
    row = db.get(SiteSetting, "contacts")
    if row is None:
        row = SiteSetting(key="contacts")
        db.add(row)
    row.data = data.model_dump(mode="json")
    db.commit()
    return contacts_of(db)


def general_of(db: DbSession) -> dict:
    """The saved general settings, or the usual ones before they were first saved."""
    row = db.get(SiteSetting, "general")
    return {**DEFAULT_GENERAL, **(row.data if row else {})}


@public_router.get("/general")
def get_general(db: DbSession) -> dict:
    return general_of(db)


@admin_router.get("/general", response_model=General)
def read_general(db: DbSession):
    return general_of(db)


@admin_router.put("/general", response_model=General)
def save_general(data: General, db: DbSession):
    row = db.get(SiteSetting, "general")
    if row is None:
        row = SiteSetting(key="general")
        db.add(row)
    row.data = data.model_dump(mode="json")
    db.commit()
    return general_of(db)


# Address search of OpenStreetMap (Nominatim): free, no key. Its rules: a name of the site in
# the request and only occasional searches (the admin presses "Find"), which is what we do.
GEOCODER = "https://nominatim.openstreetmap.org/search"
GEOCODER_AGENT = "carpigiani-site/1.0 (admin address search; info@carpigiani.com.ua)"


@admin_router.get("/geocode")
def find_address(q: Annotated[str, Query(min_length=3, max_length=200)]) -> list[dict]:
    """Up to 5 places for an address typed in the admin panel ("Київ, Шумського 1")."""
    query = urlencode(
        {
            "q": q.strip(),
            "format": "jsonv2",
            "limit": 5,
            "countrycodes": "ua",
            "accept-language": "uk",
        }
    )
    request = Request(f"{GEOCODER}?{query}", headers={"User-Agent": GEOCODER_AGENT})
    try:
        with urlopen(request, timeout=8) as response:
            found = json.load(response)
    except URLError, TimeoutError, ValueError:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Пошук адреси зараз не відповідає. Поставте точку кліком по мапі.",
        ) from None
    return [
        {
            "label": place.get("display_name", ""),
            "lat": float(place["lat"]),
            "lng": float(place["lon"]),
        }
        for place in found
        if "lat" in place and "lon" in place
    ]


# ---------- Footer (5.11) ----------


# The first footer (saved before the parts) had 4 blocks in a row: where their parts go
OLD_BLOCKS = {
    "company": ["brand", "about"],
    "address": ["address", "socials"],
    "contacts": ["contacts"],
    "links": ["links"],
}


def footer_of(db: DbSession) -> dict:
    """The saved footer, or the one the site had before it was first saved."""
    row = db.get(SiteSetting, "footer")
    data = {**DEFAULT_FOOTER, **(row.data if row else {})}
    old = data.pop("blocks", None)
    if old and not (row and "pieces" in row.data):
        # Saved with the 4 blocks (5.11, the first version): each block becomes a column
        pieces = []
        for index, block in enumerate(old, start=1):
            pieces += [
                {"key": key, "column": index, "visible": block["visible"]}
                for key in OLD_BLOCKS[block["key"]]
            ]
        pieces.append({"key": "about2", "column": 2, "visible": True})
        data["pieces"] = pieces
    return data


@public_router.get("/footer")
def get_footer(db: DbSession, lang: Lang = "uk") -> dict:
    """The footer in the language of the page: the columns that have something to show, each
    with its parts in their order; the texts, the logo, the shown socials and the links."""
    data = footer_of(db)
    links = [
        {"title": pick(link["title"], lang) or link["href"], "href": link["href"]}
        for link in data["links"]
    ]
    socials = [
        {"network": s["network"], "url": s["url"]}
        for s in data["socials"]
        if s["visible"]
    ]
    about = pick(data["about"], lang)
    about2 = pick(data["about2"], lang)
    # A part with nothing in it is left out (an empty text, no links, no socials)
    has = {
        "brand": True,
        "about": bool(about.strip()),
        "about2": bool(about2.strip()),
        "address": True,
        "socials": bool(socials),
        "contacts": True,
        "links": bool(links),
    }
    columns: list[list[str]] = [[] for _ in range(FOOTER_COLUMNS)]
    for piece in data["pieces"]:
        if piece["visible"] and has[piece["key"]]:
            columns[piece["column"] - 1].append(piece["key"])
    return {
        "title": pick(data["title"], lang),
        "about": about,
        "about2": about2,
        "logo": data["logo"],
        "show_logo": data["show_logo"],
        "socials": socials,
        "columns": [column for column in columns if column],
        "links_title": pick(data["links_title"], lang),
        "links": links,
    }


@admin_router.get("/footer", response_model=Footer)
def read_footer(db: DbSession):
    return footer_of(db)


@admin_router.put("/footer", response_model=Footer)
def save_footer(data: Footer, db: DbSession):
    row = db.get(SiteSetting, "footer")
    old_logo = footer_of(db)["logo"]
    if row is None:
        row = SiteSetting(key="footer")
        db.add(row)
    row.data = data.model_dump(mode="json")
    db.commit()
    # The logo that was replaced or removed is not needed any more
    if old_logo and old_logo != data.logo:
        delete_image(old_logo.removeprefix("/uploads/"))
    return footer_of(db)


@admin_router.post("/footer/logo", status_code=status.HTTP_201_CREATED)
def upload_footer_logo(image: Annotated[UploadFile, File()]):
    """The own logo of the footer. It is kept when the footer is saved."""
    url = image_url(
        save_image(
            image, FOOTER_LOGOS.strip("/").removeprefix("uploads/"), max_width=480
        )
    )
    return {"url": url}
