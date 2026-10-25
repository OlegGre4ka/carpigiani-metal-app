import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy import delete, select

from app.db.session import DbSession
from app.models import PasswordResetToken, User
from app.schemas.auth import ForgotPassword, ResetPassword, UserLogin, UserRead
from app.services.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    COOKIE_NAME,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.services.mailer import send_email
from app.services.rate_limit import check_rate_limit, client_ip, reset_rate_limit

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Address of the site, used for the link in the "forgot password" email
SITE_URL = os.environ.get("SITE_URL", "http://localhost:3010").rstrip("/")
ADMIN_PATH = "/fofkas-adminpanel"
RESET_TOKEN_LIFETIME = timedelta(hours=1)
# Secure cookies need https, so they are turned on only on the live site
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

# Used when the email is unknown, so a wrong email takes as long as a wrong password
_DUMMY_HASH = get_password_hash(secrets.token_urlsafe(16))

CurrentUser = Annotated[User, Depends(get_current_user)]


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _find_valid_token(db: DbSession, token: str) -> PasswordResetToken | None:
    record = db.scalars(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == _hash_token(token)
        )
    ).first()
    if (
        record is None
        or record.used_at is not None
        or record.expires_at < datetime.now(UTC)
    ):
        return None
    return record


@router.post("/login", response_model=UserRead)
def login(user_data: UserLogin, request: Request, response: Response, db: DbSession):
    email = user_data.email.lower()
    ip = client_ip(request)
    check_rate_limit(f"login-ip:{ip}", limit=20, window_seconds=15 * 60)
    check_rate_limit(f"login-email:{email}", limit=10, window_seconds=15 * 60)

    # 1. Find the user
    user = db.scalars(select(User).where(User.email == email)).first()

    # 2. Check the password (the same work is done for an unknown email)
    password_ok = verify_password(
        user_data.password, user.hashed_password if user else _DUMMY_HASH
    )
    if not user or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    reset_rate_limit(f"login-email:{email}")

    # 3. Create the token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    # 4. Put the token into a safe httpOnly cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )
    return UserRead(email=user.email, role=user.role)


@router.get("/me", response_model=UserRead)
def get_me(current_user: CurrentUser):
    return UserRead(email=current_user.email, role=current_user.role)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME, httponly=True, samesite="lax", secure=COOKIE_SECURE, path="/"
    )
    return {"message_en": "Logout success!", "message_ua": "Вихід успішний"}


def _send_reset_email(to: str, link: str) -> None:
    text = (
        "Ви запросили новий пароль для адмін-панелі сайту Carpigiani.\n\n"
        f"Щоб створити новий пароль, перейдіть за посиланням (діє 1 годину):\n{link}\n\n"
        "Якщо ви не робили цього запиту, просто проігноруйте лист. Пароль не зміниться."
    )
    html = f"""\
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#4A3426">
  <h2 style="font-family:Georgia,serif;color:#7A5232">Новий пароль</h2>
  <p>Ви запросили новий пароль для адмін-панелі сайту Carpigiani.</p>
  <p><a href="{link}" style="display:inline-block;padding:14px 28px;border-radius:999px;
     background:#7A5232;color:#fff;text-decoration:none;font-weight:bold">Створити новий пароль</a></p>
  <p style="color:#6B5848;font-size:14px">Посилання діє 1 годину. Якщо ви не робили цього запиту,
     просто проігноруйте лист. Пароль не зміниться.</p>
</div>"""
    send_email(to, "Новий пароль для адмін-панелі Carpigiani", text, html)


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPassword, request: Request, background: BackgroundTasks, db: DbSession
):
    email = data.email.lower()
    check_rate_limit(f"forgot-ip:{client_ip(request)}", limit=5, window_seconds=15 * 60)
    check_rate_limit(f"forgot-email:{email}", limit=3, window_seconds=60 * 60)

    user = db.scalars(select(User).where(User.email == email)).first()
    if user is not None:
        # Old unused links stop working, only the newest one is valid
        db.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        )
        token = secrets.token_urlsafe(32)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=_hash_token(token),
                expires_at=datetime.now(UTC) + RESET_TOKEN_LIFETIME,
            )
        )
        db.commit()
        background.add_task(
            _send_reset_email,
            user.email,
            f"{SITE_URL}{ADMIN_PATH}/reset-password?token={token}",
        )

    # The same answer for any email, so nobody can find out which emails exist
    return {"message_ua": "Якщо така пошта є, ми надіслали на неї лист."}


@router.get("/reset-password/check")
def check_reset_token(token: str, db: DbSession):
    return {"valid": _find_valid_token(db, token) is not None}


@router.post("/reset-password")
def reset_password(data: ResetPassword, request: Request, db: DbSession):
    check_rate_limit(f"reset-ip:{client_ip(request)}", limit=10, window_seconds=15 * 60)

    record = _find_valid_token(db, data.token)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Link is invalid or expired"
        )

    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Link is invalid or expired"
        )

    user.hashed_password = get_password_hash(data.password)
    record.used_at = datetime.now(UTC)
    db.commit()
    return {"message_ua": "Пароль змінено"}
