"""create partners

The partners of the company (4.11): the strip of logos on the home page before the footer, as on
the old site. The first three are the brands whose logos the site already has.

Revision ID: a1c3e5f7b9d2
Revises: f6b8d0a2c4e7
Create Date: 2026-11-04 23:55:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1c3e5f7b9d2"
down_revision: str | Sequence[str] | None = "f6b8d0a2c4e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FIRST = [
    ("Carpigiani", "/images/carpigiani-brand-logo.webp", "https://www.carpigiani.com"),
    ("IFI", "/images/ifi-logo.webp", "https://www.ifi.it"),
    ("ISA", "/images/isa-logo.webp", "https://www.isaitaly.com"),
]


def upgrade() -> None:
    partners = op.create_table(
        "partners",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("logo", sa.String(length=300), nullable=False),
        sa.Column("url", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
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
    op.create_index(op.f("ix_partners_id"), "partners", ["id"], unique=False)
    op.bulk_insert(
        partners,
        [
            {
                "title": title,
                "logo": logo,
                "url": url,
                "sort_order": index,
                "is_visible": True,
            }
            for index, (title, logo, url) in enumerate(FIRST)
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_partners_id"), table_name="partners")
    op.drop_table("partners")
