"""free the addresses of support pages

A page of the "Support" menu leads to the article it shows open (4.11), so its own address
(/carpigiani-gelato-university, /technologies) is not needed: it is freed, so an article can
take it (as on the old site).

Revision ID: f6b8d0a2c4e7
Revises: e4a6c8e0b2d5
Create Date: 2026-11-04 23:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6b8d0a2c4e7"
down_revision: str | Sequence[str] | None = "e4a6c8e0b2d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("UPDATE support_pages SET href = NULL")


def downgrade() -> None:
    # The addresses are not brought back: an article may have taken them
    pass
