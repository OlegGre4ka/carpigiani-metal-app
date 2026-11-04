"""Pages of the "Support" menu (4.11): what the admin panel sends and gets."""

from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.schemas.news import need_href
from app.schemas.page_blocks import Text200, Text600, check_image
from app.schemas.pages import PageSave


class SupportCreate(BaseModel):
    """A new page: the rest is filled in the builder."""

    title_uk: Annotated[str, Field(max_length=200)]
    href: Annotated[str, Field(max_length=300)]

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву сторінки")
        return value

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return need_href(value)


class SupportListItem(BaseModel):
    id: int
    title_uk: str
    title_en: str
    href: str
    is_visible: bool
    topic_title: str


class SupportSave(PageSave):
    """The page as it is saved from the builder: title, blocks and its settings."""

    href: Annotated[str, Field(max_length=300)]
    topic_id: int | None = None
    is_visible: bool = True
    contact_title: Text200 = Text200()
    contact_text: Text600 = Text600()
    # The main photo at the top of the page
    image: str | None = None

    @field_validator("image")
    @classmethod
    def _check_image(cls, value: str | None) -> str | None:
        return check_image(value) if value else None

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return need_href(value)


class SupportPageAdmin(SupportSave):
    id: int
    topic_title: str
    topic_href: str
    # Always True: a page exists only once created (the builder shares its form with others)
    saved: bool = True


class SupportOrder(BaseModel):
    ids: Annotated[list[int], Field(max_length=50)]
