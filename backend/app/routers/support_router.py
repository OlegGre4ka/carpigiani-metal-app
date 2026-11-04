"""Pages of the "Support" menu (4.11): Carpigiani Gelato University, Technologies and any other
the client adds. Each is built from blocks; a topic of news can be tied to it — its news go at
the bottom of the page and into the menu of articles on the right, next to a "contact us" card
with its own title and text. The pages are the items of the "Support" menu, in their order.

Public: the menu and the page itself (asked through /api/pages by its address, pages_router).
Admin (login required): the list (add, show/hide, order, delete) and the page in the builder.
"""

from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select

from app.db.session import DbSession
from app.models import News, NewsTopic, SupportPage
from app.routers.news_router import (
    check_href_free,
    check_topic,
    newest_first,
    news_card,
)
from app.routers.pages_router import (
    blocks_adapter,
    blocks_for_site,
    check_kinds,
    delete_page_images,
    page_images,
    upload,
)
from app.schemas.news import Visibility
from app.schemas.page_blocks import Lang, pick
from app.schemas.pages import PublicPage
from app.schemas.support import (
    SupportCreate,
    SupportListItem,
    SupportOrder,
    SupportPageAdmin,
    SupportSave,
)
from app.services.auth import get_current_user

public_router = APIRouter(prefix="/api/pages", tags=["support"])
admin_router = APIRouter(
    prefix="/api/admin/support",
    tags=["support (admin)"],
    dependencies=[Depends(get_current_user)],
)

# Blocks a support page may not have (they belong to the catalog)
SUPPORT_FORBIDDEN_BLOCKS = {"subcategory", "categories", "catalogs", "photo"}
# Articles of the topic on the page (newest first)
MAX_ARTICLES = 60


def support_images(page: SupportPage) -> set[str]:
    """The photos of the page: of its blocks and the main one."""
    found = page_images(page.blocks)
    if page.image:
        found.add(page.image)
    return found


def ordered(db: DbSession, only_visible: bool = False) -> list[SupportPage]:
    statement = select(SupportPage).order_by(SupportPage.sort_order, SupportPage.id)
    if only_visible:
        statement = statement.where(SupportPage.is_visible.is_(True))
    return list(db.scalars(statement))


# ---------- The site ----------


@public_router.get("/support-menu")
def support_menu(db: DbSession, lang: Lang = "uk") -> list[dict]:
    """The items of the "Support" menu: the visible pages in their order."""
    return [
        {"title": pick({"uk": p.title_uk, "en": p.title_en}, lang), "href": p.href}
        for p in ordered(db, only_visible=True)
    ]


def support_page_for_site(db: DbSession, href: str, lang: Lang) -> PublicPage | None:
    """The support page with this address, if it is shown on the site."""
    page = db.scalar(
        select(SupportPage).where(
            SupportPage.href == href, SupportPage.is_visible.is_(True)
        )
    )
    if page is None:
        return None
    topic = db.get(NewsTopic, page.topic_id) if page.topic_id else None
    articles: list[dict] = []
    if topic is not None:
        news = db.scalars(
            select(News)
            .where(News.topic_id == topic.id, News.is_visible.is_(True))
            .order_by(*newest_first)
            .limit(MAX_ARTICLES)
        )
        # The topic label is not shown on cards of its own page
        articles = [news_card(item, {}, lang) for item in news]
    return PublicPage(
        kind="support",
        title=pick({"uk": page.title_uk, "en": page.title_en}, lang),
        blocks=blocks_for_site(page.blocks, lang, db),
        image=page.image,
        topic_title=pick({"uk": topic.title_uk, "en": topic.title_en}, lang)
        if topic
        else "",
        topic_href=topic.href if topic and topic.is_visible else "",
        contact_title=pick(
            {"uk": page.contact_title_uk, "en": page.contact_title_en}, lang
        ),
        contact_text=pick(
            {"uk": page.contact_text_uk, "en": page.contact_text_en}, lang
        ),
        articles=articles,
    )


# ---------- Admin ----------


def get_page(db: DbSession, page_id: int) -> SupportPage:
    page = db.get(SupportPage, page_id)
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сторінку не знайдено")
    return page


def topic_of(db: DbSession, page: SupportPage) -> NewsTopic | None:
    return db.get(NewsTopic, page.topic_id) if page.topic_id else None


def list_item(db: DbSession, page: SupportPage) -> SupportListItem:
    topic = topic_of(db, page)
    return SupportListItem(
        id=page.id,
        title_uk=page.title_uk,
        title_en=page.title_en,
        href=page.href,
        is_visible=page.is_visible,
        topic_title=topic.title_uk if topic else "",
    )


def page_admin(db: DbSession, page: SupportPage) -> SupportPageAdmin:
    topic = topic_of(db, page)
    return SupportPageAdmin(
        id=page.id,
        title_uk=page.title_uk,
        title_en=page.title_en,
        blocks=page.blocks,
        href=page.href,
        topic_id=page.topic_id,
        is_visible=page.is_visible,
        contact_title={"uk": page.contact_title_uk, "en": page.contact_title_en},
        contact_text={"uk": page.contact_text_uk, "en": page.contact_text_en},
        image=page.image,
        topic_title=topic.title_uk if topic else "",
        topic_href=topic.href if topic else "",
    )


@admin_router.get("", response_model=list[SupportListItem])
def list_pages(db: DbSession):
    return [list_item(db, page) for page in ordered(db)]


@admin_router.post(
    "", response_model=SupportListItem, status_code=status.HTTP_201_CREATED
)
def create_page(data: SupportCreate, db: DbSession):
    check_href_free(db, data.href)
    last = max((p.sort_order for p in ordered(db)), default=-1)
    page = SupportPage(
        title_uk=data.title_uk,
        title_en="",
        href=data.href,
        sort_order=last + 1,
        # Hidden until it is filled
        is_visible=False,
        blocks=[],
        contact_title_uk="Маєте запитання?",
        contact_title_en="Any questions?",
        contact_text_uk="Зв'яжіться з нами — відповімо й підберемо обладнання під ваше завдання",
        contact_text_en="Contact us — we will answer and choose the equipment for your task",
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return list_item(db, page)


@admin_router.patch("/{page_id}/visibility", response_model=SupportListItem)
def set_visibility(page_id: int, data: Visibility, db: DbSession):
    page = get_page(db, page_id)
    page.is_visible = data.is_visible
    db.commit()
    db.refresh(page)
    return list_item(db, page)


@admin_router.put("/order", response_model=list[SupportListItem])
def set_order(data: SupportOrder, db: DbSession):
    pages = {p.id: p for p in ordered(db)}
    if set(data.ids) != set(pages):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Список сторінок змінився. Оновіть сторінку."
        )
    for index, page_id in enumerate(data.ids):
        pages[page_id].sort_order = index
    db.commit()
    return list_pages(db)


@admin_router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: DbSession):
    """The page goes; its topic and the news of the topic stay in "News"."""
    page = get_page(db, page_id)
    images = support_images(page)
    db.delete(page)
    db.commit()
    delete_page_images(images)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.get("/{page_id}/page", response_model=SupportPageAdmin)
def read_page(page_id: int, db: DbSession):
    return page_admin(db, get_page(db, page_id))


@admin_router.put("/{page_id}/page", response_model=SupportPageAdmin)
def save_page(page_id: int, data: SupportSave, db: DbSession):
    page = get_page(db, page_id)
    blocks = blocks_adapter.dump_python(data.blocks, mode="json")
    check_kinds(blocks, SUPPORT_FORBIDDEN_BLOCKS, "сторінки підтримки")
    check_topic(db, data.topic_id)
    check_href_free(db, data.href, current=page.href)
    old_images = support_images(page)

    page.title_uk = data.title_uk
    page.title_en = data.title_en
    page.blocks = blocks
    page.href = data.href
    page.topic_id = data.topic_id
    page.is_visible = data.is_visible
    page.image = data.image
    page.contact_title_uk = data.contact_title.uk.strip()
    page.contact_title_en = data.contact_title.en.strip()
    page.contact_text_uk = data.contact_text.uk.strip()
    page.contact_text_en = data.contact_text.en.strip()
    db.commit()
    db.refresh(page)
    delete_page_images(old_images - support_images(page))
    return page_admin(db, page)


@admin_router.post("/{page_id}/page/images", status_code=status.HTTP_201_CREATED)
def upload_image(page_id: int, db: DbSession, image: Annotated[UploadFile, File()]):
    """A photo for a block of the page. It is kept when the page is saved."""
    get_page(db, page_id)
    return upload(image)
