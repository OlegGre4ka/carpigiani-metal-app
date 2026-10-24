"""News and their topics: what the admin panel sends and gets."""

from datetime import date
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.schemas.page_blocks import Text600, check_image
from app.schemas.pages import PageSave, clean_page_href


def need_href(value: str) -> str:
    value = clean_page_href(value)
    if not value:
        raise ValueError("Вкажіть адресу сторінки, наприклад /210500-hlbny")
    return value


# ---------- Topics ----------


class NewsTopicSave(BaseModel):
    title_uk: Annotated[str, Field(max_length=120)]
    title_en: Annotated[str, Field(max_length=120)] = ""
    href: Annotated[str, Field(max_length=300)]
    is_visible: bool = True

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву теми українською")
        return value

    @field_validator("title_en")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return need_href(value)


class NewsTopicRead(NewsTopicSave):
    id: int
    sort_order: int
    # How many news the topic has, and how many of them are shown on the site
    news_count: int = 0
    visible_count: int = 0


class TopicsOrder(BaseModel):
    """New order: topic ids from first to last."""

    ids: list[int] = Field(min_length=1)


class Visibility(BaseModel):
    is_visible: bool


# ---------- News ----------


class NewsCreate(BaseModel):
    """A new news item: the rest is filled on its page in the builder."""

    title_uk: Annotated[str, Field(max_length=200)]
    href: Annotated[str, Field(max_length=300)]
    published_on: date
    topic_id: int | None = None

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть заголовок новини")
        return value

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return need_href(value)


class NewsListItem(BaseModel):
    id: int
    title_uk: str
    title_en: str
    href: str
    published_on: date
    topic_id: int | None
    topic_title: str
    image: str | None
    is_visible: bool


class NewsSave(PageSave):
    """The news page as it is saved from the builder: the blocks and the fields of its card."""

    href: Annotated[str, Field(max_length=300)]
    published_on: date
    topic_id: int | None = None
    image: str | None = None
    summary: Text600 = Text600()
    is_visible: bool = False

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return need_href(value)

    @field_validator("image")
    @classmethod
    def _check_image(cls, value: str | None) -> str | None:
        return check_image(value) if value else None

    @field_validator("summary")
    @classmethod
    def _strip_summary(cls, value: Text600) -> Text600:
        return Text600(uk=value.uk.strip(), en=value.en.strip())


class NewsPageAdmin(NewsSave):
    id: int
    topic_title: str
    # Always True: a news item exists only once created (the builder shares its form with pages
    # that may not be saved yet)
    saved: bool = True
