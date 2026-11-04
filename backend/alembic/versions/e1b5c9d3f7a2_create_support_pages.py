"""create support pages

The pages of the "Support" menu (4.11), built from blocks, each with a topic of news (its news
go at the bottom of the page) and a "contact us" card. Two pages are made at once with their
topics: Carpigiani Gelato University and Technologies (a topic with the same name is used if it
already exists).

Revision ID: e1b5c9d3f7a2
Revises: c7d9e1f3a5b8
Create Date: 2026-11-04 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e1b5c9d3f7a2"
down_revision: str | Sequence[str] | None = "c7d9e1f3a5b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PAGES = [
    {
        "title_uk": "Carpigiani Gelato University",
        "title_en": "Carpigiani Gelato University",
        "href": "/carpigiani-gelato-university",
        "topic_href": "/news/carpigiani-gelato-university",
        "contact_title_uk": "Хочете навчитися робити морозиво?",
        "contact_title_en": "Want to learn how to make gelato?",
        "contact_text_uk": "Щоб стати студентом Carpigiani Gelato University або більше дізнатися про це, зв'яжіться з нами",
        "contact_text_en": "To become a student of Carpigiani Gelato University or to learn more about it, contact us",
    },
    {
        "title_uk": "Технології",
        "title_en": "Technologies",
        "href": "/technologies",
        "topic_href": "/news/technologies",
        "contact_title_uk": "Маєте запитання?",
        "contact_title_en": "Any questions?",
        "contact_text_uk": "Зв'яжіться з нами — розповімо про технології й підберемо обладнання під ваше завдання",
        "contact_text_en": "Contact us — we will tell you about the technologies and choose the equipment for your task",
    },
]


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "support_pages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title_uk", sa.String(length=200), nullable=False),
        sa.Column("title_en", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("href", sa.String(length=300), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column(
            "blocks",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "contact_title_uk", sa.String(length=200), nullable=False, server_default=""
        ),
        sa.Column(
            "contact_title_en", sa.String(length=200), nullable=False, server_default=""
        ),
        sa.Column(
            "contact_text_uk", sa.String(length=600), nullable=False, server_default=""
        ),
        sa.Column(
            "contact_text_en", sa.String(length=600), nullable=False, server_default=""
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["topic_id"], ["news_topics.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("href"),
    )
    op.create_index(op.f("ix_support_pages_id"), "support_pages", ["id"], unique=False)

    bind = op.get_bind()
    for order, page in enumerate(PAGES):
        # The topic of the page: the one with the same name, or a new one
        topic_id = bind.execute(
            sa.text("SELECT id FROM news_topics WHERE title_uk = :t"),
            {"t": page["title_uk"]},
        ).scalar()
        if topic_id is None:
            href = page["topic_href"]
            taken = bind.execute(
                sa.text("SELECT 1 FROM news_topics WHERE href = :h"), {"h": href}
            ).scalar()
            if taken:
                href = f"{href}-topic"
            last = bind.execute(
                sa.text("SELECT COALESCE(MAX(sort_order), 0) FROM news_topics")
            ).scalar()
            topic_id = bind.execute(
                sa.text(
                    "INSERT INTO news_topics (title_uk, title_en, href, sort_order, is_visible) "
                    "VALUES (:uk, :en, :href, :o, true) RETURNING id"
                ),
                {
                    "uk": page["title_uk"],
                    "en": page["title_en"],
                    "href": href,
                    "o": last + 1,
                },
            ).scalar()
        # The address may be taken by an older page: then the page is made hidden under -support
        taken = bind.execute(
            sa.text(
                "SELECT 1 FROM equipment_categories WHERE href = :h "
                "UNION SELECT 1 FROM news_topics WHERE href = :h UNION SELECT 1 FROM news WHERE href = :h"
            ),
            {"h": page["href"]},
        ).scalar()
        bind.execute(
            sa.text(
                "INSERT INTO support_pages (title_uk, title_en, href, sort_order, is_visible, topic_id, blocks,"
                " contact_title_uk, contact_title_en, contact_text_uk, contact_text_en)"
                " VALUES (:uk, :en, :href, :o, :vis, :topic, '[]', :cuk, :cen, :tuk, :ten)"
            ),
            {
                "uk": page["title_uk"], "en": page["title_en"],
                "href": f"{page['href']}-support" if taken else page["href"],
                "o": order, "vis": not taken, "topic": topic_id,
                "cuk": page["contact_title_uk"], "cen": page["contact_title_en"],
                "tuk": page["contact_text_uk"], "ten": page["contact_text_en"],
            },
        )  # fmt: skip


def downgrade() -> None:
    """Downgrade schema (the topics made for the pages stay with their news)."""
    op.drop_index(op.f("ix_support_pages_id"), table_name="support_pages")
    op.drop_table("support_pages")
