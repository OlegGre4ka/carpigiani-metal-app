"""Saving uploaded PDF catalogs (the "Catalogs" block of equipment pages).

The file is kept as it is (no changes), under a name that starts with a random code, so two
catalogs with the same name do not clash, e.g. "files/3f9a2c1b-Maestro-HCD-2017-EN.pdf".
The site shows the original name and offers it when the file is downloaded.
Files are removed with delete_image (it removes any file inside the uploads folder).
"""

import re
import uuid
from pathlib import PurePath

from fastapi import HTTPException, UploadFile, status

from app.services.images import UPLOADS_DIR

# The biggest catalogs of the old site are about 8 MB; 20 MB leaves room
MAX_PDF_BYTES = 20 * 1024 * 1024

SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def display_name(filename: str | None) -> str:
    """The name of the file as the person saw it on their computer, e.g. "Maestro-HCD.pdf"."""
    name = PurePath((filename or "").replace("\\", "/")).name.strip() or "catalog.pdf"
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name[-160:]


def save_pdf(file: UploadFile, folder: str = "files") -> tuple[str, str, int]:
    """Checks that it is a PDF of at most 20 MB and saves it.
    Returns (path inside the uploads folder, original name, size in bytes)."""
    data = file.file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл завеликий: максимум 20 МБ",
        )
    # A PDF always starts with "%PDF" (the type the browser reports is not enough)
    if not data.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Завантажте каталог у форматі PDF",
        )

    name = display_name(file.filename)
    # Only safe letters in the name of the file on the server (Cyrillic etc. become "-")
    stem = SAFE_NAME.sub("-", name[:-4]).strip("-.")[:80] or "catalog"
    relative = f"{folder}/{uuid.uuid4().hex[:8]}-{stem}.pdf"
    target = UPLOADS_DIR / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return relative, name, len(data)
