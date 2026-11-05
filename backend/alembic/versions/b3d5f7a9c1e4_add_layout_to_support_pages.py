"""add layout to support pages

A page of the "Support" menu shows its articles one of two ways (5.11, the client): "article"
(the chosen article open for reading, as Carpigiani Gelato University) or "list" (the chosen
article as a big preview card, the other articles of the topic under it two in a row, as
Technologies). A list has its own address (the column href, unused since 4.11). Technologies
becomes a list at /support-technologies, if that address is free.

Revision ID: b3d5f7a9c1e4
Revises: a1c3e5f7b9d2
Create Date: 2026-11-05 14:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3d5f7a9c1e4"
down_revision: str | Sequence[str] | None = "a1c3e5f7b9d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ADDRESS = "/support-technologies"


def upgrade() -> None:
    op.add_column(
        "support_pages",
        sa.Column(
            "layout", sa.String(length=20), nullable=False, server_default="article"
        ),
    )
    connection = op.get_bind()
    taken = connection.execute(
        sa.text(
            "SELECT 1 FROM support_pages WHERE href = :a"
            " UNION SELECT 1 FROM news WHERE href = :a"
            " UNION SELECT 1 FROM news_topics WHERE href = :a"
            " UNION SELECT 1 FROM equipment_categories WHERE href = :a"
        ),
        {"a": ADDRESS},
    ).first()
    if taken is None:
        connection.execute(
            sa.text(
                "UPDATE support_pages SET layout = 'list', href = :a WHERE id = ("
                " SELECT id FROM support_pages WHERE lower(trim(title_uk)) = 'технології'"
                " ORDER BY id LIMIT 1)"
            ),
            {"a": ADDRESS},
        )


def downgrade() -> None:
    op.execute("UPDATE support_pages SET href = NULL WHERE layout = 'list'")
    op.drop_column("support_pages", "layout")
