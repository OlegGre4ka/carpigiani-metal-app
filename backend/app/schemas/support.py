"""Pages of the "Support" menu (4.11): what the admin panel sends and gets."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.page_blocks import Text200, Text600
from app.schemas.pages import clean_page_href


class SupportCreate(BaseModel):
    """A new page: its name in the menu; the rest is filled on its page in the admin panel."""

    title_uk: Annotated[str, Field(max_length=200)]

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву сторінки")
        return value


class SupportListItem(BaseModel):
    id: int
    title_uk: str
    title_en: str
    is_visible: bool
    topic_title: str
    layout: str
    # The article shown open, or as the preview of a list (empty: the newest of the topic)
    main_title: str
    # Where its menu item leads: the address of the article shown open, or of the list
    # (empty: no article yet)
    link: str


class SupportSettings(BaseModel):
    """A page as it is saved: its name in the menu, how it shows the articles (5.11), topic,
    the article shown open (or as the preview of a list), the "contact us" card and whether it
    is on the site. Address: only a list has one; the menu item of "article" leads to the
    address of the article shown open."""

    title_uk: Annotated[str, Field(max_length=200)]
    title_en: Annotated[str, Field(max_length=200)] = ""
    layout: Literal["article", "list"] = "article"
    href: Annotated[str, Field(max_length=300)] = ""
    topic_id: int | None = None
    main_news_id: int | None = None
    is_visible: bool = True
    contact_title: Text200 = Text200()
    contact_text: Text600 = Text600()

    @field_validator("title_uk")
    @classmethod
    def _need_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Вкажіть назву сторінки українською")
        return value

    @field_validator("title_en")
    @classmethod
    def _trim(cls, value: str) -> str:
        return value.strip()

    @field_validator("href")
    @classmethod
    def _check_href(cls, value: str) -> str:
        return clean_page_href(value)


class SupportAdmin(SupportSettings):
    id: int
    topic_title: str
    topic_href: str
    # Where its menu item leads (the article shown open); empty: no article yet
    link: str


class SupportOrder(BaseModel):
    ids: Annotated[list[int], Field(max_length=50)]
