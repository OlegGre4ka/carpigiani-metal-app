"""create news

Topics of news (like folders: a name and the address of the topic page) and the news
themselves (card fields + blocks of the page, built in the same page builder as category
and equipment pages). Nothing existing is changed; no topics are added: the client creates
them in the admin panel with the addresses from the old site.

Revision ID: f4c8a1d2b7e6
Revises: e7a2c9d14f53
Create Date: 2026-10-23 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f4c8a1d2b7e6"
down_revision: str | Sequence[str] | None = "e7a2c9d14f53"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "news_topics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title_uk", sa.String(length=120), nullable=False),
        sa.Column("title_en", sa.String(length=120), nullable=False),
        sa.Column("href", sa.String(length=300), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_news_topics_id"), "news_topics", ["id"], unique=False)

    op.create_table(
        "news",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column("href", sa.String(length=300), nullable=False),
        sa.Column("title_uk", sa.String(length=200), nullable=False),
        sa.Column("title_en", sa.String(length=200), nullable=False),
        sa.Column("published_on", sa.Date(), nullable=False),
        sa.Column("image", sa.String(length=300), nullable=True),
        sa.Column("summary_uk", sa.String(length=600), nullable=False),
        sa.Column("summary_en", sa.String(length=600), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("blocks", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
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
    )
    op.create_index(op.f("ix_news_id"), "news", ["id"], unique=False)
    op.create_index(op.f("ix_news_topic_id"), "news", ["topic_id"], unique=False)
    op.create_index(
        op.f("ix_news_published_on"), "news", ["published_on"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_news_published_on"), table_name="news")
    op.drop_index(op.f("ix_news_topic_id"), table_name="news")
    op.drop_index(op.f("ix_news_id"), table_name="news")
    op.drop_table("news")
    op.drop_index(op.f("ix_news_topics_id"), table_name="news_topics")
    op.drop_table("news_topics")
