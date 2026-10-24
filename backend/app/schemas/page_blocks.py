"""Blocks of a page built in the admin panel: pages of categories and of subcategories.

Nine kinds of blocks, told apart by "type" ("subcategory" only on category pages,
"photo" (main photo) and "catalogs" only on equipment pages). Every block also has its own "id" (to keep
track of it in the admin panel) and "visible" (shown on the site or not).
Every text is given in two languages: {"uk": "...", "en": "..."}. The site shows the English
text on /en, and the Ukrainian one where the English is empty.
A block may be saved half-filled; the site skips blocks with nothing to show.
"""

import re
from typing import Annotated, Literal
from urllib.parse import parse_qs, urlparse

import nh3
from pydantic import BaseModel, Field, field_validator

# Photos of pages are uploaded through the admin panel and live here
PAGE_IMAGES_PREFIX = "/uploads/pages/"
# PDF catalogs of equipment pages
PAGE_FILES_PREFIX = "/uploads/files/"

Lang = Literal["uk", "en"]


def check_image(value: str) -> str:
    if not value.startswith(PAGE_IMAGES_PREFIX) or ".." in value:
        raise ValueError("Фото треба завантажити через адмін-панель")
    return value


# The new site lives at the same address as the old one, with the same page addresses,
# so links to the old site (e.g. pasted with its texts) become links to pages of this site.
OLD_SITE = re.compile(
    r"^https?://(www\.)?carpigiani\.com\.ua(?=[/?#]|$)", re.IGNORECASE
)


def site_link(value: str) -> str:
    """https://carpigiani.com.ua/labotronic → /labotronic; other addresses stay as they are."""
    if OLD_SITE.match(value):
        return OLD_SITE.sub("", value) or "/"
    return value


def clean_link(value: str) -> str:
    """A page of this site (/gelato) or a full address (https://...); empty means no link."""
    value = site_link(value.strip())
    if not value:
        return ""
    is_page = value.startswith("/") and not value.startswith("//")
    is_url = value.startswith(("https://", "http://"))
    if not (is_page or is_url) or " " in value or len(value) > 500:
        raise ValueError(
            "Посилання має бути сторінкою сайту (наприклад /gelato) або повною адресою (https://...)"
        )
    return value


# ---------- Text: what the editor may keep ----------

ALLOWED_TAGS = {
    "p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "a", "img", "blockquote",
}  # fmt: skip
# A photo in the text can stand on the left / in the middle / on the right (the text flows
# around it on the left and right) and be small / medium / large (the editor's photo buttons)
ALLOWED_ATTRIBUTES = {
    "a": {"href", "target"},
    "img": {"src", "alt", "data-align", "data-size"},
}
PHOTO_CHOICES = {
    "data-align": {"left", "center", "right"},
    "data-size": {"s", "m", "l"},
}


def keep_attribute(tag: str, attribute: str, value: str) -> str | None:
    """Links to the old site lead to this site; a photo keeps only known places and sizes."""
    if tag == "a" and attribute == "href":
        return site_link(value)
    if tag == "img" and attribute in PHOTO_CHOICES:
        return value if value in PHOTO_CHOICES[attribute] else None
    return value


LINK_TAG = re.compile(r"<a\s[^>]*>")


def same_tab_for_site_links(tag: re.Match) -> str:
    """Links to pages of this site open in the same tab (no target="_blank")."""
    text = tag.group(0)
    if 'href="/' in text:
        text = re.sub(r'\s+target="[^"]*"', "", text)
    return text


def clean_html(value: str) -> str:
    """Leaves only the formatting of the editor: no scripts, styles or unknown tags.
    Links to the old site become links to pages of this site."""
    html = nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes={"http", "https", "mailto", "tel"},
        link_rel="noopener",
        attribute_filter=keep_attribute,
    )
    html = LINK_TAG.sub(same_tab_for_site_links, html)
    # An editor that was cleared leaves an empty paragraph
    return "" if re.fullmatch(r"(\s|<p>(\s|<br>)*</p>)*", html) else html


# ---------- Texts in two languages ----------


class Text200(BaseModel):
    """Short text (a title, a caption) in two languages."""

    uk: Annotated[str, Field(max_length=200)] = ""
    en: Annotated[str, Field(max_length=200)] = ""


class Text300(BaseModel):
    """A table cell in two languages."""

    uk: Annotated[str, Field(max_length=300)] = ""
    en: Annotated[str, Field(max_length=300)] = ""


class Text600(BaseModel):
    """A short description in two languages."""

    uk: Annotated[str, Field(max_length=600)] = ""
    en: Annotated[str, Field(max_length=600)] = ""


class Html(BaseModel):
    """Text from the editor in two languages, cleaned before saving."""

    uk: Annotated[str, Field(max_length=100_000)] = ""
    en: Annotated[str, Field(max_length=100_000)] = ""

    @field_validator("uk", "en")
    @classmethod
    def _clean(cls, value: str) -> str:
        return clean_html(value)


def pick(text: dict, lang: Lang) -> str:
    """The text in the language of the page; the Ukrainian one if there is no English."""
    if lang == "en" and str(text.get("en", "")).strip():
        return text["en"]
    return text.get("uk", "")


# ---------- YouTube ----------

YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


def youtube_id(url: str) -> str | None:
    """The video code from any usual YouTube link (watch?v=, youtu.be/, shorts/, embed/)."""
    try:
        parts = urlparse(url.strip())
    except ValueError:
        return None
    host = (parts.hostname or "").removeprefix("www.").removeprefix("m.")
    candidate = None
    if host == "youtu.be":
        candidate = parts.path.strip("/").split("/")[0]
    elif host in ("youtube.com", "youtube-nocookie.com"):
        if parts.path == "/watch":
            candidate = parse_qs(parts.query).get("v", [None])[0]
        else:
            pieces = parts.path.strip("/").split("/")
            if len(pieces) >= 2 and pieces[0] in ("shorts", "embed", "live"):
                candidate = pieces[1]
    return candidate if candidate and YOUTUBE_ID.match(candidate) else None


# ---------- Blocks ----------


class BlockBase(BaseModel):
    id: Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")]
    visible: bool = True


class SliderBlock(BlockBase):
    type: Literal["slider"]
    images: Annotated[list[str], Field(max_length=6)] = []
    autoplay: bool = True

    @field_validator("images")
    @classmethod
    def _check(cls, value: list[str]) -> list[str]:
        return [check_image(image) for image in value]


class TextBlock(BlockBase):
    type: Literal["text"]
    title: Text200 = Text200()
    html: Html = Html()


class GalleryPhoto(BaseModel):
    image: str
    caption: Text200 = Text200()
    link: str = ""

    @field_validator("image")
    @classmethod
    def _check_image(cls, value: str) -> str:
        return check_image(value)

    @field_validator("link")
    @classmethod
    def _check_link(cls, value: str) -> str:
        return clean_link(value)


class GalleryBlock(BlockBase):
    type: Literal["gallery"]
    photos: Annotated[list[GalleryPhoto], Field(max_length=24)] = []
    per_row: Literal[3, 4, 6] = 3
    captions: bool = False
    zoom: bool = True


class Feature(BaseModel):
    title: Text200 = Text200()
    text: Text600 = Text600()


class FeaturesBlock(BlockBase):
    type: Literal["features"]
    title: Text200 = Text200()
    items: Annotated[list[Feature], Field(max_length=24)] = []


class TableBlock(BlockBase):
    type: Literal["table"]
    title: Text200 = Text200()
    # Column names, then the rows of the table (the same number of cells in each)
    header: Annotated[list[Text300], Field(max_length=12)] = []
    rows: Annotated[
        list[Annotated[list[Text300], Field(max_length=12)]], Field(max_length=80)
    ] = []


class VideoBlock(BlockBase):
    type: Literal["video"]
    url: Annotated[str, Field(max_length=300)] = ""
    caption: Text200 = Text200()

    @field_validator("url")
    @classmethod
    def _check(cls, value: str) -> str:
        value = value.strip()
        if value and youtube_id(value) is None:
            raise ValueError("Це не схоже на посилання на відео YouTube")
        return value


class SubcategoryBlock(BlockBase):
    type: Literal["subcategory"]
    subcategory_id: int | None = None
    show_title: bool = True


class PhotoBlock(BlockBase):
    """Main photo of an equipment page: one big photo of the machine in the middle."""

    type: Literal["photo"]
    image: str | None = None

    @field_validator("image")
    @classmethod
    def _check(cls, value: str | None) -> str | None:
        return check_image(value) if value else None


class CatalogFile(BaseModel):
    """An uploaded PDF: its address, the name shown on the site and the size in bytes."""

    url: Annotated[str, Field(max_length=300)]
    name: Annotated[str, Field(min_length=1, max_length=160)]
    size: Annotated[int, Field(ge=0)]

    @field_validator("url")
    @classmethod
    def _check(cls, value: str) -> str:
        if not value.startswith(PAGE_FILES_PREFIX) or ".." in value:
            raise ValueError("Каталог треба завантажити через адмін-панель")
        return value


class Catalog(BaseModel):
    """One catalog to download: the text of the button and the PDF for each language.
    Only one file is enough: then both languages of the site get it."""

    id: Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")]
    label: Text200 = Text200()
    file_uk: CatalogFile | None = None
    file_en: CatalogFile | None = None


class CatalogsBlock(BlockBase):
    type: Literal["catalogs"]
    items: Annotated[list[Catalog], Field(max_length=4)] = []


Block = Annotated[
    SliderBlock
    | TextBlock
    | GalleryBlock
    | FeaturesBlock
    | TableBlock
    | VideoBlock
    | SubcategoryBlock
    | PhotoBlock
    | CatalogsBlock,
    Field(discriminator="type"),
]


def pick_file(catalog: dict, lang: Lang) -> dict | None:
    """The PDF for the language of the page; the other one if this language has none."""
    own, other = ("file_en", "file_uk") if lang == "en" else ("file_uk", "file_en")
    return catalog.get(own) or catalog.get(other)
