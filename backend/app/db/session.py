import os
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    # The live site asks for many pages at once (link prefetching)
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


# "async" on purpose: the connection is given back right after the answer,
# without waiting for a free worker. With a plain "def", under many requests
# at once the workers and the connections waited for each other and the site hung.
async def get_db() -> AsyncIterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Use in endpoints: `def my_endpoint(db: DbSession): ...`
DbSession = Annotated[Session, Depends(get_db)]
