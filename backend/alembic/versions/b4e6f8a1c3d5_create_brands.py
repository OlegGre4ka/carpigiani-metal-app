"""create brands

Brands become the top level of the catalogue: Brand → categories → subcategories → equipment.
The three brands the site already has (Carpigiani, IFI, ISA) are added here with their logos,
and every category is tied to its brand, so nothing on the site changes.

Revision ID: b4e6f8a1c3d5
Revises: a9d3e5f7b2c1
Create Date: 2026-10-26 17:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b4e6f8a1c3d5"
down_revision: str | Sequence[str] | None = "a9d3e5f7b2c1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    brands = op.create_table(
        "brands",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=40), nullable=False),
        sa.Column("title_uk", sa.String(length=120), nullable=False),
        sa.Column("title_en", sa.String(length=120), nullable=False),
        sa.Column("logo", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_brands_id"), "brands", ["id"], unique=False)
    op.create_index(op.f("ix_brands_key"), "brands", ["key"], unique=True)
    op.bulk_insert(
        brands,
        [
            {"key": "carpigiani", "title_uk": "Carpigiani", "title_en": "Carpigiani",
             "logo": "/images/carpigiani-brand-logo.webp", "sort_order": 1, "is_visible": True},
            {"key": "ifi", "title_uk": "IFI", "title_en": "IFI",
             "logo": "/images/ifi-logo.webp", "sort_order": 2, "is_visible": True},
            {"key": "isa", "title_uk": "ISA", "title_en": "ISA",
             "logo": "/images/isa-logo.webp", "sort_order": 3, "is_visible": True},
        ],
    )
    op.alter_column(
        "equipment_categories", "brand", type_=sa.String(length=40), existing_nullable=False
    )
    op.create_foreign_key(
        "fk_equipment_categories_brand",
        "equipment_categories",
        "brands",
        ["brand"],
        ["key"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_equipment_categories_brand", "equipment_categories", type_="foreignkey")
    op.alter_column(
        "equipment_categories", "brand", type_=sa.String(length=20), existing_nullable=False
    )
    op.drop_index(op.f("ix_brands_key"), table_name="brands")
    op.drop_index(op.f("ix_brands_id"), table_name="brands")
    op.drop_table("brands")
