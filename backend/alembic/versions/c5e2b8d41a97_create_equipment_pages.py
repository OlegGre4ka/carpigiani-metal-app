"""create equipment pages

Pages of single pieces of equipment (/labotronic), built in the same page builder
as category pages. The address of each page is kept in the equipment card ("href"
in equipment_subcategories.items), so no data is moved here.

Revision ID: c5e2b8d41a97
Revises: a3f1907f6624
Create Date: 2026-10-22 17:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c5e2b8d41a97"
down_revision: str | Sequence[str] | None = "a3f1907f6624"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "equipment_pages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subcategory_id", sa.Integer(), nullable=False),
        sa.Column("item_id", sa.String(length=40), nullable=False),
        sa.Column("title_uk", sa.String(length=200), nullable=False),
        sa.Column("title_en", sa.String(length=200), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["subcategory_id"], ["equipment_subcategories.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subcategory_id", "item_id"),
    )
    op.create_index(
        op.f("ix_equipment_pages_id"), "equipment_pages", ["id"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_equipment_pages_id"), table_name="equipment_pages")
    op.drop_table("equipment_pages")
