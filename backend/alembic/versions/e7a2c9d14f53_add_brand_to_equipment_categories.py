"""add brand to equipment categories

Every category now belongs to one brand: Carpigiani (equipment), IFI or ISA (showcases).
All existing categories get "carpigiani", so nothing on the site changes.

Revision ID: e7a2c9d14f53
Revises: d81f3a6c2b40
Create Date: 2026-10-22 23:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7a2c9d14f53"
down_revision: str | Sequence[str] | None = "d81f3a6c2b40"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "equipment_categories",
        sa.Column(
            "brand",
            sa.String(length=20),
            nullable=False,
            server_default="carpigiani",
        ),
    )
    op.create_index(
        op.f("ix_equipment_categories_brand"),
        "equipment_categories",
        ["brand"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_equipment_categories_brand"), table_name="equipment_categories"
    )
    op.drop_column("equipment_categories", "brand")
