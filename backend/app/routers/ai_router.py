"""AI help in the admin panel (29.10): a table from a picture.

The admin uploads a screenshot or a photo of a table (from a catalog, a PDF, the old site) in the
"Table" block; Google Gemini reads it and gives the cells in Ukrainian and in English. The admin
checks them and saves the page as usual: nothing is saved here.

Needs GEMINI_API_KEY in .env (free key: aistudio.google.com → Get API key). The model can be
changed with GEMINI_MODEL. On the free plan Google may use the pictures to improve its models,
so only public data (technical characteristics) is sent.
"""

import base64
import json
import logging
import os
from typing import Annotated
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.services.auth import get_current_user
from app.services.rate_limit import check_rate_limit, client_ip

router = APIRouter(
    prefix="/api/admin/ai",
    tags=["ai (admin)"],
    dependencies=[Depends(get_current_user)],
)
log = logging.getLogger(__name__)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
PICTURES = {"image/jpeg", "image/png", "image/webp"}
MAX_PICTURE = 8 * 1024 * 1024
# The same limits as the "Table" block (app/schemas/page_blocks.py)
MAX_COLUMNS, MAX_ROWS, MAX_CELL = 12, 80, 300

PROMPT = """This picture shows a table (technical characteristics of equipment for ice cream,
gelato or pastry, or similar). Read it exactly and return it as JSON:
- "header": the column names (the first row of the table). If the table has no header row,
  make short column names yourself (the first one may be empty).
- "rows": every other row, top to bottom, the same number of cells as the header.
Each cell has "uk" (Ukrainian) and "en" (English): translate the words, but keep numbers,
units, model names, brand names and codes exactly as in the picture. An empty cell: "" in both.
Do not add rows or columns that are not in the picture."""

CELL = {
    "type": "OBJECT",
    "properties": {"uk": {"type": "STRING"}, "en": {"type": "STRING"}},
    "required": ["uk", "en"],
}
SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "header": {"type": "ARRAY", "items": CELL},
        "rows": {"type": "ARRAY", "items": {"type": "ARRAY", "items": CELL}},
    },
    "required": ["header", "rows"],
}


def ask_gemini(picture: bytes, mime: str) -> dict:
    """The table read by Gemini: {"header": [...], "rows": [[...]]}."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AI ще не підключено: потрібен GEMINI_API_KEY у файлі .env.",
        )
    model = os.environ.get("GEMINI_MODEL", "").strip() or "gemini-2.5-flash"
    body = {
        "contents": [
            {
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime,
                            "data": base64.b64encode(picture).decode(),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
            "responseSchema": SCHEMA,
        },
    }
    request = UrlRequest(
        GEMINI_URL.format(model=model),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            answer = json.load(response)
    except HTTPError as error:
        log.warning("Gemini answered %s: %s", error.code, error.read()[:500])
        if error.code == 429:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Безкоштовний ліміт AI на зараз вичерпано. Спробуйте за хвилину або завтра.",
            ) from None
        if error.code in (400, 401, 403):
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "AI не прийняв запит: перевірте GEMINI_API_KEY у .env.",
            ) from None
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "AI зараз не відповідає. Спробуйте пізніше."
        ) from None
    except URLError, TimeoutError, ValueError:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "AI зараз не відповідає. Спробуйте пізніше."
        ) from None
    try:
        text = answer["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except KeyError, IndexError, TypeError, ValueError:
        log.warning("Gemini gave no table: %s", str(answer)[:500])
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "AI не знайшов таблицю на картинці. Спробуйте чіткіший скрін.",
        ) from None


def cell(value: object) -> dict:
    """A cell in both languages, within the limits of the block."""
    if not isinstance(value, dict):
        value = {}
    uk = str(value.get("uk") or "").strip()[:MAX_CELL]
    en = str(value.get("en") or "").strip()[:MAX_CELL]
    return {"uk": uk, "en": en}


def tidy(table: dict) -> dict:
    """The same number of cells in every row, no more than the block takes."""
    header = [cell(c) for c in (table.get("header") or [])][:MAX_COLUMNS]
    rows = [
        [cell(c) for c in row][:MAX_COLUMNS]
        for row in (table.get("rows") or [])
        if isinstance(row, list)
    ][:MAX_ROWS]
    columns = max(1, len(header), *(len(r) for r in rows))
    blank = {"uk": "", "en": ""}
    header += [dict(blank) for _ in range(columns - len(header))]
    rows = [r + [dict(blank) for _ in range(columns - len(r))] for r in rows]
    # Rows where every cell is empty are left out
    rows = [r for r in rows if any(c["uk"] or c["en"] for c in r)]
    return {"header": header, "rows": rows}


@router.post("/table")
async def table_from_picture(
    request: Request, picture: Annotated[UploadFile, File()]
) -> dict:
    """Header and rows of the table on the picture, for the "Table" block."""
    check_rate_limit(f"ai-table:{client_ip(request)}", limit=30, window_seconds=60 * 60)
    if picture.content_type not in PICTURES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Потрібна картинка: JPG, PNG або WebP."
        )
    data = await picture.read(MAX_PICTURE + 1)
    if len(data) > MAX_PICTURE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Картинка завелика: до 8 МБ.")
    # Gemini takes a few seconds: the server keeps answering others meanwhile
    table = tidy(await run_in_threadpool(ask_gemini, data, picture.content_type))
    if not table["rows"]:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "AI не знайшов таблицю на картинці. Спробуйте чіткіший скрін.",
        )
    return table
