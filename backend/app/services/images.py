"""Saving uploaded photos: every photo is shrunk and stored as WebP."""

import os
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError

# Folder with uploaded files. In Docker it is a separate volume, so photos survive restarts.
UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", "uploads"))
# Address under which the browser gets the files
UPLOADS_URL = "/uploads"

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def save_image(file: UploadFile, folder: str, max_width: int = 1200) -> str:
    """Checks the photo, makes it at most max_width wide, saves as WebP.
    Returns the path inside the uploads folder, e.g. "categories/abc.webp"."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Завантажте фото у форматі JPG, PNG або WebP",
        )

    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Фото завелике: максимум 15 МБ",
        )

    try:
        image = Image.open(BytesIO(data))
        # Phones store the turn of the photo separately; apply it so the photo is not sideways
        image = ImageOps.exif_transpose(image)
    except UnidentifiedImageError, OSError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не вдалося прочитати фото",
        ) from None

    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")

    relative = f"{folder}/{uuid.uuid4().hex}.webp"
    target = UPLOADS_DIR / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=82, method=6)
    return relative


def delete_image(relative: str | None) -> None:
    """Removes an old photo file; a missing file is not an error."""
    if not relative:
        return
    path = (UPLOADS_DIR / relative).resolve()
    # Only files inside the uploads folder
    if UPLOADS_DIR.resolve() in path.parents:
        path.unlink(missing_ok=True)


def image_url(relative: str) -> str:
    return f"{UPLOADS_URL}/{relative}"
