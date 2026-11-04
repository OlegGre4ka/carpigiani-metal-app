"""Partners of the company (4.11): the strip of logos on the home page of the site, before the
footer. The client keeps the list in the admin panel → "Загальні налаштування" → "Партнери":
the logo, the name, the site of the partner, the order and whether it is shown.

Public: the visible partners in their order. Admin (login required): list, add, change,
show/hide, order, delete.
"""

import re
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.db.session import DbSession
from app.models import Partner
from app.services.auth import get_current_user
from app.services.images import delete_image, image_url, save_image

public_router = APIRouter(prefix="/api", tags=["partners"])
admin_router = APIRouter(
    prefix="/api/admin/partners",
    tags=["partners (admin)"],
    dependencies=[Depends(get_current_user)],
)


class PartnerRead(BaseModel):
    id: int
    title: str
    logo_url: str
    url: str
    is_visible: bool


class PartnerVisibility(BaseModel):
    is_visible: bool


class PartnerOrder(BaseModel):
    ids: Annotated[list[int], Field(max_length=200)]


def logo_url(partner: Partner) -> str:
    # The first partners use pictures of the site; uploaded logos live in the uploads folder
    return partner.logo if partner.logo.startswith("/") else image_url(partner.logo)


def to_read(partner: Partner) -> PartnerRead:
    return PartnerRead(
        id=partner.id,
        title=partner.title,
        logo_url=logo_url(partner),
        url=partner.url,
        is_visible=partner.is_visible,
    )


def ordered(db: DbSession, only_visible: bool = False) -> list[Partner]:
    statement = select(Partner).order_by(Partner.sort_order, Partner.id)
    if only_visible:
        statement = statement.where(Partner.is_visible.is_(True))
    return list(db.scalars(statement))


def clean_title(value: str) -> str:
    value = value.strip()
    if not value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Вкажіть назву партнера")
    if len(value) > 120:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Назва — до 120 символів")
    return value


def clean_url(value: str) -> str:
    """The site of the partner: empty, or an address of a site (https:// is added)."""
    value = value.strip()
    if not value:
        return ""
    if not re.match(r"^https?://", value, re.IGNORECASE):
        value = f"https://{value}"
    if len(value) > 300 or not re.fullmatch(r"https?://[^\s/]+\.[^\s]+", value):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Вкажіть адресу сайту партнера, наприклад https://www.carpigiani.com",
        )
    return value


def get_partner(db: DbSession, partner_id: int) -> Partner:
    partner = db.get(Partner, partner_id)
    if partner is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Партнера не знайдено")
    return partner


# ---------- The site ----------


@public_router.get("/partners")
def partners(db: DbSession) -> list[dict]:
    """The partners on the site, in their order: name, logo and site."""
    return [
        {"title": p.title, "logo": logo_url(p), "url": p.url}
        for p in ordered(db, only_visible=True)
    ]


# ---------- Admin ----------


@admin_router.get("", response_model=list[PartnerRead])
def list_partners(db: DbSession):
    return [to_read(p) for p in ordered(db)]


@admin_router.post("", response_model=PartnerRead, status_code=status.HTTP_201_CREATED)
def create_partner(
    db: DbSession,
    title: Annotated[str, Form()],
    logo: Annotated[UploadFile, File()],
    url: Annotated[str, Form()] = "",
    is_visible: Annotated[bool, Form()] = True,
):
    if not logo.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Додайте логотип партнера")
    partner = Partner(
        title=clean_title(title),
        url=clean_url(url),
        is_visible=is_visible,
        # A new partner goes to the end of the strip
        sort_order=(db.scalar(select(func.max(Partner.sort_order))) or 0) + 1,
        logo=save_image(logo, "partners", max_width=480),
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return to_read(partner)


@admin_router.patch("/{partner_id}", response_model=PartnerRead)
def update_partner(
    partner_id: int,
    db: DbSession,
    title: Annotated[str, Form()],
    url: Annotated[str, Form()] = "",
    is_visible: Annotated[bool, Form()] = True,
    # A new logo is optional: without it the old one stays
    logo: Annotated[UploadFile | None, File()] = None,
):
    partner = get_partner(db, partner_id)
    partner.title = clean_title(title)
    partner.url = clean_url(url)
    partner.is_visible = is_visible
    old_logo = None
    if logo is not None and logo.filename:
        old_logo = partner.logo
        partner.logo = save_image(logo, "partners", max_width=480)
    db.commit()
    db.refresh(partner)
    if old_logo and not old_logo.startswith("/"):
        delete_image(old_logo)
    return to_read(partner)


@admin_router.patch("/{partner_id}/visibility", response_model=PartnerRead)
def set_visibility(partner_id: int, data: PartnerVisibility, db: DbSession):
    partner = get_partner(db, partner_id)
    partner.is_visible = data.is_visible
    db.commit()
    db.refresh(partner)
    return to_read(partner)


@admin_router.put("/order", response_model=list[PartnerRead])
def set_order(data: PartnerOrder, db: DbSession):
    found = {p.id: p for p in ordered(db)}
    if set(data.ids) != set(found):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Список партнерів змінився. Оновіть сторінку."
        )
    for index, partner_id in enumerate(data.ids):
        found[partner_id].sort_order = index
    db.commit()
    return list_partners(db)


@admin_router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_partner(partner_id: int, db: DbSession):
    partner = get_partner(db, partner_id)
    logo = partner.logo
    db.delete(partner)
    db.commit()
    if not logo.startswith("/"):
        delete_image(logo)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
