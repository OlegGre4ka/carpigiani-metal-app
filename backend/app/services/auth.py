"""Passwords, tokens and "who is logged in". Same approach as in AO Studio."""

import os
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy import select

from app.db.session import DbSession
from app.models import User

SECRET_KEY = os.environ.get("JWT_SECRET", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
COOKIE_NAME = "access_token"


# =========================
# PASSWORD
# =========================


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# =========================
# JWT
# =========================


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET is not set in .env")
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =========================
# CURRENT USER (for /me)
# =========================


def get_current_user(request: Request, db: DbSession) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    # Token comes from the httpOnly cookie
    token = request.cookies.get(COOKIE_NAME)
    if not token or not SECRET_KEY:
        raise credentials_exception
    token = token.removeprefix("Bearer ")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exception from None

    email = payload.get("sub")
    if not email:
        raise credentials_exception

    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user
