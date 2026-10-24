"""create contact requests

Requests from the contact form of the site (name, email, optional phone, message,
the equipment it is about). Nothing existing is changed.

Revision ID: d81f3a6c2b40
Revises: c5e2b8d41a97
Create Date: 2026-10-22 19:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d81f3a6c2b40"
down_revision: str | Sequence[str] | None = "c5e2b8d41a97"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "contact_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("page", sa.String(length=300), nullable=False),
        sa.Column("lang", sa.String(length=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_contact_requests_id"), "contact_requests", ["id"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_contact_requests_id"), table_name="contact_requests")
    op.drop_table("contact_requests")
