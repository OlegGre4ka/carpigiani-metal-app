"""Requests from the contact form in the admin panel ("Заявки"): the list, newest first,
"read" / "new", delete. The same text as goes by email (app/routers/contact_router.py)."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.db.session import DbSession
from app.models import ContactRequest
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/api/admin/requests",
    tags=["requests (admin)"],
    dependencies=[Depends(get_current_user)],
)


class Read(BaseModel):
    is_read: bool


def to_dict(r: ContactRequest) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "email": r.email,
        "phone": r.phone,
        "message": r.message,
        "subject": r.subject,
        "page": r.page,
        "lang": r.lang,
        "is_read": r.is_read,
        "created_at": r.created_at.isoformat(),
    }


def get_request(db: DbSession, request_id: int) -> ContactRequest:
    found = db.get(ContactRequest, request_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заявку не знайдено")
    return found


@router.get("")
def list_requests(db: DbSession) -> dict:
    items = db.scalars(
        select(ContactRequest).order_by(
            ContactRequest.created_at.desc(), ContactRequest.id.desc()
        )
    )
    new = db.scalar(select(func.count()).where(ContactRequest.is_read.is_(False)))
    return {"items": [to_dict(r) for r in items], "new": new or 0}


@router.patch("/{request_id}")
def set_read(request_id: int, data: Read, db: DbSession) -> dict:
    found = get_request(db, request_id)
    found.is_read = data.is_read
    db.commit()
    db.refresh(found)
    return to_dict(found)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: int, db: DbSession):
    db.delete(get_request(db, request_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
