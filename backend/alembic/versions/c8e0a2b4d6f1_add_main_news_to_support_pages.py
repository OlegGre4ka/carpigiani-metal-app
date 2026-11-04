"""add main news to support pages

A page of the "Support" menu shows one article of its topic open (chosen in the admin panel);
the other articles of the topic go under it. Deleting the article keeps the page (then the
newest article of the topic is shown).

Revision ID: c8e0a2b4d6f1
Revises: b4d6f8a0c2e3
Create Date: 2026-11-04 19:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c8e0a2b4d6f1"
down_revision: str | Sequence[str] | None = "b4d6f8a0c2e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("support_pages", sa.Column("main_news_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "support_pages_main_news_id_fkey",
        "support_pages",
        "news",
        ["main_news_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("support_pages_main_news_id_fkey", "support_pages", type_="foreignkey")
    op.drop_column("support_pages", "main_news_id")
