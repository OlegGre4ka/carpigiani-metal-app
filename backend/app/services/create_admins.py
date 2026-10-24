"""Creates the admin panel users from .env. Runs on every backend start.

An admin that already exists is left as it is (its password is not changed).
Run by hand: `docker compose exec backend python -m app.services.create_admins`
"""

import os

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import User
from app.services.auth import get_password_hash

USERS = [
    {
        "email": os.getenv("OLEH_ADMIN_EMAIL"),
        "password": os.getenv("OLEH_ADMIN_PASSWORD"),
        "role": os.getenv("OLEH_ADMIN_ROLE", "admin"),
    },
    {
        "email": os.getenv("FOFKA_ADMIN_EMAIL"),
        "password": os.getenv("FOFKA_ADMIN_PASSWORD"),
        "role": os.getenv("FOFKA_ADMIN_ROLE", "admin"),
    },
]


def create_users() -> None:
    db = SessionLocal()
    try:
        for user_data in USERS:
            email = (user_data["email"] or "").strip().lower()
            password = user_data["password"]
            if not email or not password:
                continue

            existing_user = db.scalars(select(User).where(User.email == email)).first()
            if existing_user:
                continue

            db.add(
                User(
                    email=email,
                    hashed_password=get_password_hash(password),
                    role=user_data["role"],
                )
            )
            print(f"Admin {email} created")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    create_users()
