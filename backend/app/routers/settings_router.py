"""Settings of the site edited in the admin panel: the contacts.

Public: the site gets the contacts in its language (without the email for requests).
Admin (login required): read and save them; find an address on the map (OpenStreetMap search).
"""

import json
import os
import re
from typing import Annotated
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.session import DbSession
from app.models import SiteSetting
from app.schemas.page_blocks import Lang, pick
from app.schemas.settings import DEFAULT_CONTACTS, Contacts
from app.services.auth import get_current_user

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
