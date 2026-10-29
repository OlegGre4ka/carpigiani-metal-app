import { Download } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { CategoryGallery } from "@/components/category-gallery";
import { CategorySlider } from "@/components/category-slider";
import { CategoryVideo } from "@/components/category-video";
import { ContactForm } from "@/components/contact-form";
import { EquipmentPageMark } from "@/components/contact-widget";
import { EquipmentCards } from "@/components/equipment-cards";
import { EquipmentCatalogSheet } from "@/components/equipment-catalog-sheet";
import { EquipmentMap } from "@/components/equipment-map";
import { ModelArrows } from "@/components/news-arrows";
import { Reveal } from "@/components/reveal";
import type {
  CatalogsBlock,
  FeaturesBlock,
  PageBlock,
  SitePageData,
  SubcategoryBlock,
  TableBlock,
  TextBlock,
} from "@/lib/site-pages";
import { loadEquipmentMap } from "@/lib/site-pages";

// A page built in the admin panel: of an equipment category (/gelato) or of a piece of
// equipment (/labotronic). The same blocks for both.
// Equipment pages have two columns (claude/equipment-page-design.md): the blocks on the left,
// on the right the map of equipment and the contact form that sticks while scrolling
// (the right column is as tall as the left one, so the form stops at the end of the content).
// On phones the map is behind the "Equipment catalog" button and the form is in the
// floating "Contact" button.
// The blocks come from the admin panel in the order the client put them; hidden and empty
// blocks never reach this page. Texts are already in the language of the site.

const blockTitle =
  "mb-4.5 font-heading text-[36px] leading-[1.05] font-extrabold tracking-[-0.02em] metal-text-dark max-[820px]:text-[28px]";

const equipmentTitle =
  "mb-3.5 font-heading text-[31px] leading-[1.05] font-extrabold tracking-[-0.02em] metal-text-dark max-[820px]:text-[25px]";

// Blocks appear when scrolled to (components/reveal.tsx); the first ones on the screen one by one
const delay = (index: number) => (index < 3 ? 120 + index * 90 : 0);
// Corner radius of each kind of block, so the opening of the card matches it
const radius: Record<PageBlock["type"], number> = {
  categories: 0,
  slider: 40,
  text: 36,
  gallery: 28,
  features: 26,
  table: 28,
  video: 32,
  subcategory: 30,
  catalogs: 36,
  photo: 40,
};
// Category pages: the slider, text and video are a bit more rounded
const wideRadius: Partial<Record<PageBlock["type"], number>> = { slider: 48, text: 40, video: 36 };

export async function SitePage({ page, href, locale }: { page: SitePageData; href: string; locale: string }) {
  const t = await getTranslations();
  const equipment = page.kind === "equipment";
  // The brand of the category: the map and the breadcrumbs of that brand
  const brand = page.brand ?? "carpigiani";
  const brandTitle = page.brand_title || brand;
  const map = equipment ? await loadEquipmentMap(locale, brand) : [];
  // The map of other brands is called by their page ("IFI display cases")
  const mapTitle = brand === "carpigiani" ? undefined : brandTitle;
  const blocks = page.blocks.map((block, index) => (
    <Reveal key={block.id} delay={delay(index)} radius={equipment ? radius[block.type] : (wideRadius[block.type] ?? radius[block.type])} className="min-w-0">
      {/* Carpigiani machines cut out on a transparent background come out of their cards */}
      <Block block={block} compact={equipment} title={page.item_title || page.title} pop={brand === "carpigiani"} />
    </Reveal>
  ));
  // Home › Equipment catalog › brand › category (› equipment)
  const crumbs: Crumb[] = [
    { title: t("Nav.catalog") },
    { title: brandTitle, href: page.brand_href || `/${brand}` },
    ...(page.kind === "equipment"
      ? [{ title: page.category_title, href: page.category_href || undefined }, { title: page.item_title || page.title }]
      : [{ title: page.category_title }]),
  ];

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      {/* Marks an equipment page: the floating "Contact us" button hides on large screens and its
          form on phones says which equipment the request is about (components/contact-widget.tsx) */}
      {equipment && <EquipmentPageMark name={page.item_title || page.title} />}
      <Breadcrumbs items={crumbs} />

      <h1 className="w-fit max-w-full mb-5.5 font-heading text-[33px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[25px]">
        {page.title}
      </h1>

      {equipment ? (
        <>
          <EquipmentCatalogSheet categories={map} current={href} title={mapTitle} />
          <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-10 max-[1100px]:grid-cols-[minmax(0,1fr)_300px] max-[1100px]:gap-7 max-[820px]:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-8 max-[820px]:gap-5.5">{blocks}</div>
            {/* Right column: as tall as the left one (no align-items:start), nothing with
                overflow or transform around the sticky form, or it would not stick */}
            <aside className="flex min-w-0 flex-col gap-6 max-[820px]:hidden">
              {map.length > 0 && (
                <Reveal delay={150} radius={30} className="reveal-side">
                  <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] px-4.5 pt-5 pb-3.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.09)]">
                    <EquipmentMap categories={map} current={href} title={mapTitle} brand={brand} />
                  </div>
                </Reveal>
              )}
              {/* The sticky box itself is never animated (a transform would stop it sticking) */}
              <div className="sticky top-6">
                <Reveal delay={350} radius={30}>
                  <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.16)]">
                    <ContactForm variant="page" subject={page.item_title || page.title} page={href} />
                  </div>
                </Reveal>
              </div>
            </aside>
          </div>
          {/* To the model before / after in this category (on phones at the bottom of the page) */}
          <div className="max-[820px]:mt-7">
            <ModelArrows prev={page.prev_item} next={page.next_item} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-14 max-[820px]:gap-9">{blocks}</div>
      )}
    </main>
  );
}

/** compact: equipment pages (narrower column: smaller paddings and corners).
 *  Also the blocks of news pages (components/news-article.tsx). */
export function Block({ block, compact, title, pop = false }: { block: PageBlock; compact: boolean; title: string; pop?: boolean }) {
  switch (block.type) {
    case "categories":
      // Only on brand pages (components/brand-page.tsx)
      return null;
    case "photo":
      return <MainPhoto image={block.image} alt={title} />;
    case "slider":
      return <CategorySlider images={block.images} autoplay={block.autoplay} variant={compact ? "equipment" : "category"} />;
    case "text":
      return <TextSheet block={block} compact={compact} />;
    case "gallery":
      return <CategoryGallery block={block} />;
    case "features":
      return <Features block={block} />;
    case "table":
      return <SpecTable block={block} />;
    case "video":
      return <CategoryVideo videoId={block.video_id} caption={block.caption} compact={compact} />;
    case "subcategory":
      return <Subcategory block={block} pop={pop} />;
    case "catalogs":
      return <Catalogs block={block} />;
  }
}

/** A subcategory on the page: its title and the cards of its equipment (4 in a row, 2 on phones).
 *  A click on a card opens the page of the equipment (components/equipment-cards.tsx). */
function Subcategory({ block, pop }: { block: SubcategoryBlock; pop: boolean }) {
  return (
    <section>
      {block.title && <h2 className={blockTitle}>{block.title}</h2>}
      <EquipmentCards items={block.items} pop={pop} />
    </section>
  );
}

/** Main photo of an equipment page: one big photo of the machine in the middle of a white
 *  card, shown whole (not cropped), like on the old site. It settles softly when it appears. */
function MainPhoto({ image, alt }: { image: string; alt: string }) {
  return (
    <section className="relative h-[clamp(360px,64vh,600px)] overflow-hidden rounded-[40px] bg-white shadow-[0_26px_60px_rgb(var(--shadow-rgb)/0.16)] max-[820px]:h-[min(100vw,440px)] max-[820px]:rounded-[28px]">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="(max-width: 820px) 100vw, 900px"
        data-reveal-zoom
        className="object-contain p-[5%] max-[820px]:p-[6%]"
      />
    </section>
  );
}

/** Text on a white "sheet". The HTML is cleaned by the backend before it is saved. */
function TextSheet({ block, compact }: { block: TextBlock; compact: boolean }) {
  return (
    <section
      className={`border border-white/90 bg-[rgb(var(--paper-rgb)/0.92)] shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[820px]:rounded-[28px] max-[820px]:px-5 max-[820px]:py-6.5 ${
        compact ? "rounded-[36px] px-11 py-9.5" : "rounded-[40px] px-14 py-12"
      }`}
    >
      {block.title && <h2 className={compact ? equipmentTitle : blockTitle}>{block.title}</h2>}
      {/* Text copied from the old site joins words with non-breaking spaces: such a line cannot
          wrap and pushes the page wider than a phone screen, so they become plain spaces */}
      <div data-reveal-kids className="rich" dangerouslySetInnerHTML={{ __html: block.html.replace(/&nbsp;|\u00a0/g, " ") }} />
    </section>
  );
}

/** Tiles in two columns: a short title and a description */
function Features({ block }: { block: FeaturesBlock }) {
  return (
    <section>
      {block.title && <h2 className={blockTitle}>{block.title}</h2>}
      <ul data-reveal-kids className="grid grid-cols-2 gap-4.5 max-[820px]:grid-cols-1">
        {block.items.map((item, index) => (
          <li
            key={index}
            className="rounded-[26px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.92)] px-6.5 py-6 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.07)]"
          >
            {item.title && <b className="mb-1.5 block text-lg text-ink">{item.title}</b>}
            {item.text && <span className="text-[15px] leading-relaxed text-ink-soft">{item.text}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Table: rounded, header in sand, the second column lightly marked. Scrolls sideways on phones. */
function SpecTable({ block }: { block: TableBlock }) {
  const cell = "px-5 py-3.75 align-top max-[820px]:px-4 max-[820px]:py-3";
  const second = "[&:nth-child(2)]:bg-[rgb(var(--mist-rgb)/0.55)]";

  return (
    <section>
      {block.title && <h2 className={blockTitle}>{block.title}</h2>}
      <div className="overflow-x-auto rounded-[28px] border border-ink/12 bg-white">
        <table className="w-full min-w-160 border-collapse text-base max-[820px]:text-[15px]">
          {block.header.length > 0 && (
            <thead>
              <tr>
                {block.header.map((title, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`${cell} bg-mist text-left text-sm font-extrabold tracking-[0.3px] text-brand ${second}`}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody data-reveal-rows>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-t border-ink/10 ${block.header.length > 0 ? "" : "first:border-t-0"}`}
              >
                {row.map((value, index) => (
                  <td
                    key={index}
                    className={`${cell} text-body first:font-extrabold first:whitespace-nowrap first:text-ink ${second}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** PDF catalogs to download: a white card "Catalogs", two in a row (one on phones), each a
 *  caramel button with the name of the file and its size under it. */
async function Catalogs({ block }: { block: CatalogsBlock }) {
  const t = await getTranslations("CategoryPage");
  const te = await getTranslations("EquipmentPage");
  const size = (bytes: number) =>
    bytes >= 1024 * 1024
      ? t("megabytes", { size: (bytes / 1024 / 1024).toFixed(2) })
      : t("kilobytes", { size: Math.max(1, Math.round(bytes / 1024)) });

  return (
    <section className="rounded-[36px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.92)] px-9 py-7.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[820px]:rounded-[28px] max-[820px]:px-5 max-[820px]:py-6">
      <h2 className="mb-4.5 font-heading tracking-[-0.02em] text-[26px] leading-[1.05] font-extrabold metal-text-dark max-[820px]:text-[23px]">{te("catalogs")}</h2>
      <ul data-reveal-kids className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        {block.items.map((file) => (
          <li key={file.url} className="min-w-0">
            <a
              href={file.url}
              download={file.name}
              aria-label={t("downloadPdf", { name: file.name })}
              className="btn-shine group/btn inline-flex max-w-full items-center gap-2.5 rounded-full bg-[image:var(--grad-btn)] px-6 py-3.75 text-[15px] font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.3)] transition duration-300 hover:-translate-y-0.5 hover:brightness-108 hover:shadow-[0_16px_30px_rgb(var(--brand-rgb)/0.4)]"
            >
              <Download size={18} strokeWidth={2.6} aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover/btn:translate-y-0.5" />
              <span className="truncate">{file.label}</span>
            </a>
            <p className="mt-2.5 text-[13px] leading-normal text-ink-soft">
              <b className="text-ink">{t("file")}:</b> <span className="break-all">{file.name}</span>
              <br />
              PDF · {size(file.size)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
