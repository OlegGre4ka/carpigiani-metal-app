"""Saving uploaded photos: every photo is shrunk and stored as WebP."""

import os
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageDraw, ImageFilter, ImageOps, UnidentifiedImageError

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


_cutouts: dict[tuple[str, float], str] = {}


def cutout_kind(url: str | None) -> str:
    """How an uploaded photo of a machine stands (29.10), so the site can let the machine come
    out of its card: "clear" — cut out on a transparent background; "white" — on a plain white
    background (the white melts into the light card); "" — a photo with its own background.
    Remembered per file (and its change time), so each file is opened once."""
    if not url or not url.startswith(f"{UPLOADS_URL}/"):
        return ""
    path = UPLOADS_DIR / url.removeprefix(f"{UPLOADS_URL}/")
    try:
        key = (str(path), path.stat().st_mtime)
    except OSError:
        return ""
    if key not in _cutouts:
        try:
            with Image.open(path) as image:
                small = image.convert("RGBA").resize((48, 48))
            px = small.load()
            pixels = [px[x, y] for y in range(48) for x in range(48)]
            clear = sum(1 for p in pixels if p[3] < 24)
            # the four corners of the picture are all but white (the machine itself may touch
            # the edges in the middle)
            edge = [
                px[x, y]
                for cx, cy in ((0, 0), (42, 0), (0, 42), (42, 42))
                for y in range(cy, cy + 6)
                for x in range(cx, cx + 6)
            ]
            white = sum(1 for r, g, b, a in edge if a > 200 and min(r, g, b) > 236)
            if clear / len(pixels) > 0.02:
                _cutouts[key] = "clear"
            elif white / len(edge) > 0.9:
                _cutouts[key] = "white"
            else:
                _cutouts[key] = ""
        except OSError, UnidentifiedImageError:
            _cutouts[key] = ""
    return _cutouts[key]


def cut_out_white(url: str) -> str | None:
    """A copy of a photo on plain white with the white around the machine made see-through
    (29.10), so the machine can come out of its card. The white is taken away only where it
    touches the edges of the picture (so white parts of the machine stay). Made once and kept
    next to the uploads ("cutouts/…"); returns its address, or None."""
    if not url.startswith(f"{UPLOADS_URL}/"):
        return None
    source = UPLOADS_DIR / url.removeprefix(f"{UPLOADS_URL}/")
    try:
        stamp = int(source.stat().st_mtime)
    except OSError:
        return None
    relative = f"cutouts/{source.stem}-{stamp}.webp"
    target = UPLOADS_DIR / relative
    if not target.exists():
        try:
            with Image.open(source) as image:
                rgb = image.convert("RGB")
            marked = rgb.copy()
            width, height = marked.size
            mark = (255, 0, 255)
            starts = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
            starts += [(width // 2, 0), (0, height // 2), (width - 1, height // 2)]
            for point in starts:
                if min(marked.getpixel(point)) > 236:
                    ImageDraw.floodfill(marked, point, mark, thresh=22)
            alpha = Image.new("L", marked.size, 255)
            alpha.putdata([0 if p == mark else 255 for p in marked.getdata()])
            # soft edge
            alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(
                ImageFilter.GaussianBlur(0.8)
            )
            result = rgb.convert("RGBA")
            result.putalpha(alpha)
            target.parent.mkdir(parents=True, exist_ok=True)
            result.save(target, "WEBP", quality=88, method=6)
        except OSError, UnidentifiedImageError:
            return None
    return image_url(relative)
