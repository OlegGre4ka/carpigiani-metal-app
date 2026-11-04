"""Pages of the "Support" menu (4.11): what the admin panel sends and gets."""

from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.schemas.page_blocks import Text200, Text600


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
    # The article shown open on the page (empty: the newest of the topic)
    main_title: str
    # Where its menu item leads: the address of the article shown open (empty: no article yet)
    link: str


class SupportSettings(BaseModel):
    """A page as it is saved: its name in the menu, topic, the article shown open, the
    "contact us" card and whether it is on the site. No address: the menu item leads to the
    address of the article shown open."""

    title_uk: Annotated[str, Field(max_length=200)]
    title_en: Annotated[str, Field(max_length=200)] = ""
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



class SupportAdmin(SupportSettings):
    id: int
    topic_title: str
    topic_href: str
    # Where its menu item leads (the article shown open); empty: no article yet
    link: str


class SupportOrder(BaseModel):
    ids: Annotated[list[int], Field(max_length=50)]
