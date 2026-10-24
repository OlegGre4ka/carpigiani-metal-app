"""News and their topics.

A topic is like a folder: a name and the address of its page (/news/content/5-interesting, as
on the old site). A news item has a card (photo, topic, date, title, short text) and a page
built in the same page builder as category and equipment pages.

Public: the list of news (all or of one topic, part by part), the topics for the menu, the map
of topics for news pages, and the page of a news item / of a topic (through GET /api/pages, see
pages_router.get_public_page).
Admin (login required): topics (add, edit, hide, order, delete) and news (add, edit the page,
hide, delete).
"""

import re
from html import unescape
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from pydantic import TypeAdapter
from sqlalchemy import and_, func, or_, select

from app.db.session import DbSession
from app.models import News, NewsTopic
from app.routers.pages_router import (
    blocks_for_site,
    check_kinds,
    delete_page_images,
    href_owner,
    page_images,
    upload,
)
from app.schemas.news import (
    NewsCreate,
    NewsListItem,
    NewsPageAdmin,
    NewsSave,
    NewsTopicRead,
    NewsTopicSave,
    TopicsOrder,
    Visibility,
)
from app.schemas.page_blocks import Block, Lang, pick
from app.schemas.pages import PublicPage
from app.services.auth import get_current_user

public_router = APIRouter(prefix="/api/pages", tags=["news"])
admin_router = APIRouter(
    prefix="/api/admin",
    tags=["news (admin)"],
    dependencies=[Depends(get_current_user)],
)

blocks_adapter = TypeAdapter(list[Block])

# A news page has text, photos (gallery or slider) and video; nothing about equipment
NEWS_FORBIDDEN_BLOCKS = {"features", "table", "subcategory", "photo", "catalogs"}
# News shown at once on the list; "Show more" adds as many
PER_PAGE = 12
# How many newest news of each topic the map of a news page lists
MAP_COUNT = 4

newest_first = (News.published_on.desc(), News.id.desc())


def get_topic(db: DbSession, topic_id: int) -> NewsTopic:
    topic = db.get(NewsTopic, topic_id)
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Тему не знайдено")
    return topic


def get_news(db: DbSession, news_id: int) -> News:
    news = db.get(News, news_id)
    if news is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Новину не знайдено")
    return news


def check_href_free(db: DbSession, href: str, current: str | None = None) -> None:
    """A page of the site belongs to one category, piece of equipment, topic or news item."""
    if href == current:
        return
    owner = href_owner(db, href)
    if owner:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Адреса {href} уже зайнята: {owner}. Вкажіть іншу.",
        )


def news_images(news: News) -> set[str]:
    """Photos of the news: the main one and the ones in its blocks."""
    found = page_images(news.blocks)
    if news.image:
        found.add(news.image)
    return found


# ---------- What the site shows ----------


def visible_topics(db: DbSession) -> dict[int, NewsTopic]:
    """Topics turned on, in their order (a hidden topic is not shown on news)."""
    return {
        topic.id: topic
        for topic in db.scalars(
            select(NewsTopic)
            .where(NewsTopic.is_visible.is_(True))
            .order_by(NewsTopic.sort_order, NewsTopic.id)
        )
    }


def shown_topics(db: DbSession) -> list[NewsTopic]:
    """Topics on the site (menu, chips, map): turned on and with at least one news item on the
    site."""
    with_news = select(News.topic_id).where(News.is_visible.is_(True)).distinct()
    return list(
        db.scalars(
            select(NewsTopic)
            .where(NewsTopic.is_visible.is_(True), NewsTopic.id.in_(with_news))
            .order_by(NewsTopic.sort_order, NewsTopic.id)
        )
    )


def topic_link(topic: NewsTopic, lang: Lang, topics: dict[int, NewsTopic]) -> dict:
    """A topic for the site. tone: its place among the topics, the site colours its label by it
    (mint, sand, blue...), so a topic has the same colour everywhere."""
    return {
        "title": pick({"uk": topic.title_uk, "en": topic.title_en}, lang),
        "href": topic.href,
        "tone": list(topics).index(topic.id) if topic.id in topics else 0,
    }


TAG = re.compile(r"<[^>]+>")
# Enough for the 3 lines of the big card; the card itself cuts the text with "…"
SUMMARY_FROM_TEXT = 320


def summary_of(news: News, lang: Lang) -> str:
    """The short text of the card. Not written yet: the beginning of the news itself (its first
    text block), so every card has a few lines that make one want to read on."""
    summary = pick({"uk": news.summary_uk, "en": news.summary_en}, lang).strip()
    if summary:
        return summary
    for block in news.blocks:
        if block.get("type") != "text" or not block.get("visible", True):
            continue
        html = pick(block.get("html", {}), lang)
        # Paragraphs and headings are separated by a space, not glued together
        text = " ".join(unescape(TAG.sub(" ", html)).split())
        if text:
            if len(text) <= SUMMARY_FROM_TEXT:
                return text
            return text[:SUMMARY_FROM_TEXT].rsplit(" ", 1)[0].rstrip(" .,;:—–-") + "…"
    return ""


def news_card(news: News, topics: dict[int, NewsTopic], lang: Lang) -> dict:
    """A news card for the site. The topic is left out when it is hidden."""
    topic = topics.get(news.topic_id) if news.topic_id else None
    return {
        "id": news.id,
        "href": news.href,
        "title": pick({"uk": news.title_uk, "en": news.title_en}, lang),
        "date": news.published_on.isoformat(),
        "image": news.image,
        "summary": summary_of(news, lang),
        "topic": topic_link(topic, lang, topics) if topic else None,
    }


@public_router.get("/news")
def list_news_for_site(
    db: DbSession,
    lang: Lang = "uk",
    topic: Annotated[str | None, Query(max_length=300)] = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=24)] = PER_PAGE,
) -> dict:
    """News on the site, newest first: all of them or of one topic (its address), `limit` news
    from `offset` ("Show more" asks for the next ones). Also the topics for the chips and, for a
    topic, its name; total: how many news there are in all."""
    topics = visible_topics(db)
    statement = select(News).where(News.is_visible.is_(True))
    chosen = None
    if topic:
        chosen = next((t for t in topics.values() if t.href == topic), None)
        if chosen is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Тему не знайдено")
        statement = statement.where(News.topic_id == chosen.id)

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = db.scalars(statement.order_by(*newest_first).offset(offset).limit(limit))
    return {
        "topics": [topic_link(t, lang, topics) for t in shown_topics(db)],
        "topic": topic_link(chosen, lang, topics) if chosen else None,
        "items": [news_card(n, topics, lang) for n in items],
        "offset": offset,
        "total": total,
    }


@public_router.get("/news-menu")
def news_menu(db: DbSession, lang: Lang = "uk") -> dict:
    """For the "News" menu of the site: its topics, and the addresses of all news and topics
    on the site (on them the "News" item is lit)."""
    topics = visible_topics(db)
    shown = shown_topics(db)
    news = db.scalars(select(News.href).where(News.is_visible.is_(True)))
    return {
        "topics": [topic_link(t, lang, topics) for t in shown],
        "pages": [*news, *(t.href for t in shown)],
    }


@public_router.get("/news-map")
def news_map(
    db: DbSession,
    lang: Lang = "uk",
    current: Annotated[str, Query(max_length=300)] = "",
) -> list[dict]:
    """The "map" of the right column of a news page ("News by topic"), in the same shape as the
    map of equipment: the topics on the site, each with its number of news, its newest news and
    a link to the whole topic. The news that is open (current) is always in the list of its topic."""
    topics = visible_topics(db)
    result = []
    for topic in shown_topics(db):
        of_topic = select(News).where(
            News.is_visible.is_(True), News.topic_id == topic.id
        )
        count = db.scalar(select(func.count()).select_from(of_topic.subquery())) or 0
        newest = list(db.scalars(of_topic.order_by(*newest_first).limit(MAP_COUNT)))
        if current and all(n.href != current for n in newest):
            here = db.scalar(of_topic.where(News.href == current))
            if here is not None:
                newest = [*newest[: MAP_COUNT - 1], here]
        link = topic_link(topic, lang, topics)
        result.append(
            {
                "title": link["title"],
                "href": topic.href,
                "count": count,
                "groups": [
                    {
                        "title": "",
                        "items": [
                            {
                                "title": pick(
                                    {"uk": n.title_uk, "en": n.title_en}, lang
                                ),
                                "href": n.href,
                            }
                            for n in newest
                        ],
                    }
                ],
                # "All in the topic (9) →" when the topic has more news than are listed
                "more": {"href": topic.href, "count": count}
                if count > len(newest)
                else None,
            }
        )
    return result


def news_page_for_site(db: DbSession, href: str, lang: Lang) -> PublicPage | None:
    """The page of a news item or of a news topic with this address, if it is on the site."""
    topics = visible_topics(db)
    topic = next((t for t in topics.values() if t.href == href), None)
    if topic is not None:
        link = topic_link(topic, lang, topics)
        return PublicPage(
            kind="news_topic",
            title=link["title"],
            topic_title=link["title"],
            topic_href=topic.href,
            blocks=[],
        )

    news = db.scalar(select(News).where(News.href == href, News.is_visible.is_(True)))
    if news is None:
        return None
    card = news_card(news, topics, lang)

    # Neighbours in the list of news (newest first): the newer one (arrow on the left) and the
    # older one (arrow on the right), so one can go from news to news without the list
    shown = News.is_visible.is_(True)
    same_day = News.published_on == news.published_on
    newer = db.scalar(
        select(News)
        .where(
            shown,
            or_(
                News.published_on > news.published_on, and_(same_day, News.id > news.id)
            ),
        )
        .order_by(News.published_on.asc(), News.id.asc())
        .limit(1)
    )
    older = db.scalar(
        select(News)
        .where(
            shown,
            or_(
                News.published_on < news.published_on, and_(same_day, News.id < news.id)
            ),
        )
        .order_by(*newest_first)
        .limit(1)
    )

    def neighbour(other: News | None) -> dict | None:
        if other is None:
            return None
        return {
            "href": other.href,
            "title": pick({"uk": other.title_uk, "en": other.title_en}, lang),
        }

    return PublicPage(
        newer=neighbour(newer),
        older=neighbour(older),
        kind="news",
        title=card["title"],
        date=card["date"],
        image=news.image,
        topic_title=card["topic"]["title"] if card["topic"] else "",
        topic_href=card["topic"]["href"] if card["topic"] else "",
        topic_tone=card["topic"]["tone"] if card["topic"] else 0,
        blocks=blocks_for_site(news.blocks, lang, db),
    )


# ---------- Admin: topics ----------


def topic_counts(db: DbSession) -> dict[int, tuple[int, int]]:
    """For each topic: how many news it has and how many of them are on the site."""
    rows = db.execute(
        select(
            News.topic_id,
            func.count(),
            func.count().filter(News.is_visible.is_(True)),
        )
        .where(News.topic_id.is_not(None))
        .group_by(News.topic_id)
    )
    return {topic_id: (total, shown) for topic_id, total, shown in rows}


def topic_read(topic: NewsTopic, counts: dict[int, tuple[int, int]]) -> NewsTopicRead:
    total, shown = counts.get(topic.id, (0, 0))
    return NewsTopicRead(
        id=topic.id,
        title_uk=topic.title_uk,
        title_en=topic.title_en,
        href=topic.href,
        is_visible=topic.is_visible,
        sort_order=topic.sort_order,
        news_count=total,
        visible_count=shown,
    )


@admin_router.get("/news-topics", response_model=list[NewsTopicRead])
def list_topics(db: DbSession):
    counts = topic_counts(db)
    topics = db.scalars(select(NewsTopic).order_by(NewsTopic.sort_order, NewsTopic.id))
    return [topic_read(topic, counts) for topic in topics]


@admin_router.get("/news-topics/{topic_id}", response_model=NewsTopicRead)
def read_topic(topic_id: int, db: DbSession):
    return topic_read(get_topic(db, topic_id), topic_counts(db))


@admin_router.post(
    "/news-topics", response_model=NewsTopicRead, status_code=status.HTTP_201_CREATED
)
def create_topic(data: NewsTopicSave, db: DbSession):
    check_href_free(db, data.href)
    last = db.scalar(select(func.max(NewsTopic.sort_order)))
    topic = NewsTopic(**data.model_dump(), sort_order=(last or 0) + 1)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic_read(topic, {})


@admin_router.patch("/news-topics/{topic_id}", response_model=NewsTopicRead)
def update_topic(topic_id: int, data: NewsTopicSave, db: DbSession):
    topic = get_topic(db, topic_id)
    check_href_free(db, data.href, current=topic.href)
    for key, value in data.model_dump().items():
        setattr(topic, key, value)
    db.commit()
    db.refresh(topic)
    return topic_read(topic, topic_counts(db))


@admin_router.patch("/news-topics/{topic_id}/visibility", response_model=NewsTopicRead)
def set_topic_visibility(topic_id: int, data: Visibility, db: DbSession):
    topic = get_topic(db, topic_id)
    topic.is_visible = data.is_visible
    db.commit()
    db.refresh(topic)
    return topic_read(topic, topic_counts(db))


@admin_router.put("/news-topics/order", response_model=list[NewsTopicRead])
def set_topics_order(data: TopicsOrder, db: DbSession):
    topics = {topic.id: topic for topic in db.scalars(select(NewsTopic))}
    if set(data.ids) != set(topics) or len(data.ids) != len(topics):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Список тем застарів, оновіть сторінку"
        )
    for position, topic_id in enumerate(data.ids, start=1):
        topics[topic_id].sort_order = position
    db.commit()
    return list_topics(db)


@admin_router.delete("/news-topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, db: DbSession):
    """Its news stay, without a topic (database rule)."""
    db.delete(get_topic(db, topic_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Admin: news ----------


def list_item(news: News, titles: dict[int, str]) -> NewsListItem:
    return NewsListItem(
        id=news.id,
        title_uk=news.title_uk,
        title_en=news.title_en,
        href=news.href,
        published_on=news.published_on,
        topic_id=news.topic_id,
        topic_title=titles.get(news.topic_id, "") if news.topic_id else "",
        image=news.image,
        is_visible=news.is_visible,
    )


def topic_titles(db: DbSession) -> dict[int, str]:
    return {t.id: t.title_uk for t in db.scalars(select(NewsTopic))}


def page_admin(db: DbSession, news: News) -> NewsPageAdmin:
    topic = db.get(NewsTopic, news.topic_id) if news.topic_id else None
    return NewsPageAdmin(
        id=news.id,
        title_uk=news.title_uk,
        title_en=news.title_en,
        blocks=news.blocks,
        href=news.href,
        published_on=news.published_on,
        topic_id=news.topic_id,
        topic_title=topic.title_uk if topic else "",
        image=news.image,
        summary={"uk": news.summary_uk, "en": news.summary_en},
        is_visible=news.is_visible,
    )


def check_topic(db: DbSession, topic_id: int | None) -> None:
    if topic_id is not None:
        get_topic(db, topic_id)


@admin_router.get("/news", response_model=list[NewsListItem])
def list_news(db: DbSession, topic_id: int | None = None):
    """All news, newest first; with topic_id only the news of that topic."""
    statement = select(News).order_by(*newest_first)
    if topic_id is not None:
        statement = statement.where(News.topic_id == topic_id)
    titles = topic_titles(db)
    return [list_item(news, titles) for news in db.scalars(statement)]


@admin_router.post(
    "/news", response_model=NewsListItem, status_code=status.HTTP_201_CREATED
)
def create_news(data: NewsCreate, db: DbSession):
    check_topic(db, data.topic_id)
    check_href_free(db, data.href)
    news = News(
        title_uk=data.title_uk,
        title_en="",
        href=data.href,
        published_on=data.published_on,
        topic_id=data.topic_id,
        summary_uk="",
        summary_en="",
        is_visible=False,
        blocks=[],
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return list_item(news, topic_titles(db))


@admin_router.patch("/news/{news_id}/visibility", response_model=NewsListItem)
def set_news_visibility(news_id: int, data: Visibility, db: DbSession):
    news = get_news(db, news_id)
    news.is_visible = data.is_visible
    db.commit()
    db.refresh(news)
    return list_item(news, topic_titles(db))


@admin_router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(news_id: int, db: DbSession):
    news = get_news(db, news_id)
    images = news_images(news)
    db.delete(news)
    db.commit()
    delete_page_images(images)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.get("/news/{news_id}/page", response_model=NewsPageAdmin)
def get_news_page(news_id: int, db: DbSession):
    return page_admin(db, get_news(db, news_id))


@admin_router.put("/news/{news_id}/page", response_model=NewsPageAdmin)
def save_news_page(news_id: int, data: NewsSave, db: DbSession):
    news = get_news(db, news_id)
    blocks = blocks_adapter.dump_python(data.blocks, mode="json")
    check_kinds(blocks, NEWS_FORBIDDEN_BLOCKS, "новини")
    check_topic(db, data.topic_id)
    check_href_free(db, data.href, current=news.href)
    old_images = news_images(news)

    news.title_uk = data.title_uk
    news.title_en = data.title_en
    news.blocks = blocks
    news.href = data.href
    news.published_on = data.published_on
    news.topic_id = data.topic_id
    news.image = data.image
    news.summary_uk = data.summary.uk
    news.summary_en = data.summary.en
    news.is_visible = data.is_visible
    db.commit()
    db.refresh(news)

    # Photos taken out of the news are not needed any more
    delete_page_images(old_images - news_images(news))
    return page_admin(db, news)


@admin_router.post("/news/{news_id}/page/images", status_code=status.HTTP_201_CREATED)
def upload_news_image(
    news_id: int, db: DbSession, image: Annotated[UploadFile, File()]
):
    """A photo for the news (main photo or a block). It is kept when the news is saved."""
    get_news(db, news_id)
    return upload(image)
