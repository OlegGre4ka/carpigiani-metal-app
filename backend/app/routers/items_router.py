from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.db.session import DbSession
from app.models import Item
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter(prefix="/api/items", tags=["items"])


@router.post(
    "",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    item_data: ItemCreate,
    db: DbSession,
):
    item = Item(name=item_data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[ItemRead])
def list_items(db: DbSession):
    statement = select(Item).order_by(Item.id)
    return db.scalars(statement).all()


@router.get("/{item_id}", response_model=ItemRead)
def get_item(
    item_id: int,
    db: DbSession,
):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    return item


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: DbSession,
):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    item.name = item_data.name
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_item(
    item_id: int,
    db: DbSession,
):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
