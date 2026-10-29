"""Categories of equipment (Carpigiani) and of showcases (IFI, ISA), shown as cards on the
page of their brand (Carpigiani also on the home page).

Public: the site gets the visible categories of one brand.
Admin (login required): list, add, edit, hide/show, delete, change order (within the brand).
"""

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
from sqlalchemy import func, select

from app.db.session import DbSession
from app.models import Brand as BrandModel
from app.models import EquipmentCategory
from app.routers.pages_router import (
    category_has_page,
    category_images,
    delete_page_images,
    href_owner,
)
from app.schemas.equipment_category import (
    Brand,
    CategoriesOrder,
    CategoryVisibility,
    EquipmentCategoryRead,
)
from app.services.auth import get_current_user
from app.services.images import delete_image, image_url, save_image

public_router = APIRouter(
    prefix="/api/equipment-categories", tags=["equipment categories"]
)
admin_router = APIRouter(
    prefix="/api/admin/equipment-categories",
    tags=["equipment categories (admin)"],
    dependencies=[Depends(get_current_user)],
)


def to_read(
    category: EquipmentCategory, db: DbSession | None = None
) -> EquipmentCategoryRead:
    """db given: also tells whether its page has something to show (lists of the site and of
    the admin panel)."""
    return EquipmentCategoryRead(
        id=category.id,
        brand=category.brand,
        title_uk=category.title_uk,
        title_en=category.title_en,
        href=category.href,
        image_url=image_url(category.image),
        sort_order=category.sort_order,
        is_visible=category.is_visible,
        has_page=category_has_page(db, category) if db is not None else True,
    )


def clean_title(value: str, label: str) -> str:
    value = value.strip()
    if not value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Вкажіть назву ({label})")
    if len(value) > 120:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Назва ({label}) задовга: до 120 символів"
        )
    return value


def clean_href(value: str) -> str:
    value = value.strip()
    # A page of this site (/gelato) or a full address (https://...)
    is_page = value.startswith("/") and not value.startswith("//")
    is_url = value.startswith(("https://", "http://"))
    if not (is_page or is_url) or len(value) > 500 or " " in value:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Посилання має бути сторінкою сайту (наприклад /gelato) або повною адресою (https://...)",
        )
    return value


def check_href_free(db: DbSession, href: str, current: str | None = None) -> None:
    """A page of the site belongs to one category or one piece of equipment only.
    Full addresses (https://...) lead elsewhere and are not checked."""
    if not href.startswith("/") or href == current:
        return
    owner = href_owner(db, href)
    if owner:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Адреса {href} уже зайнята: {owner}. Вкажіть іншу.",
        )


def get_category(db: DbSession, category_id: int) -> EquipmentCategory:
    category = db.get(EquipmentCategory, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Категорію не знайдено")
    return category


# ---------- Public ----------


@public_router.get("", response_model=list[EquipmentCategoryRead])
def list_visible_categories(db: DbSession, brand: Brand = "carpigiani"):
    statement = (
        select(EquipmentCategory)
        .join(BrandModel, BrandModel.key == EquipmentCategory.brand)
        # A hidden brand shows none of its categories
        .where(
            EquipmentCategory.is_visible.is_(True),
            EquipmentCategory.brand == brand,
            BrandModel.is_visible.is_(True),
        )
        .order_by(EquipmentCategory.sort_order, EquipmentCategory.id)
    )
    return [to_read(category, db) for category in db.scalars(statement)]


# ---------- Admin ----------


@admin_router.get("", response_model=list[EquipmentCategoryRead])
def list_all_categories(db: DbSession, brand: Brand | None = None):
    """Categories of one brand; without a brand all of them (menu of the admin panel)."""
    statement = select(EquipmentCategory).order_by(
        EquipmentCategory.sort_order, EquipmentCategory.id
    )
    if brand is not None:
        statement = statement.where(EquipmentCategory.brand == brand)
    return [to_read(category, db) for category in db.scalars(statement)]


@admin_router.post(
    "", response_model=EquipmentCategoryRead, status_code=status.HTTP_201_CREATED
)
def create_category(
    db: DbSession,
    title_uk: Annotated[str, Form()],
    title_en: Annotated[str, Form()],
    href: Annotated[str, Form()],
    image: Annotated[UploadFile, File()],
    is_visible: Annotated[bool, Form()] = True,
    brand: Annotated[Brand, Form()] = "carpigiani",
):
    if not db.scalar(select(BrandModel.id).where(BrandModel.key == brand)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Такого бренду немає")
    href = clean_href(href)
    check_href_free(db, href)
    category = EquipmentCategory(
        brand=brand,
        title_uk=clean_title(title_uk, "українською"),
        title_en=clean_title(title_en, "англійською"),
        href=href,
        is_visible=is_visible,
    )
    # A new category goes to the end (of its brand)
    last = db.scalar(
        select(func.max(EquipmentCategory.sort_order)).where(
            EquipmentCategory.brand == brand
        )
    )
    category.sort_order = (last or 0) + 1
    category.image = save_image(image, "categories")
    db.add(category)
    db.commit()
    db.refresh(category)
    return to_read(category)


@admin_router.patch("/{category_id}", response_model=EquipmentCategoryRead)
def update_category(
    category_id: int,
    db: DbSession,
    title_uk: Annotated[str, Form()],
    title_en: Annotated[str, Form()],
    href: Annotated[str, Form()],
    is_visible: Annotated[bool, Form()] = True,
    # A new photo is optional: without it the old one stays
    image: Annotated[UploadFile | None, File()] = None,
    # Another brand: the category moves there (to the end of its list)
    brand: Annotated[Brand | None, Form()] = None,
):
    category = get_category(db, category_id)
    if brand is not None and brand != category.brand:
        if not db.scalar(select(BrandModel.id).where(BrandModel.key == brand)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Такого бренду немає")
        category.brand = brand
        category.sort_order = (
            db.scalar(
                select(func.max(EquipmentCategory.sort_order)).where(
                    EquipmentCategory.brand == brand
                )
            )
            or 0
        ) + 1
    category.title_uk = clean_title(title_uk, "українською")
    category.title_en = clean_title(title_en, "англійською")
    href = clean_href(href)
    check_href_free(db, href, current=category.href)
    category.href = href
    category.is_visible = is_visible

    old_image = None
    if image is not None and image.filename:
        old_image = category.image
        category.image = save_image(image, "categories")

    db.commit()
    db.refresh(category)
    delete_image(old_image)
    return to_read(category)


@admin_router.patch("/{category_id}/visibility", response_model=EquipmentCategoryRead)
def set_visibility(category_id: int, data: CategoryVisibility, db: DbSession):
    category = get_category(db, category_id)
    category.is_visible = data.is_visible
    db.commit()
    db.refresh(category)
    return to_read(category)


@admin_router.put("/order", response_model=list[EquipmentCategoryRead])
def set_order(data: CategoriesOrder, db: DbSession):
    """Order of the categories of one brand (the brand of the first one in the list)."""
    first = get_category(db, data.ids[0])
    categories = {
        category.id: category
        for category in db.scalars(
            select(EquipmentCategory).where(EquipmentCategory.brand == first.brand)
        )
    }
    if set(data.ids) != set(categories) or len(data.ids) != len(categories):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Список категорій застарів, оновіть сторінку"
        )
    for position, category_id in enumerate(data.ids, start=1):
        categories[category_id].sort_order = position
    db.commit()
    return list_all_categories(db, first.brand)


@admin_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: DbSession):
    category = get_category(db, category_id)
    image = category.image
    # Its page and subcategories go away with it (database rule); their photos too
    page_photos = category_images(db, category_id)
    db.delete(category)
    db.commit()
    delete_image(image)
    delete_page_images(page_photos)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
