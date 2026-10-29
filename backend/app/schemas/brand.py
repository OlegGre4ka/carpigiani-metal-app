from typing import Annotated

from pydantic import BaseModel, Field

from app.schemas.page_blocks import Block


class BrandRead(BaseModel):
    """A brand for the site menus ("Manufacturers", "Equipment catalog") and the admin panel."""

    id: int
    key: str
    title_uk: str
    title_en: str
    # Address of its page on the site: /ifi
    href: str
    # Address of the logo for the browser, or null when it has none
    logo_url: str | None
    sort_order: int
    is_visible: bool


class BrandAdminRead(BrandRead):
    # How many categories it has: a brand with categories cannot be deleted
    categories_count: int
    # Its page shows something (a block, a category card, equipment): until then the site
    # shows the brand nowhere, not even in the menus
    has_content: bool


class BrandsOrder(BaseModel):
    """New order: brand ids from first to last."""

    ids: list[int] = Field(min_length=1)


class BrandVisibility(BaseModel):
    is_visible: bool


# ---------- The page of a brand (/ifi), built in the admin panel ----------


class BrandPageSave(BaseModel):
    """What the admin saves: title, line under it, blocks and the equipment with filters."""

    title_uk: Annotated[str, Field(max_length=200)]
    title_en: Annotated[str, Field(max_length=200)] = ""
    subtitle_uk: Annotated[str, Field(max_length=400)] = ""
    subtitle_en: Annotated[str, Field(max_length=400)] = ""
    blocks: Annotated[list[Block], Field(max_length=60)] = []
    # All equipment of the brand with filter chips at the bottom of the page
    show_equipment: bool = False
    # Categories whose filter chip is switched off
    hidden_chips: Annotated[list[int], Field(max_length=200)] = []


class BrandChip(BaseModel):
    """A filter chip: a category of the brand shown on the site; enabled = the chip is shown."""

    id: int
    title_uk: str
    enabled: bool


class BrandPageAdmin(BrandPageSave):
    brand_id: int
    brand_key: str
    brand_title: str
    href: str
    is_visible: bool
    # False: the page was never saved (it shows only the category cards)
    saved: bool
    # Visible categories of the brand, for the filter switches
    chips: list[BrandChip]


class BrandPagePublic(BaseModel):
    """The page of a brand for the site, in one language: only blocks with something to show."""

    key: str
    title: str
    subtitle: str
    blocks: list[dict]
    show_equipment: bool
