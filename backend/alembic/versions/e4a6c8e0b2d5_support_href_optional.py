"""support page address optional

A page of the "Support" menu has no address of its own any more (4.11): its menu item leads to
the address of the article shown open. The addresses it had stay (old links still open it).

Revision ID: e4a6c8e0b2d5
Revises: d2f4a6c8e0b3
Create Date: 2026-11-04 22:50:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4a6c8e0b2d5"
down_revision: str | Sequence[str] | None = "d2f4a6c8e0b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "support_pages", "href", existing_type=sa.String(length=300), nullable=True
    )


def downgrade() -> None:
    op.execute("UPDATE support_pages SET href = '/support-' || id WHERE href IS NULL")
    op.alter_column(
        "support_pages", "href", existing_type=sa.String(length=300), nullable=False
    )
