"""Pages built from blocks in the admin panel: pages of equipment categories (/gelato) and
pages of single pieces of equipment (/labotronic); news pages too (app/routers/news_router.py).
All use the same blocks and the same builder; "subcategory" blocks go only on category pages, "catalogs" only on equipment pages.
Also subcategories: lists of equipment shown on category pages.

Public: the site asks for a page by its address and language and gets only what is shown.
Admin (login required): read and save pages, upload photos and PDF catalogs,
manage subcategories and their equipment.
"""

import re
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from pydantic import TypeAdapter
from sqlalchemy import select

from app.db.session import DbSession
from app.models import (
    Brand as BrandModel,
)
from app.models import (
    CategoryPage,
    EquipmentCategory,
    EquipmentPage,
    EquipmentSubcategory,
    News,
    NewsTopic,
)
from app.schemas.equipment_category import Brand
from app.schemas.page_blocks import (
    PAGE_FILES_PREFIX,
    PAGE_IMAGES_PREFIX,
    Block,
    Lang,
    clean_html,
    pick,
    pick_file,
    site_link,
    youtube_id,
)
from app.schemas.pages import (
    CategoryPageAdmin,
    EquipmentItem,
    EquipmentPageAdmin,
    PageSave,
    PublicPage,
    SubcategoryAdmin,
    SubcategoryCreate,
    SubcategoryListItem,
    SubcategorySave,
)
from app.services.auth import get_current_user
from app.services.files import save_pdf
from app.services.images import (
    UPLOADS_URL,
    cut_out_white,
    cutout_kind,
    delete_image,
    image_url,
    save_image,
)

public_router = APIRouter(prefix="/api/pages", tags=["pages"])
admin_router = APIRouter(
    prefix="/api/admin",
    tags=["pages (admin)"],
    dependencies=[Depends(get_current_user)],
)

blocks_adapter = TypeAdapter(list[Block])
items_adapter = TypeAdapter(list[EquipmentItem])


def get_category(db: DbSession, category_id: int) -> EquipmentCategory:
    category = db.get(EquipmentCategory, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Категорію не знайдено")
    return category


def get_subcategory(db: DbSession, subcategory_id: int) -> EquipmentSubcategory:
    subcategory = db.get(EquipmentSubcategory, subcategory_id)
    if subcategory is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Підкатегорію не знайдено")
    return subcategory


def find_page(db: DbSession, category_id: int) -> CategoryPage | None:
    return db.scalar(
        select(CategoryPage).where(CategoryPage.category_id == category_id)
    )


def find_item(subcategory: EquipmentSubcategory, item_id: str) -> dict:
    item = next((i for i in subcategory.items if i["id"] == item_id), None)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Обладнання не знайдено")
    return item


def find_equipment_page(
    db: DbSession, subcategory_id: int, item_id: str
) -> EquipmentPage | None:
    return db.scalar(
        select(EquipmentPage).where(
            EquipmentPage.subcategory_id == subcategory_id,
            EquipmentPage.item_id == item_id,
        )
    )


def equipment_pages(db: DbSession, subcategory_id: int) -> list[EquipmentPage]:
    return list(
        db.scalars(
            select(EquipmentPage).where(EquipmentPage.subcategory_id == subcategory_id)
        )
    )


# ---------- Addresses of pages ----------


def href_owner(db: DbSession, href: str) -> str | None:
    """Who already uses this address: "категорія «…»" / "обладнання «…»" /
    "тема новин «…»" / "новина «…»", or None."""
    category = db.scalar(
        select(EquipmentCategory).where(EquipmentCategory.href == href)
    )
    if category:
        return f"категорія «{category.title_uk}»"
    topic = db.scalar(select(NewsTopic).where(NewsTopic.href == href))
    if topic:
        return f"тема новин «{topic.title_uk}»"
    news = db.scalar(select(News).where(News.href == href))
    if news:
        return f"новина «{news.title_uk}»"
    for sub in db.scalars(
        select(EquipmentSubcategory).where(
            EquipmentSubcategory.items.contains([{"href": href}])
        )
    ):
        item = next(i for i in sub.items if i.get("href") == href)
        return f"обладнання «{item['title']['uk']}» (підкатегорія «{sub.title_uk}»)"
    return None


def check_item_hrefs(db: DbSession, sub: EquipmentSubcategory, items: list[dict]):
    """Every address of equipment belongs to one page only."""
    seen: dict[str, str] = {}
    for item in items:
        href = item.get("href", "")
        if not href:
            continue
        title = item["title"]["uk"]
        if href in seen:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Адреса {href} вказана і в «{seen[href]}», і в «{title}»",
            )
        seen[href] = title
        # Taken by this same subcategory before the change: that is fine
        if any(i.get("href") == href and i["id"] == item["id"] for i in sub.items):
            continue
        owner = href_owner(db, href)
        if owner:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Адреса {href} уже зайнята: {owner}. Вкажіть іншу.",
            )


# ---------- Photos used by pages ----------

TEXT_IMAGE = re.compile(r'<img[^>]+src="(' + re.escape(PAGE_IMAGES_PREFIX) + r'[^"]+)"')


def page_images(blocks: list[dict]) -> set[str]:
    """Addresses of all uploaded photos and PDF catalogs the blocks use."""
    found: set[str] = set()
    for block in blocks:
        kind = block.get("type")
        if kind == "slider":
            found.update(block.get("images", []))
        elif kind == "photo" and block.get("image"):
            found.add(block["image"])
        elif kind == "gallery":
            found.update(photo["image"] for photo in block.get("photos", []))
        elif kind == "text":
            for html in block.get("html", {}).values():
                found.update(TEXT_IMAGE.findall(html))
        elif kind == "catalogs":
            for catalog in block.get("items", []):
                for key in ("file_uk", "file_en"):
                    if catalog.get(key):
                        found.add(catalog[key]["url"])
    return {
        address
        for address in found
        if address.startswith((PAGE_IMAGES_PREFIX, PAGE_FILES_PREFIX))
    }


def item_images(items: list[dict]) -> set[str]:
    return {item["image"] for item in items if item.get("image")}


def delete_page_images(addresses: set[str]) -> None:
    for address in addresses:
        delete_image(address.removeprefix(f"{UPLOADS_URL}/"))


def subcategory_images(db: DbSession, sub: EquipmentSubcategory) -> set[str]:
    """Photos of the equipment cards and photos and catalogs of their pages."""
    found = item_images(sub.items)
    for page in equipment_pages(db, sub.id):
        found |= page_images(page.blocks)
    return found


def category_images(db: DbSession, category_id: int) -> set[str]:
    """All photos and catalogs of the page of a category, of its subcategories and of the
    pages of their equipment (they go away together with the category)."""
    page = find_page(db, category_id)
    found = page_images(page.blocks) if page else set()
    subcategories = db.scalars(
        select(EquipmentSubcategory).where(
            EquipmentSubcategory.category_id == category_id
        )
    )
    for subcategory in subcategories:
        found |= subcategory_images(db, subcategory)
    return found


def upload(file: UploadFile) -> dict:
    return {"url": image_url(save_image(file, "pages", max_width=1920))}


def upload_pdf(file: UploadFile) -> dict:
    relative, name, size = save_pdf(file)
    return {"url": image_url(relative), "name": name, "size": size}


def check_kinds(blocks: list[dict], forbidden: set[str], where: str) -> None:
    """Some blocks belong only to one kind of page."""
    for index, block in enumerate(blocks):
        if block["type"] in forbidden:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Блок {index + 1}: такого блоку не буває на сторінці {where}",
            )


# ---------- What the site shows ----------


def has_cells(cells: list[dict]) -> bool:
    return any(pick(cell, "uk").strip() for cell in cells)


def shown_image(url: str | None) -> str | None:
    """The photo of a machine for the cards of the site: a photo on plain white is shown cut out
    (its white made see-through), so the machine can come out of its card."""
    if url and cutout_kind(url) == "white":
        return cut_out_white(url) or url
    return url


def subcategory_for_site(block: dict, lang: Lang, db: DbSession) -> dict | None:
    """The chosen subcategory with its visible equipment, or None if there is nothing to show."""
    chosen = block.get("subcategory_id")
    subcategory = db.get(EquipmentSubcategory, chosen) if chosen else None
    if subcategory is None or not subcategory.is_visible:
        return None
    category = db.get(EquipmentCategory, subcategory.category_id)
    # The small line above each name is the name of the category ("Italian ice cream Gelato")
    label = (
        pick({"uk": category.title_uk, "en": category.title_en}, lang)
        if category
        else ""
    )
    # A card leads to the page of its equipment once that page is made (saved)
    with_page = {page.item_id for page in equipment_pages(db, subcategory.id)}
    items = [
        {
            "id": item["id"],
            "image": shown_image(item.get("image")),
            "title": pick(item["title"], lang),
            "label": label,
            "text": pick(item["text"], lang),
            "href": item.get("href", "") if item["id"] in with_page else "",
            # The machine stands on a transparent background (or on plain white, cut out by the
            # server): on the site it comes out of its card
            "cutout": cutout_kind(shown_image(item.get("image"))),
        }
        for item in subcategory.items
        if item.get("visible", True)
    ]
    if not items:
        return None
    title = pick({"uk": subcategory.title_uk, "en": subcategory.title_en}, lang)
    return {"title": title if block.get("show_title", True) else "", "items": items}


def block_for_site(block: dict, lang: Lang, db: DbSession) -> dict | None:
    """The block in one language as the site needs it, or None when it is hidden
    or has nothing to show."""
    if not block.get("visible", True):
        return None
    kind = block["type"]
    base = {"id": block["id"], "type": kind}

    if kind == "slider":
        images = block["images"]
        if not images:
            return None
        return {**base, "images": images, "autoplay": block["autoplay"]}
    if kind == "photo":
        return {**base, "image": block["image"]} if block.get("image") else None
    if kind == "text":
        # Cleaned again, so texts saved before a cleaning rule appeared follow it too
        # (e.g. links to the old site carpigiani.com.ua become links to this site)
        html = clean_html(pick(block["html"], lang))
        if not html:
            return None
        return {**base, "title": pick(block["title"], lang), "html": html}
    if kind == "gallery":
        if not block["photos"]:
            return None
        photos = [
            {
                "image": p["image"],
                "caption": pick(p["caption"], lang),
                "link": site_link(p["link"]),
            }
            for p in block["photos"]
        ]
        return {
            **base,
            "photos": photos,
            "per_row": block["per_row"],
            "captions": block["captions"],
            "zoom": block["zoom"],
        }
    if kind == "features":
        items = [
            {"title": pick(item["title"], lang), "text": pick(item["text"], lang)}
            for item in block["items"]
        ]
        items = [i for i in items if i["title"].strip() or i["text"].strip()]
        if not items:
            return None
        return {**base, "title": pick(block["title"], lang), "items": items}
    if kind == "table":
        rows = [row for row in block["rows"] if has_cells(row)]
        if not rows and not has_cells(block["header"]):
            return None
        header = block["header"] if has_cells(block["header"]) else []
        return {
            **base,
            "title": pick(block["title"], lang),
            "header": [pick(cell, lang) for cell in header],
            "rows": [[pick(cell, lang) for cell in row] for row in rows],
        }
    if kind == "video":
        video = youtube_id(block["url"]) if block["url"] else None
        if not video:
            return None
        return {**base, "video_id": video, "caption": pick(block["caption"], lang)}
    if kind == "subcategory":
        shown = subcategory_for_site(block, lang, db)
        return {**base, **shown} if shown else None
    if kind == "categories":
        # The site puts the category cards of the brand here
        return base
    if kind == "catalogs":
        catalogs = []
        for catalog in block["items"]:
            file = pick_file(catalog, lang)
            if file:
                label = pick(catalog["label"], lang).strip()
                catalogs.append({**file, "label": label or file["name"]})
        return {**base, "items": catalogs} if catalogs else None
    return None


def blocks_for_site(blocks: list[dict], lang: Lang, db: DbSession) -> list[dict]:
    return [shown for block in blocks if (shown := block_for_site(block, lang, db))]


def category_has_page(db: DbSession, category: EquipmentCategory) -> bool:
    """Whether the card / menu item of a category leads to its page (29.10): only when the page
    shows something besides the title — at least one block with something in it. Until then
    the site shows the category as plain text. A link to another site always leads there."""
    if category.href.startswith("http"):
        return True
    page = find_page(db, category.id)
    return page is not None and bool(blocks_for_site(page.blocks, "uk", db))


def brand_of(db: DbSession, key: str) -> BrandModel | None:
    """The brand of a category if it is shown on the site (a hidden brand hides all its pages)."""
    brand = db.scalar(select(BrandModel).where(BrandModel.key == key))
    return brand if brand is not None and brand.is_visible else None


def brand_title(brand: BrandModel, lang: Lang) -> str:
    """The name of a brand in the breadcrumbs: the title of its page, or its name."""
    return pick(
        {
            "uk": brand.page_title_uk or brand.title_uk,
            "en": brand.page_title_en or brand.title_en,
        },
        lang,
    )


def equipment_for_site(db: DbSession, href: str, lang: Lang) -> PublicPage | None:
    """The page of the equipment with this address, if the equipment, its subcategory and
    its category are shown on the site and the page has been made."""
    for sub in db.scalars(
        select(EquipmentSubcategory).where(
            EquipmentSubcategory.items.contains([{"href": href}]),
            EquipmentSubcategory.is_visible.is_(True),
        )
    ):
        item = next(i for i in sub.items if i.get("href") == href)
        category = db.get(EquipmentCategory, sub.category_id)
        if not item.get("visible", True) or category is None or not category.is_visible:
            continue
        brand = brand_of(db, category.brand)
        if brand is None:
            continue
        page = find_equipment_page(db, sub.id, item["id"])
        if page is None:
            continue
        previous, following = equipment_neighbours(db, category.id, href, lang)
        return PublicPage(
            kind="equipment",
            brand=category.brand,
            brand_title=brand_title(brand, lang),
            brand_href=brand.href,
            title=pick({"uk": page.title_uk, "en": page.title_en}, lang),
            category_title=pick(
                {"uk": category.title_uk, "en": category.title_en}, lang
            ),
            category_href=category.href if category.href.startswith("/") else "",
            item_title=pick(item["title"], lang),
            blocks=blocks_for_site(page.blocks, lang, db),
            prev_item=previous,
            next_item=following,
        )
    return None


def equipment_neighbours(
    db: DbSession, category_id: int, href: str, lang: Lang
) -> tuple[dict | None, dict | None]:
    """The equipment before and after this one in its category, in the order of the site
    (subcategories one after another, the equipment inside them), only that which has a page:
    for the arrows of the equipment page. None at the ends (a pale arrow, as in the quick view)."""
    models = []
    for sub in db.scalars(
        select(EquipmentSubcategory)
        .where(
            EquipmentSubcategory.category_id == category_id,
            EquipmentSubcategory.is_visible.is_(True),
        )
        .order_by(EquipmentSubcategory.sort_order, EquipmentSubcategory.id)
    ):
        with_page = {page.item_id for page in equipment_pages(db, sub.id)}
        models += [
            {
                "href": item["href"],
                "title": pick(item["title"], lang),
                "image": item.get("image"),
            }
            for item in sub.items
            if item.get("visible", True)
            and item.get("href")
            and item["id"] in with_page
        ]
    here = next((i for i, model in enumerate(models) if model["href"] == href), None)
    if here is None:
        return None, None
    previous = models[here - 1] if here > 0 else None
    following = models[here + 1] if here + 1 < len(models) else None
    return previous, following


@public_router.get("/catalog")
def get_equipment_map(
    db: DbSession, lang: Lang = "uk", brand: Brand = "carpigiani"
) -> list[dict]:
    """The "map" of equipment for the right column of equipment pages: categories of one
    brand shown on the site, inside them subcategories (small headings) and the equipment
    that has a page. Built from the database, nothing to fill in. Empty categories are left out."""
    categories = db.scalars(
        select(EquipmentCategory)
        .where(EquipmentCategory.is_visible.is_(True), EquipmentCategory.brand == brand)
        .order_by(EquipmentCategory.sort_order, EquipmentCategory.id)
    )
    result = []
    for category in categories:
        subcategories = db.scalars(
            select(EquipmentSubcategory)
            .where(
                EquipmentSubcategory.category_id == category.id,
                EquipmentSubcategory.is_visible.is_(True),
            )
            .order_by(EquipmentSubcategory.sort_order, EquipmentSubcategory.id)
        )
        groups = []
        for sub in subcategories:
            with_page = {page.item_id for page in equipment_pages(db, sub.id)}
            items = [
                {"title": pick(item["title"], lang), "href": item["href"]}
                for item in sub.items
                if item.get("visible", True)
                and item.get("href")
                and item["id"] in with_page
            ]
            if items:
                title = pick({"uk": sub.title_uk, "en": sub.title_en}, lang)
                groups.append({"title": title, "items": items})
        if groups:
            result.append(
                {
                    "title": pick(
                        {"uk": category.title_uk, "en": category.title_en}, lang
                    ),
                    "href": category.href,
                    "has_page": category_has_page(db, category),
                    "groups": groups,
                }
            )
    return result


@public_router.get("/showcases")
def get_showcases(db: DbSession, lang: Lang = "uk", brand: Brand = "ifi") -> dict:
    """All showcases of a brand for the block with chips (/ifi and the home page): the chips are
    its categories shown on the site, the cards are the visible showcases of their visible
    subcategories, in the admin order. A card leads to the page of its showcase once that page
    is made. Categories without showcases get no chip."""
    categories = db.scalars(
        select(EquipmentCategory)
        .where(EquipmentCategory.is_visible.is_(True), EquipmentCategory.brand == brand)
        .order_by(EquipmentCategory.sort_order, EquipmentCategory.id)
    )
    owner = db.scalar(select(BrandModel).where(BrandModel.key == brand))
    # Chips switched off on the brand page: the equipment stays under "All"
    hidden = set(owner.hidden_chips or []) if owner else set()
    chips, items = [], []
    for category in categories:
        label = pick({"uk": category.title_uk, "en": category.title_en}, lang)
        found = 0
        for sub in db.scalars(
            select(EquipmentSubcategory)
            .where(
                EquipmentSubcategory.category_id == category.id,
                EquipmentSubcategory.is_visible.is_(True),
            )
            .order_by(EquipmentSubcategory.sort_order, EquipmentSubcategory.id)
        ):
            with_page = {page.item_id for page in equipment_pages(db, sub.id)}
            for item in sub.items:
                if not item.get("visible", True):
                    continue
                found += 1
                items.append(
                    {
                        "id": f"{sub.id}-{item['id']}",
                        "category": category.id,
                        "image": item.get("image"),
                        "title": pick(item["title"], lang),
                        "label": label,
                        "text": pick(item["text"], lang),
                        "href": item.get("href", "") if item["id"] in with_page else "",
                    }
                )
        if found and category.id not in hidden:
            chips.append({"id": category.id, "title": label})
    return {"chips": chips, "items": items}


@public_router.get("", response_model=PublicPage)
def get_public_page(
    db: DbSession,
    href: Annotated[str, Query(max_length=500)],
    lang: Lang = "uk",
):
    category = db.scalar(
        select(EquipmentCategory).where(
            EquipmentCategory.href == href, EquipmentCategory.is_visible.is_(True)
        )
    )
    page = find_page(db, category.id) if category else None
    brand = brand_of(db, category.brand) if category else None
    if category is not None and page is not None and brand is not None:
        return PublicPage(
            kind="category",
            brand=category.brand,
            brand_title=brand_title(brand, lang),
            brand_href=brand.href,
            title=pick({"uk": page.title_uk, "en": page.title_en}, lang),
            category_title=pick(
                {"uk": category.title_uk, "en": category.title_en}, lang
            ),
            category_href=category.href,
            blocks=blocks_for_site(page.blocks, lang, db),
        )
    equipment = equipment_for_site(db, href, lang)
    if equipment is not None:
        return equipment
    # Pages of news and of news topics (app/routers/news_router.py; imported here, because
    # that router itself is built on the helpers of this one)
    from app.routers.news_router import news_page_for_site

    news = news_page_for_site(db, href, lang)
    if news is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сторінку не знайдено")
    return news


# ---------- Admin: category pages ----------


def category_page_admin(
    category: EquipmentCategory, page: CategoryPage | None
) -> CategoryPageAdmin:
    return CategoryPageAdmin(
        category_id=category.id,
        category_brand=category.brand,
        category_title=category.title_uk,
        category_href=category.href,
        saved=page is not None,
        # A new page starts with the name of its category
        title_uk=page.title_uk if page else category.title_uk,
        title_en=page.title_en if page else category.title_en,
        blocks=page.blocks if page else [],
    )


@admin_router.get(
    "/equipment-categories/{category_id}/page", response_model=CategoryPageAdmin
)
def get_category_page(category_id: int, db: DbSession):
    category = get_category(db, category_id)
    return category_page_admin(category, find_page(db, category_id))


@admin_router.put(
    "/equipment-categories/{category_id}/page", response_model=CategoryPageAdmin
)
def save_category_page(category_id: int, data: PageSave, db: DbSession):
    category = get_category(db, category_id)
    page = find_page(db, category_id)
    blocks = blocks_adapter.dump_python(data.blocks, mode="json")
    check_kinds(blocks, {"catalogs", "photo", "categories"}, "категорії")

    old_images = page_images(page.blocks) if page else set()
    if page is None:
        page = CategoryPage(category_id=category_id)
        db.add(page)
    page.title_uk = data.title_uk
    page.title_en = data.title_en
    page.blocks = blocks
    db.commit()
    db.refresh(page)

    # Photos taken out of the page are not needed any more
    delete_page_images(old_images - page_images(blocks))
    return category_page_admin(category, page)


@admin_router.post(
    "/equipment-categories/{category_id}/page/images",
    status_code=status.HTTP_201_CREATED,
)
def upload_category_image(
    category_id: int, db: DbSession, image: Annotated[UploadFile, File()]
):
    """A photo for a block. It becomes part of the page when the page is saved."""
    get_category(db, category_id)
    return upload(image)


# ---------- Admin: subcategories ----------


def list_item(sub: EquipmentSubcategory) -> SubcategoryListItem:
    return SubcategoryListItem(
        id=sub.id,
        category_id=sub.category_id,
        title_uk=sub.title_uk,
        title_en=sub.title_en,
        is_visible=sub.is_visible,
    )


def subcategory_admin(sub: EquipmentSubcategory, category: EquipmentCategory):
    return SubcategoryAdmin(
        id=sub.id,
        category_id=category.id,
        category_brand=category.brand,
        category_title=category.title_uk,
        category_href=category.href,
        title_uk=sub.title_uk,
        title_en=sub.title_en,
        is_visible=sub.is_visible,
        items=sub.items,
    )


@admin_router.get("/subcategories", response_model=list[SubcategoryListItem])
def list_subcategories(db: DbSession):
    rows = db.execute(
        select(EquipmentSubcategory)
        .join(
            EquipmentCategory, EquipmentSubcategory.category_id == EquipmentCategory.id
        )
        .order_by(
            EquipmentCategory.sort_order,
            EquipmentCategory.id,
            EquipmentSubcategory.sort_order,
            EquipmentSubcategory.id,
        )
    )
    return [list_item(sub) for (sub,) in rows]


@admin_router.post(
    "/subcategories",
    response_model=SubcategoryListItem,
    status_code=status.HTTP_201_CREATED,
)
def create_subcategory(data: SubcategoryCreate, db: DbSession):
    category = get_category(db, data.category_id)
    last = db.scalar(
        select(EquipmentSubcategory.sort_order)
        .where(EquipmentSubcategory.category_id == category.id)
        .order_by(EquipmentSubcategory.sort_order.desc())
        .limit(1)
    )
    subcategory = EquipmentSubcategory(
        category_id=category.id,
        title_uk=data.title_uk,
        title_en=data.title_en.strip(),
        sort_order=(last or 0) + 1,
        items=[],
    )
    db.add(subcategory)
    db.commit()
    db.refresh(subcategory)
    return list_item(subcategory)


@admin_router.get("/subcategories/{subcategory_id}", response_model=SubcategoryAdmin)
def get_subcategory_admin(subcategory_id: int, db: DbSession):
    sub = get_subcategory(db, subcategory_id)
    return subcategory_admin(sub, get_category(db, sub.category_id))


@admin_router.put("/subcategories/{subcategory_id}", response_model=SubcategoryAdmin)
def save_subcategory(subcategory_id: int, data: SubcategorySave, db: DbSession):
    sub = get_subcategory(db, subcategory_id)
    category = get_category(db, sub.category_id)
    items = items_adapter.dump_python(data.items, mode="json")
    check_item_hrefs(db, sub, items)
    old_images = subcategory_images(db, sub)

    # Equipment taken out of the list loses its page too
    kept = {item["id"] for item in items}
    for page in equipment_pages(db, sub.id):
        if page.item_id not in kept:
            db.delete(page)

    sub.title_uk = data.title_uk
    sub.title_en = data.title_en
    sub.is_visible = data.is_visible
    sub.items = items
    db.commit()
    db.refresh(sub)

    delete_page_images(old_images - subcategory_images(db, sub))
    return subcategory_admin(sub, category)


@admin_router.post(
    "/subcategories/{subcategory_id}/images", status_code=status.HTTP_201_CREATED
)
def upload_subcategory_image(
    subcategory_id: int, db: DbSession, image: Annotated[UploadFile, File()]
):
    """A photo for an equipment card. It is kept when the subcategory is saved."""
    get_subcategory(db, subcategory_id)
    return upload(image)


@admin_router.delete(
    "/subcategories/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_subcategory(subcategory_id: int, db: DbSession):
    sub = get_subcategory(db, subcategory_id)
    # The pages of its equipment go away with it (and their photos and catalogs)
    images = subcategory_images(db, sub)
    db.delete(sub)
    db.commit()
    delete_page_images(images)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Admin: pages of equipment ----------


def equipment_page_admin(
    db: DbSession, sub: EquipmentSubcategory, item: dict, page: EquipmentPage | None
) -> EquipmentPageAdmin:
    category = get_category(db, sub.category_id)
    return EquipmentPageAdmin(
        subcategory_id=sub.id,
        subcategory_title=sub.title_uk,
        category_id=category.id,
        category_brand=category.brand,
        category_title=category.title_uk,
        item_id=item["id"],
        item_title=item["title"]["uk"],
        href=item.get("href", ""),
        item_visible=bool(item.get("visible", True) and sub.is_visible),
        saved=page is not None,
        # A new page starts with the name of the equipment
        title_uk=page.title_uk if page else item["title"]["uk"],
        title_en=page.title_en if page else item["title"].get("en", ""),
        blocks=page.blocks if page else [],
    )


EQUIPMENT_PAGE = "/subcategories/{subcategory_id}/items/{item_id}/page"


@admin_router.get(EQUIPMENT_PAGE, response_model=EquipmentPageAdmin)
def get_equipment_page(subcategory_id: int, item_id: str, db: DbSession):
    sub = get_subcategory(db, subcategory_id)
    item = find_item(sub, item_id)
    return equipment_page_admin(db, sub, item, find_equipment_page(db, sub.id, item_id))


@admin_router.put(EQUIPMENT_PAGE, response_model=EquipmentPageAdmin)
def save_equipment_page(
    subcategory_id: int, item_id: str, data: PageSave, db: DbSession
):
    sub = get_subcategory(db, subcategory_id)
    item = find_item(sub, item_id)
    blocks = blocks_adapter.dump_python(data.blocks, mode="json")
    # A slider saved before the "Main photo" block appeared is still accepted
    check_kinds(blocks, {"subcategory", "categories"}, "обладнання")
    page = find_equipment_page(db, sub.id, item_id)

    old_images = page_images(page.blocks) if page else set()
    if page is None:
        page = EquipmentPage(subcategory_id=sub.id, item_id=item_id)
        db.add(page)
    page.title_uk = data.title_uk
    page.title_en = data.title_en
    page.blocks = blocks
    db.commit()
    db.refresh(page)

    # Photos and catalogs taken out of the page are not needed any more
    delete_page_images(old_images - page_images(blocks))
    return equipment_page_admin(db, sub, item, page)


@admin_router.post(f"{EQUIPMENT_PAGE}/images", status_code=status.HTTP_201_CREATED)
def upload_equipment_image(
    subcategory_id: int,
    item_id: str,
    db: DbSession,
    image: Annotated[UploadFile, File()],
):
    """A photo for a block. It becomes part of the page when the page is saved."""
    find_item(get_subcategory(db, subcategory_id), item_id)
    return upload(image)


@admin_router.post(f"{EQUIPMENT_PAGE}/files", status_code=status.HTTP_201_CREATED)
def upload_equipment_catalog(
    subcategory_id: int,
    item_id: str,
    db: DbSession,
    file: Annotated[UploadFile, File()],
):
    """A PDF catalog for the "Catalogs" block. It becomes part of the page when the page is saved."""
    find_item(get_subcategory(db, subcategory_id), item_id)
    return upload_pdf(file)
