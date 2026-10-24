"""create site settings, mark requests as read

Settings of the site edited in the admin panel (first: the contacts — phones, email, address,
point on the map, hours, the email for requests); until the client saves the contacts the site
shows the ones it had before. Requests from the contact form get "read" (the "Requests" section
of the admin panel); the requests already there stay new.

Revision ID: a9d3e5f7b2c1
Revises: f4c8a1d2b7e6
Create Date: 2026-10-23 21:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a9d3e5f7b2c1"
down_revision: str | Sequence[str] | None = "f4c8a1d2b7e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(length=40), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("key"),
    )
    op.add_column(
        "contact_requests",
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("contact_requests", "is_read")
    op.drop_table("site_settings")
