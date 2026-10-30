"""Search over the site (29.10): equipment, showcases, categories, brand pages and news.

Looks in the titles first, then in the texts of their pages. The site is small, so everything
shown on the site is read and matched here, nothing extra to keep in the database.
Latin and Cyrillic spellings of model names find each other ("маестро" → Maestro).
"""

import html
import re
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.db.session import DbSession
from app.models import Brand, EquipmentCategory, EquipmentSubcategory, News, NewsTopic
from app.routers.brands_router import logo_url
from app.routers.pages_router import equipment_pages, find_page, shown_image
from app.schemas.page_blocks import Lang, pick
from app.services.auth import get_current_user
from app.services.images import image_url

router = APIRouter(prefix="/api/search", tags=["search"])

# Groups in the order the site shows them
GROUPS = ("equipment", "showcases", "categories", "brands", "news")

_TO_LATIN = {
    "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g", "д": "d", "е": "e", "є": "ie",
    "ж": "zh", "з": "z", "и": "y", "і": "i", "ї": "i", "й": "i", "к": "k", "л": "l",
    "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ь": "", "ю": "iu",
    "я": "ia", "ё": "e", "ы": "y", "э": "e", "ъ": "",
}  # fmt: skip
# Latin letters as people type them in Ukrainian ("маестро", "реді", "гелато")
_TO_CYR = [
    ("sh", "ш"), ("ch", "ч"), ("zh", "ж"), ("kh", "х"), ("ts", "ц"), ("ya", "я"),
    ("yu", "ю"), ("a", "а"), ("b", "б"), ("c", "к"), ("d", "д"), ("e", "е"), ("f", "ф"),
    ("g", "г"), ("h", "х"), ("i", "і"), ("j", "й"), ("k", "к"), ("l", "л"), ("m", "м"),
    ("n", "н"), ("o", "о"), ("p", "п"), ("q", "к"), ("r", "р"), ("s", "с"), ("t", "т"),
    ("u", "у"), ("v", "в"), ("w", "в"), ("x", "кс"), ("y", "і"), ("z", "з"),
]  # fmt: skip

TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")


def plain(text: str) -> str:
    """Text without HTML tags, in one line."""
    return SPACE.sub(" ", html.unescape(TAG.sub(" ", text or ""))).strip()


def to_latin(text: str) -> str:
    return "".join(_TO_LATIN.get(ch, ch) for ch in text)


def to_cyrillic(text: str) -> str:
    out, i = "", 0
    while i < len(text):
        for lat, cyr in _TO_CYR:
            if text.startswith(lat, i):
                out += cyr
                i += len(lat)
                break
        else:
            out += text[i]
            i += 1
    return out


def variants(query: str) -> list[str]:
    """The query as typed and in the other alphabet (lower case)."""
    q = SPACE.sub(" ", query.lower()).strip()
    found = [q, to_latin(q), to_cyrillic(q)]
    return [v for i, v in enumerate(found) if v and v not in found[:i]]


def find(text: str, words: list[str]) -> int:
    """Where the first variant is found in the text (-1: nowhere). The text is matched in
    lower case and also in Latin letters (so "маестро" finds "Maestro")."""
    low = text.lower()
    for word in words:
        at = low.find(word)
        if at >= 0:
            return at
    latin = to_latin(low)
    if len(latin) == len(low):
        for word in words:
            at = latin.find(to_latin(word))
            if at >= 0:
                return at
    return -1


def snippet(text: str, at: int, length: int) -> str:
    """A piece of the text around the found word."""
    start = max(0, at - 60)
    end = min(len(text), at + length + 90)
    piece = text[start:end].strip()
    return ("…" if start > 0 else "") + piece + ("…" if end < len(text) else "")


def blocks_text(blocks: list | None, lang: Lang) -> str:
    """All the words of the blocks of a page: texts, titles, features, tables, captions."""
    parts: list[str] = []
    for block in blocks or []:
        if not block.get("visible", True):
            continue
        for key in ("title", "caption"):
            value = block.get(key)
            if isinstance(value, dict):
                parts.append(pick(value, lang))
        if isinstance(block.get("html"), dict):
            parts.append(plain(pick(block["html"], lang)))
        for item in block.get("items") or []:
            if isinstance(item, dict):
                for key in ("title", "text"):
                    if isinstance(item.get(key), dict):
                        parts.append(pick(item[key], lang))
        for row in [block.get("header") or []] + list(block.get("rows") or []):
            for cell in row:
                if isinstance(cell, dict):
                    parts.append(pick(cell, lang))
    return plain(" ".join(p for p in parts if p))


@router.get("")
def search(
    db: DbSession,
    q: Annotated[str, Query(max_length=80)] = "",
    lang: Lang = "uk",
    limit: Annotated[int, Query(ge=1, le=200)] = 40,
) -> dict:
    words = variants(q)
    if not words or len(words[0]) < 2:
        return {"query": q, "total": 0, "items": []}

    found: list[dict] = []

    def add(
        group: str, title: str, href: str, image: str | None, text: str, extra: str = ""
    ):
        if not href:
            return
        at = find(title, words)
        if at >= 0:
            found.append(
                {"group": group, "title": title, "href": href, "image": image,
                 "snippet": extra, "in_title": True}
            )  # fmt: skip
            return
        at = find(text, words)
        if at >= 0:
            found.append(
                {"group": group, "title": title, "href": href, "image": image,
                 "snippet": snippet(text, at, len(words[0])), "in_title": False}
            )  # fmt: skip

    brands = {
        b.key: b for b in db.scalars(select(Brand).where(Brand.is_visible.is_(True)))
    }
    categories = db.scalars(
        select(EquipmentCategory)
        .where(EquipmentCategory.is_visible.is_(True))
        .order_by(EquipmentCategory.sort_order, EquipmentCategory.id)
    ).all()
    for category in categories:
        brand = brands.get(category.brand)
        if brand is None:
            continue
        group = "equipment" if category.brand == "carpigiani" else "showcases"
        page = find_page(db, category.id)
        title = pick({"uk": category.title_uk, "en": category.title_en}, lang)
        if page is not None and not category.href.startswith("http"):
            add(
                "categories",
                title,
                category.href,
                image_url(category.image) if category.image else None,
                blocks_text(page.blocks, lang),
            )
        for sub in db.scalars(
            select(EquipmentSubcategory).where(
                EquipmentSubcategory.category_id == category.id,
                EquipmentSubcategory.is_visible.is_(True),
            )
        ):
            pages = {p.item_id: p for p in equipment_pages(db, sub.id)}
            for item in sub.items:
                if not item.get("visible", True) or item["id"] not in pages:
                    continue
                text = pick(item.get("text") or {}, lang)
                body = blocks_text(pages[item["id"]].blocks, lang)
                add(
                    group,
                    pick(item["title"], lang),
                    item.get("href", ""),
                    shown_image(item.get("image")),
                    f"{text} {body}",
                    extra=text,
                )

    for brand in brands.values():
        title = pick(
            {
                "uk": brand.page_title_uk or brand.title_uk,
                "en": brand.page_title_en or brand.title_en,
            },
            lang,
        )
        subtitle = pick({"uk": brand.subtitle_uk, "en": brand.subtitle_en}, lang)
        add(
            "brands",
            title,
            brand.href,
            logo_url(brand),
            f"{subtitle} {blocks_text(brand.blocks, lang)}",
            extra=subtitle,
        )

    for news in db.scalars(
        select(News).where(News.is_visible.is_(True)).order_by(News.published_on.desc())
    ):
        summary = pick({"uk": news.summary_uk, "en": news.summary_en}, lang)
        add(
            "news",
            pick({"uk": news.title_uk, "en": news.title_en or news.title_uk}, lang),
            news.href,
            news.image,
            f"{summary} {blocks_text(news.blocks, lang)}",
            extra=summary,
        )

    # Titles first, then texts; inside: by group
    found.sort(key=lambda r: (not r["in_title"], GROUPS.index(r["group"])))
    return {"query": q, "total": len(found), "items": found[:limit]}


# ---------- Search in the admin panel (30.10) ----------
# The same matching as on the site, but over everything, hidden things too, and the results
# lead to the screens of the admin panel. Each result also says where it is ("Carpigiani ›
# Італійське морозиво › Апарати"), so a model deep inside a brand is found at once.

ADMIN = "/fofkas-adminpanel"
ADMIN_GROUPS = ("equipment", "subcategories", "categories", "brands", "news", "topics")

admin_router = APIRouter(
    prefix="/api/admin/search",
    tags=["search (admin)"],
    dependencies=[Depends(get_current_user)],
)


@admin_router.get("")
def admin_search(
    db: DbSession,
    q: Annotated[str, Query(max_length=80)] = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
) -> dict:
    words = variants(q)
    if not words or len(words[0]) < 2:
        return {"query": q, "total": 0, "items": []}

    found: list[dict] = []

    def add(group: str, title: str, href: str, where: str, *, image: str | None,
            text: str = "", hidden: bool = False, site: str = ""):  # fmt: skip
        title = title or "(без назви)"
        at = find(title, words)
        in_title = at >= 0
        if not in_title:
            at = find(text, words)
            if at < 0:
                return
        found.append(
            {"group": group, "title": title, "href": href, "where": where,
             "image": image, "hidden": hidden, "site": site, "in_title": in_title,
             "snippet": "" if in_title else snippet(text, at, len(words[0]))}
        )  # fmt: skip

    brands = {b.key: b for b in db.scalars(select(Brand))}
    for brand in brands.values():
        add("brands", brand.title_uk, f"{ADMIN}/brands/{brand.key}", "Виробники",
            image=logo_url(brand), hidden=not brand.is_visible, site=brand.href,
            text=f"{brand.subtitle_uk or ''} {blocks_text(brand.blocks, 'uk')}")  # fmt: skip

    categories = db.scalars(
        select(EquipmentCategory).order_by(
            EquipmentCategory.sort_order, EquipmentCategory.id
        )
    ).all()
    for category in categories:
        brand = brands.get(category.brand)
        brand_title = brand.title_uk if brand else category.brand
        base = f"{ADMIN}/brands/{category.brand}/{category.id}"
        page = find_page(db, category.id)
        hidden = not category.is_visible or (brand is not None and not brand.is_visible)
        add("categories", category.title_uk, base, brand_title,
            image=image_url(category.image) if category.image else None, hidden=hidden,
            site=category.href, text=blocks_text(page.blocks if page else [], "uk"))  # fmt: skip
        for sub in db.scalars(
            select(EquipmentSubcategory).where(
                EquipmentSubcategory.category_id == category.id
            )
        ):
            sub_href = f"{base}/subcategories/{sub.id}"
            sub_where = f"{brand_title} › {category.title_uk}"
            sub_hidden = hidden or not sub.is_visible
            add("subcategories", sub.title_uk, sub_href, sub_where, image=None,
                hidden=sub_hidden)  # fmt: skip
            pages = {p.item_id: p for p in equipment_pages(db, sub.id)}
            for item in sub.items:
                page = pages.get(item["id"])
                text = pick(item.get("text") or {}, "uk")
                add("equipment", pick(item.get("title") or {}, "uk"),
                    f"{sub_href}/items/{item['id']}", f"{sub_where} › {sub.title_uk}",
                    image=shown_image(item.get("image")),
                    hidden=sub_hidden or not item.get("visible", True),
                    site=item.get("href", ""),
                    text=f"{text} {blocks_text(page.blocks if page else [], 'uk')}")  # fmt: skip

    topics = {t.id: t for t in db.scalars(select(NewsTopic))}
    for topic in topics.values():
        add("topics", topic.title_uk, f"{ADMIN}/news/topics/{topic.id}", "Новини › Теми",
            image=None, hidden=not topic.is_visible, site=topic.href)  # fmt: skip
    for news in db.scalars(select(News).order_by(News.published_on.desc())):
        topic = topics.get(news.topic_id) if news.topic_id else None
        add("news", news.title_uk, f"{ADMIN}/news/{news.id}",
            f"Новини › {topic.title_uk}" if topic else "Новини", image=news.image,
            hidden=not news.is_visible, site=news.href,
            text=f"{news.summary_uk or ''} {blocks_text(news.blocks, 'uk')}")  # fmt: skip

    found.sort(key=lambda r: (not r["in_title"], ADMIN_GROUPS.index(r["group"])))
    return {"query": q, "total": len(found), "items": found[:limit]}
