from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import DbSession

router = APIRouter(prefix="/api", tags=["health"])


# Health check: the API is running and the database responds.
# Used by servers, load balancers and Docker to know the app is alive.
@router.get("/health")
def health_check(db: DbSession):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "error", "database": "disconnected"},
        )
    return {"status": "ok", "database": "connected"}
