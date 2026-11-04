"""add image to support pages

The main photo of a page of the "Support" menu, at the top of the page (like the main photo of
a news item).

Revision ID: b4d6f8a0c2e3
Revises: e1b5c9d3f7a2
Create Date: 2026-11-04 18:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b4d6f8a0c2e3"
down_revision: str | Sequence[str] | None = "e1b5c9d3f7a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("support_pages", sa.Column("image", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("support_pages", "image")
