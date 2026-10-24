import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers.auth_router import router as auth_router
from app.routers.contact_router import router as contact_router
from app.routers.equipment_categories_router import (
    admin_router as categories_admin_router,
)
from app.routers.equipment_categories_router import (
    public_router as categories_public_router,
)
from app.routers.health_router import router as health_router
from app.routers.items_router import router as items_router
from app.routers.news_router import admin_router as news_admin_router
from app.routers.news_router import public_router as news_public_router
from app.routers.pages_router import admin_router as pages_admin_router
from app.routers.pages_router import public_router as pages_public_router
from app.routers.requests_router import router as requests_router
from app.routers.settings_router import admin_router as settings_admin_router
from app.routers.settings_router import public_router as settings_public_router
from app.services.images import UPLOADS_DIR, UPLOADS_URL

app = FastAPI(title="Carpigiani API")

# Frontend addresses allowed to call this API, comma-separated.
# Set CORS_ORIGINS in .env (e.g. https://your-domain.com for production).
cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(items_router)
app.include_router(categories_public_router)
app.include_router(categories_admin_router)
app.include_router(news_public_router)
app.include_router(pages_public_router)
app.include_router(pages_admin_router)
app.include_router(news_admin_router)
app.include_router(contact_router)
app.include_router(settings_public_router)
app.include_router(settings_admin_router)
app.include_router(requests_router)

# Uploaded photos (categories, equipment, news)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount(UPLOADS_URL, StaticFiles(directory=UPLOADS_DIR), name="uploads")
