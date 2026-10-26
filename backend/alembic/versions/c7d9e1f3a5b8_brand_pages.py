"""Brand pages built in the admin panel: title, subtitle, blocks, equipment with filters.

The pages /carpigiani, /ifi and /isa get what they showed before (they were written in the code):
title and line under it, the category cards, the text about the brand; IFI and ISA also all
their equipment with filter chips.

Revision ID: c7d9e1f3a5b8
Revises: b4e6f8a1c3d5
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "c7d9e1f3a5b8"
down_revision = "b4e6f8a1c3d5"
branch_labels = None
depends_on = None

PAGES = {
    "carpigiani": {
        "page_title_uk": "Обладнання Carpigiani",
        "page_title_en": "Carpigiani equipment",
        "subtitle_uk": "Фризери, пастеризатори та інше обладнання Carpigiani, відсортоване "
        "за галуззю застосування",
        "subtitle_en": "Batch freezers, pasteurizers and other Carpigiani equipment, "
        "sorted by application",
        "show_equipment": False,
        "blocks": [
            {"id": "cats", "visible": True, "type": "categories"},
            {
                "id": "about",
                "visible": True,
                "type": "text",
                "title": {"uk": "", "en": ""},
                "html": {
                    "uk": '<p><img src="/images/carpigiani-brand-logo.webp" '
                    'alt="Carpigiani" data-align="left" '
                    'data-size="s">CARPIGIANI GROUP — найвідоміший виробник '
                    "у галузі комерційного обладнання для виробництва "
                    "морозива. Продажі компанії складають близько 50% "
                    "світового ринку в секторі апаратів для виробництва "
                    "італійського морозива джелато та м'якого "
                    "морозива.</p><p>Зараз компанія виробляє фризери, "
                    "пастеризатори та інше обладнання під брендами "
                    "Carpigiani, Coldelite, Ice Team 1927, Ott-Freezer, "
                    "Promag, Sencotel і GBG.</p><p>У 2003 році компанією "
                    "було засновано <a "
                    'href="/carpigiani-gelato-university">Carpigiani Gelato '
                    "University</a> — школу професійної підготовки "
                    "спеціалістів з виробництва морозива. Навчання "
                    "проводиться як у штаб-квартирі компанії (в Anzola "
                    "dell'Emilia), так і в інших країнах. У 2012 році "
                    "відкрили музей морозива Carpigiani Gelato Museum, "
                    "присвячений історії, культурі та технології "
                    "приготування домашнього морозива.</p><p>Наша компанія "
                    "є офіційним дистриб'ютором CARPIGIANI GROUP в Україні. "
                    "Ми готові надати вам послуги проєктування й підбору "
                    "обладнання, здійснюємо гарантійне та післягарантійне "
                    "сервісне обслуговування обладнання.</p>",
                    "en": '<p><img src="/images/carpigiani-brand-logo.webp" '
                    'alt="Carpigiani" data-align="left" '
                    'data-size="s">CARPIGIANI GROUP is the best-known '
                    "manufacturer of commercial ice cream equipment. The "
                    "company accounts for about 50% of the world market for "
                    "machines that make Italian gelato and soft "
                    "serve.</p><p>Today the company makes batch freezers, "
                    "pasteurizers and other equipment under the Carpigiani, "
                    "Coldelite, Ice Team 1927, Ott-Freezer, Promag, "
                    "Sencotel and GBG brands.</p><p>In 2003 the company "
                    "founded <a "
                    'href="/carpigiani-gelato-university">Carpigiani Gelato '
                    "University</a>, a school that trains ice cream "
                    "professionals. Courses take place at the company "
                    "headquarters in Anzola dell'Emilia and in other "
                    "countries. In 2012 the Carpigiani Gelato Museum "
                    "opened, dedicated to the history, culture and "
                    "technology of gelato making.</p><p>Our company is the "
                    "official distributor of CARPIGIANI GROUP in Ukraine. "
                    "We design projects and select equipment for you, and "
                    "provide warranty and post-warranty service.</p>",
                },
            },
        ],
    },
    "ifi": {
        "page_title_uk": "Вітрини IFI",
        "page_title_en": "IFI display cases",
        "subtitle_uk": "Вітрини для морозива, кондитерських виробів і барних стійок від "
        "італійського виробника IFI",
        "subtitle_en": "Display cases for gelato, pastry and bar counters by the Italian "
        "manufacturer IFI",
        "show_equipment": True,
        "blocks": [
            {"id": "cats", "visible": True, "type": "categories"},
            {
                "id": "about",
                "visible": True,
                "type": "text",
                "title": {"uk": "", "en": ""},
                "html": {
                    "uk": '<p><img src="/images/ifi-logo.webp" alt="IFI" '
                    'data-align="right" data-size="s"><b>IFI</b> — італійський '
                    "виробник високого класу, який спеціалізується на виробництві "
                    "вітрин і готових рішень для організації барних стійок. "
                    "Продукцію IFI найкраще описують такі характеристики як: "
                    "<b>найсучасніший дизайн, інноваційність та висока якість "
                    "виготовлення</b>. Такі моделі вітрин як <a "
                    'href="/ifi-panorama">PANORAMA</a> і <a '
                    'href="/ifi-tonda">TONDA</a> були настільки вдалими й '
                    "інноваційними продуктами, що створили цілі напрямки в "
                    "індустрії вітрин для морозива: їх наслідують, на них "
                    "орієнтуються інші виробники.</p><p>Доступно декілька "
                    "варіантів комплектації вітрин декоративними "
                    "панелями:</p><ul><li><b>Без панелей.</b> Поставляється тільки "
                    "технологічна частина вітрини, яка за місцем установки "
                    "обшивається матеріалами замовника.</li><li><b>RAL 9010.</b> "
                    "Вітрина поставляється укомплектована стандартними "
                    "декоративними панелями білого кольору RAL 9010.</li><li><b>LC "
                    "RAL.</b> Комплектація передбачає виготовлення вітрини з "
                    "декоративними панелями будь-якого кольору RAL за бажанням "
                    "замовника.</li></ul><p>Більшість вітрин випускаються в "
                    "декількох модифікаціях, які мають однаковий зовнішній вигляд, "
                    "але різну технологічну начинку і, відповідно, розраховані на "
                    "експозицію різних видів продукції: морозива gelato, шоколаду, "
                    "кондитерських виробів, випічки або гастрономії.</p>",
                    "en": '<p><img src="/images/ifi-logo.webp" alt="IFI" '
                    'data-align="right" data-size="s"><b>IFI</b> is a high-end '
                    "Italian manufacturer specialising in display cases and "
                    "ready-made solutions for bar counters. IFI products are best "
                    "described by <b>cutting-edge design, innovation and high "
                    "build quality</b>. Display cases such as <a "
                    'href="/ifi-panorama">PANORAMA</a> and <a '
                    'href="/ifi-tonda">TONDA</a> were so successful and innovative '
                    "that they started whole new directions in the gelato display "
                    "case industry: other manufacturers follow and imitate "
                    "them.</p><p>The display cases come with several options of "
                    "decorative panels:</p><ul><li><b>No panels.</b> Only the "
                    "technical part of the case is supplied; on site it is clad "
                    "with the customer's own materials.</li><li><b>RAL 9010.</b> "
                    "The case comes with standard white decorative panels, RAL "
                    "9010.</li><li><b>LC RAL.</b> The case is made with decorative "
                    "panels in any RAL colour the customer "
                    "chooses.</li></ul><p>Most display cases come in several "
                    "versions that look the same but have different technical "
                    "equipment inside, so each is made for showing a different "
                    "kind of product: gelato, chocolate, pastry, baked goods or "
                    "deli food.</p>",
                },
            },
        ],
    },
    "isa": {
        "page_title_uk": "Вітрини ISA",
        "page_title_en": "ISA display cases",
        "subtitle_uk": "Вітрини для морозива, кондитерських виробів, шоколаду, гастрономії і "
        "випічки від італійського виробника ISA",
        "subtitle_en": "Display cases for gelato, pastry, chocolate, deli food and baked goods by "
        "the Italian manufacturer ISA",
        "show_equipment": True,
        "blocks": [
            {"id": "cats", "visible": True, "type": "categories"},
            {
                "id": "about",
                "visible": True,
                "type": "text",
                "title": {"uk": "", "en": ""},
                "html": {
                    "uk": '<p><img src="/images/isa-logo.webp" alt="ISA" '
                    'data-align="right" data-size="s"><b>ISA</b> - відомий '
                    "італійський виробник, що спеціалізується на виготовленні "
                    "холодильного обладнання, готових рішень для кафе, ресторанів "
                    "і магазинів.</p><p>Цьому виробнику вдається підтримувати "
                    "високі стандарти зовнішнього вигляду, якості виконання та, "
                    "водночас, доступні ціни. Завдяки цим якостям такі моделі "
                    "вітрин для морозива джелато як <a "
                    'href="/isa-il-carrettino">CARRETTINO DEI GELATI</a> і <a '
                    'href="/isa-millennium">MILLENNIUM</a> протягом багатьох років '
                    "залишаються бестселерами на ринку. Нові моделі <a "
                    'href="/isa-oneshow-free">ONESHOW</a> і <a '
                    'href="/isa-supercapri">SUPERCAPRI</a> стали такими в останні '
                    "роки.</p><p><b>ISA</b> пропонує широкий вибір вітрин для "
                    "морозива, кондитерських виробів, шоколаду, гастрономії і "
                    "випічки. Для зручності ми розділили їх на дві "
                    'групи:</p><ul><li>Недорогі "промоційні" вітрини для '
                    "морозива</li><li>Професійні вітрини, які забезпечують ефектну "
                    "демонстрацію морозива та кондитерських "
                    "виробів</li></ul><p>Пропонуємо їх до Вашої уваги:</p>",
                    "en": '<p><img src="/images/isa-logo.webp" alt="ISA" '
                    'data-align="right" data-size="s"><b>ISA</b> is a well-known '
                    "Italian manufacturer of refrigeration equipment and "
                    "ready-made solutions for cafés, restaurants and "
                    "shops.</p><p>The company manages to keep high standards of "
                    "appearance and build quality while keeping prices affordable. "
                    "Thanks to this, gelato display cases such as <a "
                    'href="/isa-il-carrettino">CARRETTINO DEI GELATI</a> and <a '
                    'href="/isa-millennium">MILLENNIUM</a> have been bestsellers '
                    "for many years. The new <a "
                    'href="/isa-oneshow-free">ONESHOW</a> and <a '
                    'href="/isa-supercapri">SUPERCAPRI</a> models have become '
                    "bestsellers in recent years.</p><p><b>ISA</b> offers a wide "
                    "range of display cases for gelato, pastry, chocolate, deli "
                    "food and baked goods. For convenience we have divided them "
                    'into two groups:</p><ul><li>Affordable "promotional" gelato '
                    "display cases</li><li>Professional display cases for an "
                    "impressive display of gelato and pastry</li></ul><p>Here they "
                    "are:</p>",
                },
            },
        ],
    },
}


def upgrade() -> None:
    op.add_column("brands", sa.Column("page_title_uk", sa.String(200), nullable=True))
    op.add_column("brands", sa.Column("page_title_en", sa.String(200), nullable=True))
    op.add_column(
        "brands",
        sa.Column("subtitle_uk", sa.String(400), nullable=False, server_default=""),
    )
    op.add_column(
        "brands",
        sa.Column("subtitle_en", sa.String(400), nullable=False, server_default=""),
    )
    op.add_column("brands", sa.Column("blocks", postgresql.JSONB(), nullable=True))
    op.add_column(
        "brands",
        sa.Column(
            "show_equipment", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )
    op.add_column(
        "brands",
        sa.Column(
            "hidden_chips",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )

    brands = sa.table(
        "brands",
        sa.column("key", sa.String),
        sa.column("page_title_uk", sa.String),
        sa.column("page_title_en", sa.String),
        sa.column("subtitle_uk", sa.String),
        sa.column("subtitle_en", sa.String),
        sa.column("blocks", postgresql.JSONB),
        sa.column("show_equipment", sa.Boolean),
    )
    for key, page in PAGES.items():
        op.execute(brands.update().where(brands.c.key == key).values(**page))


def downgrade() -> None:
    for column in (
        "hidden_chips",
        "show_equipment",
        "blocks",
        "subtitle_en",
        "subtitle_uk",
        "page_title_en",
        "page_title_uk",
    ):
        op.drop_column("brands", column)
