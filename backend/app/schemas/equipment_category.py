from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Whose category it is: Carpigiani equipment or IFI / ISA showcases
Brand = Literal["carpigiani", "ifi", "isa"]


class EquipmentCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brand: Brand
    title_uk: str
    title_en: str
    href: str
    # Address of the photo for the browser, e.g. /uploads/categories/abc.webp
    image_url: str
    sort_order: int
    is_visible: bool


class CategoriesOrder(BaseModel):
    """New order: category ids from first to last."""

    ids: list[int] = Field(min_length=1)


class CategoryVisibility(BaseModel):
    is_visible: bool
