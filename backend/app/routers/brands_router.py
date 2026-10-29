"""Brands (manufacturers): the top level of the catalogue — Brand → categories → subcategories →
equipment. The three brands of the site (Carpigiani, IFI, ISA) are added by the database
migration; new ones are added by the admin.

Public: the site gets the visible brands, in order (the "Manufacturers" menu, the "Equipment
catalog" menu).
Admin (login required): list, add, edit, hide/show, change order, delete. A brand that still has
categories cannot be deleted: first move or delete its categories (hiding is the way to take a
brand off the site).
"""

import re
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import func, select

from app.db.session import DbSession
from app.models import Brand, EquipmentCategory
from app.routers.pages_router import (
    blocks_adapter,
    blocks_for_site,
    check_kinds,
    delete_page_images,
    get_showcases,
    href_owner,
    page_images,
    upload,
    upload_pdf,
)
from app.schemas.brand import (
    BrandAdminRead,
    BrandChip,
    BrandPageAdmin,
    BrandPagePublic,
    BrandPageSave,
    BrandRead,
    BrandsOrder,
    BrandVisibility,
)
from app.schemas.page_blocks import Lang, pick
from app.services.auth import get_current_user
from app.services.images import delete_image, image_url, save_image

public_router = APIRouter(prefix="/api/brands", tags=["brands"])
admin_router = APIRouter(
    prefix="/api/admin/brands",
    tags=["brands (admin)"],
    dependencies=[Depends(get_current_user)],
)

# Addresses of the site that a brand page cannot take
RESERVED = {
    "api",
    "uploads",
    "images",
    "news",
    "contacts",
    "support",
    "fofkas-adminpanel",
    "en",
    "uk",
    "_next",
}
KEY_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def logo_url(brand: Brand) -> str | None:
    if not brand.logo:
        return None
    # The first brands use pictures of the site; uploaded logos live in the uploads folder
    return brand.logo if brand.logo.startswith("/") else image_url(brand.logo)


def to_read(brand: Brand) -> BrandRead:
    return BrandRead(
        id=brand.id,
        key=brand.key,
        title_uk=brand.title_uk,
        title_en=brand.title_en,
        href=brand.href,
        logo_url=logo_url(brand),
        sort_order=brand.sort_order,
        is_visible=brand.is_visible,
    )


def categories_count(db: DbSession, key: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(EquipmentCategory)
            .where(EquipmentCategory.brand == key)
        )
        or 0
    )


def to_admin_read(db: DbSession, brand: Brand) -> BrandAdminRead:
    return BrandAdminRead(
        **to_read(brand).model_dump(),
        categories_count=categories_count(db, brand.key),
        has_content=brand_has_content(db, brand),
    )


def brand_has_content(db: DbSession, brand: Brand) -> bool:
    """Whether the page of the brand shows something besides the title (29.10): a block with
    something in it, the cards of its visible categories or its equipment. Until then the brand
    is not in the menus of the site and its address shows "page in progress"."""
    blocks = blocks_for_site(
        brand.blocks if brand.blocks is not None else DEFAULT_BLOCKS, "uk", db
    )
    for block in blocks:
        if block["type"] != "categories":
            return True
        visible = db.scalar(
            select(func.count())
            .select_from(EquipmentCategory)
            .where(
                EquipmentCategory.brand == brand.key,
                EquipmentCategory.is_visible.is_(True),
            )
        )
        if visible:
            return True
    return brand.show_equipment and bool(get_showcases(db, "uk", brand.key)["items"])


def clean_title(value: str, label: str) -> str:
    value = value.strip()
    if not value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Вкажіть назву ({label})")
    if len(value) > 120:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Назва ({label}) задовга: до 120 символів"
        )
    return value


def clean_key(db: DbSession, href: str, current: Brand | None = None) -> str:
    """The address of the brand page: /ifi → "ifi". Latin letters, digits and dashes, free on the site."""
    key = href.strip().lstrip("/").lower()
    if not KEY_RE.fullmatch(key) or not 2 <= len(key) <= 40:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Адреса сторінки бренду: латинські літери, цифри й дефіс, наприклад /ifi або /bravo",
        )
    if current is not None and key == current.key:
        return key
    if key in RESERVED:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Адреса /{key} зайнята сайтом. Вкажіть іншу."
        )
    if db.scalar(select(Brand).where(Brand.key == key)):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Адреса /{key} уже є в іншого бренду. Вкажіть іншу.",
        )
    owner = href_owner(db, f"/{key}")
    if owner:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Адреса /{key} уже зайнята: {owner}. Вкажіть іншу.",
        )
    return key


def get_brand(db: DbSession, brand_id: int) -> Brand:
    brand = db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Бренд не знайдено")
    return brand


def is_brand_visible(db: DbSession, key: str) -> bool:
    """For the site: a hidden (or unknown) brand shows nothing of its own."""
    return bool(db.scalar(select(Brand.is_visible).where(Brand.key == key)))


# A page never saved shows only the cards of the categories
DEFAULT_BLOCKS = [{"id": "cats", "visible": True, "type": "categories"}]
# Blocks that belong to other pages: "Subcategory" (category pages), "Main photo" (equipment)
FORBIDDEN_BLOCKS = {"subcategory", "photo"}


# ---------- Public ----------


@public_router.get("", response_model=list[BrandRead])
def list_visible_brands(db: DbSession):
    statement = (
        select(Brand)
        .where(Brand.is_visible.is_(True))
        .order_by(Brand.sort_order, Brand.id)
    )
    # A brand whose page is still empty is not in the menus yet
    return [
        to_read(brand)
        for brand in db.scalars(statement)
        if brand_has_content(db, brand)
    ]


@public_router.get("/page", response_model=BrandPagePublic)
def get_brand_page(
    db: DbSession, href: Annotated[str, Query(max_length=60)], lang: Lang = "uk"
):
    """The page of a visible brand by its address (/ifi); 404 for anything else."""
    key = href.strip("/").lower()
    brand = db.scalar(select(Brand).where(Brand.key == key, Brand.is_visible.is_(True)))
    # An empty page is not shown: the site shows "page in progress" at its address
    if brand is None or not brand_has_content(db, brand):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сторінку не знайдено")
    return BrandPagePublic(
        key=brand.key,
        title=pick(
            {
                "uk": brand.page_title_uk or brand.title_uk,
                "en": brand.page_title_en or brand.title_en,
            },
            lang,
        ),
        subtitle=pick({"uk": brand.subtitle_uk, "en": brand.subtitle_en}, lang).strip(),
        blocks=blocks_for_site(
            brand.blocks if brand.blocks is not None else DEFAULT_BLOCKS, lang, db
        ),
        show_equipment=brand.show_equipment,
    )


# ---------- Admin ----------


@admin_router.get("", response_model=list[BrandAdminRead])
def list_all_brands(db: DbSession):
    return [
        to_admin_read(db, brand)
        for brand in db.scalars(select(Brand).order_by(Brand.sort_order, Brand.id))
    ]


@admin_router.post(
    "", response_model=BrandAdminRead, status_code=status.HTTP_201_CREATED
)
def create_brand(
    db: DbSession,
    title_uk: Annotated[str, Form()],
    title_en: Annotated[str, Form()],
    href: Annotated[str, Form()],
    is_visible: Annotated[bool, Form()] = True,
    logo: Annotated[UploadFile | None, File()] = None,
):
    brand = Brand(
        key=clean_key(db, href),
        title_uk=clean_title(title_uk, "українською"),
        title_en=clean_title(title_en, "англійською"),
        is_visible=is_visible,
    )
    # A new brand goes to the end of the menus
    brand.sort_order = (db.scalar(select(func.max(Brand.sort_order))) or 0) + 1
    if logo is not None and logo.filename:
        brand.logo = save_image(logo, "brands", max_width=400)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return to_admin_read(db, brand)


@admin_router.patch("/{brand_id}", response_model=BrandAdminRead)
def update_brand(
    brand_id: int,
    db: DbSession,
    title_uk: Annotated[str, Form()],
    title_en: Annotated[str, Form()],
    href: Annotated[str, Form()],
    is_visible: Annotated[bool, Form()] = True,
    # A new logo is optional: without it the old one stays
    logo: Annotated[UploadFile | None, File()] = None,
):
    brand = get_brand(db, brand_id)
    brand.title_uk = clean_title(title_uk, "українською")
    brand.title_en = clean_title(title_en, "англійською")
    # A new address also moves its categories (database rule)
    brand.key = clean_key(db, href, current=brand)
    brand.is_visible = is_visible
    old_logo = None
    if logo is not None and logo.filename:
        old_logo = brand.logo
        brand.logo = save_image(logo, "brands", max_width=400)
    db.commit()
    db.refresh(brand)
    if old_logo and not old_logo.startswith("/"):
        delete_image(old_logo)
    return to_admin_read(db, brand)


@admin_router.patch("/{brand_id}/visibility", response_model=BrandAdminRead)
def set_visibility(brand_id: int, data: BrandVisibility, db: DbSession):
    brand = get_brand(db, brand_id)
    brand.is_visible = data.is_visible
    db.commit()
    db.refresh(brand)
    return to_admin_read(db, brand)


@admin_router.put("/order", response_model=list[BrandAdminRead])
def set_order(data: BrandsOrder, db: DbSession):
    brands = {brand.id: brand for brand in db.scalars(select(Brand))}
    if set(data.ids) != set(brands) or len(data.ids) != len(brands):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Список брендів застарів, оновіть сторінку"
        )
    for position, brand_id in enumerate(data.ids, start=1):
        brands[brand_id].sort_order = position
    db.commit()
    return list_all_brands(db)


# ---------- Admin: the page of a brand ----------


def brand_page_admin(db: DbSession, brand: Brand) -> BrandPageAdmin:
    categories = db.scalars(
        select(EquipmentCategory)
        .where(
            EquipmentCategory.brand == brand.key, EquipmentCategory.is_visible.is_(True)
        )
        .order_by(EquipmentCategory.sort_order, EquipmentCategory.id)
    )
    hidden = set(brand.hidden_chips or [])
    return BrandPageAdmin(
        brand_id=brand.id,
        brand_key=brand.key,
        brand_title=brand.title_uk,
        href=brand.href,
        is_visible=brand.is_visible,
        saved=brand.blocks is not None,
        # A page never saved starts with the name of the brand and its category cards
        title_uk=brand.page_title_uk or brand.title_uk,
        title_en=brand.page_title_en or brand.title_en,
        subtitle_uk=brand.subtitle_uk,
        subtitle_en=brand.subtitle_en,
        blocks=brand.blocks if brand.blocks is not None else DEFAULT_BLOCKS,
        show_equipment=brand.show_equipment,
        hidden_chips=sorted(hidden),
        chips=[
            BrandChip(id=c.id, title_uk=c.title_uk, enabled=c.id not in hidden)
            for c in categories
        ],
    )


@admin_router.get("/{brand_id}/page", response_model=BrandPageAdmin)
def get_brand_page_admin(brand_id: int, db: DbSession):
    return brand_page_admin(db, get_brand(db, brand_id))


@admin_router.put("/{brand_id}/page", response_model=BrandPageAdmin)
def save_brand_page(brand_id: int, data: BrandPageSave, db: DbSession):
    brand = get_brand(db, brand_id)
    blocks = blocks_adapter.dump_python(data.blocks, mode="json")
    check_kinds(blocks, FORBIDDEN_BLOCKS, "бренду")
    old_images = page_images(brand.blocks or [])
    brand.page_title_uk = clean_title(data.title_uk, "українською")
    brand.page_title_en = data.title_en.strip()
    brand.subtitle_uk = data.subtitle_uk.strip()
    brand.subtitle_en = data.subtitle_en.strip()
    brand.blocks = blocks
    brand.show_equipment = data.show_equipment
    brand.hidden_chips = sorted(set(data.hidden_chips))
    db.commit()
    db.refresh(brand)
    # Photos and catalogs taken out of the page are not needed any more
    delete_page_images(old_images - page_images(blocks))
    return brand_page_admin(db, brand)


@admin_router.post("/{brand_id}/page/images", status_code=status.HTTP_201_CREATED)
def upload_brand_image(
    brand_id: int, db: DbSession, image: Annotated[UploadFile, File()]
):
    """A photo for a block. It becomes part of the page when the page is saved."""
    get_brand(db, brand_id)
    return upload(image)


@admin_router.post("/{brand_id}/page/files", status_code=status.HTTP_201_CREATED)
def upload_brand_catalog(
    brand_id: int, db: DbSession, file: Annotated[UploadFile, File()]
):
    """A PDF catalog for the "Catalogs" block. It becomes part of the page when the page is saved."""
    get_brand(db, brand_id)
    return upload_pdf(file)


@admin_router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(brand_id: int, db: DbSession):
    brand = get_brand(db, brand_id)
    count = categories_count(db, brand.key)
    if count:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"У бренду «{brand.title_uk}» є категорії ({count}). Спершу перенесіть або видаліть категорії. "
            "Щоб просто прибрати бренд із сайту, приховайте його.",
        )
    logo = brand.logo
    images = page_images(brand.blocks or [])
    db.delete(brand)
    db.commit()
    if logo and not logo.startswith("/"):
        delete_image(logo)
    delete_page_images(images)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
