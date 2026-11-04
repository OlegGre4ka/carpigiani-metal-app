"""add extra topics to news

A news item (an article) can be shown in more topics than its own (4.11): its own topic stays
on its label and in its breadcrumbs, the other topics list it too (a topic page, the "News by
topic" map, a page of the "Support" menu).

Revision ID: d2f4a6c8e0b3
Revises: c8e0a2b4d6f1
Create Date: 2026-11-04 22:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d2f4a6c8e0b3"
down_revision: str | Sequence[str] | None = "c8e0a2b4d6f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "news",
        sa.Column(
            "extra_topic_ids",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default="{}",
        ),
    )


def downgrade() -> None:
    op.drop_column("news", "extra_topic_ids")
