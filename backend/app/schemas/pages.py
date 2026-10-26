"""Pages built from blocks: what the admin panel sends and gets, and what the site gets."""

import re
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.page_blocks import Block, Text200, Text600, check_image, site_link

# Addresses the site uses for itself: a page of equipment cannot take them
RESERVED = re.compile(
    r"^/(en|ru|api|uploads|fofkas-adminpanel|_next|carpigiani)(/|$)", re.IGNORECASE
)


def clean_page_href(value: str) -> str:
    """Address of a page of this site, typed by the client: "/labotronic" (as on the old site).
    Empty means "not given yet"."""
    value = site_link(value.strip())
    if not value:
        return ""
    if (
        not value.startswith("/")
        or value.startswith("//")
        or value == "/"
        or len(value) > 300
        or re.search(r"[\s?#]", value)
    ):
        raise ValueError(
            "Адреса сторінки має починатися з «/» і бути без пробілів, наприклад /labotronic"
        )
    value = value.rstrip("/")
    # /news is the list of news itself (its topics and news have their own addresses)
    if RESERVED.match(value) or value.lower() == "/news":
        raise ValueError(f"Адреса {value} зайнята самим сайтом, оберіть іншу")
    return value


class PageSave(BaseModel):
    """What the admin panel sends when a page is saved. The English title may stay empty:
    then the site shows the Ukrainian one."""

    title_uk: Annotated[str, Field(max_length=200)]
    title_en: Annotated[str, Field(max_length=200)] = ""
    blocks: Annotated[list[Block], Field(max_length=60)] = []

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть заголовок сторінки українською")
        return value

    @field_validator("title_en")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class CategoryPageAdmin(PageSave):
    """A category page as the admin panel sees it."""

    category_id: int
    # Brand of the category: where its pages are in the admin panel (equipment or showcases)
    category_brand: str = "carpigiani"
    category_title: str
    category_href: str
    # False: the page has never been saved (the form starts from the category title)
    saved: bool


# ---------- Subcategories ----------


class SubcategoryCreate(BaseModel):
    category_id: int
    title_uk: Annotated[str, Field(max_length=120)]
    title_en: Annotated[str, Field(max_length=120)] = ""

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву підкатегорії")
        return value


class EquipmentItem(BaseModel):
    """One piece of equipment in a subcategory (like "Carpigiani Maestro" on the old site).
    On the site its card also shows the name of the category above the name."""

    id: Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")]
    visible: bool = True
    image: str | None = None
    title: Text200 = Text200()
    text: Text600 = Text600()
    # Address of the page of this equipment on the site, typed by the client ("/labotronic").
    # Required in the form; equipment added before the field appeared may still have none.
    href: Annotated[str, Field(max_length=300)] = ""

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return clean_page_href(value)

    @field_validator("image")
    @classmethod
    def _check_image(cls, value: str | None) -> str | None:
        return check_image(value) if value else None

    @field_validator("title")
    @classmethod
    def _need_title(cls, value: Text200) -> Text200:
        if not value.uk.strip():
            raise ValueError("Вкажіть назву обладнання українською")
        return Text200(uk=value.uk.strip(), en=value.en.strip())


class SubcategorySave(BaseModel):
    title_uk: Annotated[str, Field(max_length=120)]
    title_en: Annotated[str, Field(max_length=120)] = ""
    is_visible: bool = True
    items: Annotated[list[EquipmentItem], Field(max_length=60)] = []

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву підкатегорії українською")
        return value

    @field_validator("title_en")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class SubcategoryListItem(BaseModel):
    id: int
    category_id: int
    title_uk: str
    title_en: str
    is_visible: bool


class SubcategoryAdmin(SubcategorySave):
    id: int
    category_id: int
    # Brand of the category: where its pages are in the admin panel (equipment or showcases)
    category_brand: str = "carpigiani"
    category_title: str
    category_href: str


class EquipmentPageAdmin(PageSave):
    """A page of one piece of equipment as the admin panel sees it."""

    subcategory_id: int
    subcategory_title: str
    category_id: int
    category_brand: str = "carpigiani"
    category_title: str
    item_id: str
    item_title: str
    # Address of the page (typed in the form of the equipment); empty: not given yet
    href: str
    # The card is shown on the site (equipment and its subcategory are on)
    item_visible: bool
    # False: the page has never been saved (the form starts from the name of the equipment)
    saved: bool


# ---------- For the site ----------


class PublicPage(BaseModel):
    """A page for the site in one language: only visible blocks with something to show.
    kind "category": a category page (/gelato); "equipment": a page of equipment (/labotronic),
    then category_* is the category it belongs to (for the breadcrumbs);
    "news": a news item (/210500-hlbny) with its date, main photo, topic and other news;
    "news_topic": the page of a news topic (its news are asked for separately, page by page)."""

    kind: Literal["category", "equipment", "news", "news_topic"] = "category"
    # Brand of the category: the map of the right column shows the categories of this brand
    brand: str = "carpigiani"
    # The brand for the breadcrumbs: the title of its page and its address (/ifi)
    brand_title: str = ""
    brand_href: str = ""
    title: str
    category_title: str = ""
    category_href: str = ""
    # Equipment page: the name of the equipment (for "Inquiry about" in the contact form)
    item_title: str = ""
    blocks: list[dict]
    # News: date (2023-05-23), main photo, its topic (empty when it has none or the topic is
    # hidden) and the colour of the topic label (its place among the topics)
    date: str = ""
    image: str | None = None
    topic_title: str = ""
    topic_href: str = ""
    topic_tone: int = 0
    # News: the newer and the older news ({"href", "title"}), for the arrows of the page
    newer: dict | None = None
    older: dict | None = None
    # Equipment: the models before and after in its category ({"href", "title", "image"}),
    # for the arrows of the page
    prev_item: dict | None = None
    next_item: dict | None = None
