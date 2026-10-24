"""rename equipment tiles to equipment categories

Revision ID: 7b1d2e3f4a5c
Revises: 6a0c306701d1
Create Date: 2026-10-18 18:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7b1d2e3f4a5c"
down_revision: str | Sequence[str] | None = "6a0c306701d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """The tiles of the home page are categories of equipment."""
    op.rename_table("equipment_tiles", "equipment_categories")
    op.execute(
        "ALTER SEQUENCE equipment_tiles_id_seq RENAME TO equipment_categories_id_seq"
    )
    op.execute("ALTER INDEX ix_equipment_tiles_id RENAME TO ix_equipment_categories_id")
    op.execute("ALTER INDEX equipment_tiles_pkey RENAME TO equipment_categories_pkey")


def downgrade() -> None:
    op.execute("ALTER INDEX equipment_categories_pkey RENAME TO equipment_tiles_pkey")
    op.execute("ALTER INDEX ix_equipment_categories_id RENAME TO ix_equipment_tiles_id")
    op.execute(
        "ALTER SEQUENCE equipment_categories_id_seq RENAME TO equipment_tiles_id_seq"
    )
    op.rename_table("equipment_categories", "equipment_tiles")
