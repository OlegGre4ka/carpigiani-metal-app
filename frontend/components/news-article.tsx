import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { EquipmentPageMark } from "@/components/contact-widget";
import { SectionMapSheet } from "@/components/equipment-catalog-sheet";
import { NewsArrows } from "@/components/news-arrows";
import { NewsPhoto } from "@/components/news-photo";
import { Reveal } from "@/components/reveal";
import { SectionMap } from "@/components/section-map";
import { Block } from "@/components/site-page";
import { Link } from "@/i18n/navigation";
import { newsDate } from "@/lib/news-date";
import { toneClass } from "@/lib/news-tones";
import { loadNewsMap, type SitePageData, type TextBlock } from "@/lib/site-pages";

// Page of one news item (claude/news-page-design.md), in two columns like an equipment page:
// on top the breadcrumbs, the topic and the date, the title; on the left the main photo (not
// over the whole screen) and the blocks of the page builder, the text in a reading column;
// on the right the map "News by topic" (the shared map of a section, the topic of the news open,
// the news itself a dark pill) and under it the contact form that sticks while scrolling.
// Arrows on the sides lead to the newer / older news (components/news-arrows.tsx).
// On phones one column: the map behind the "News by topic" button, the form in the floating
// "Contact" button, the arrows at the bottom.

// Blocks appear when scrolled to; the first ones on the screen one by one
const delay = (index: number) => (index < 3 ? 120 + index * 90 : 0);
const radius: Record<string, number> = { slider: 40, gallery: 28, video: 32, text: 24 };

/** Text of the news: no card around it, a column for reading; the very first paragraph of the
 *  news is the lead (a bit bolder) */
function NewsText({ block, lead }: { block: TextBlock; lead: boolean }) {
  return (
    <section className="max-w-195">
      {block.title && (
        <h2 className="mb-3.5 font-heading tracking-[-0.02em] text-[28px] leading-[1.1] font-extrabold text-ink max-[820px]:text-[23px]">{block.title}</h2>
      )}
      <div
        data-reveal-kids
        className={`rich text-[17.5px] max-[820px]:text-base ${lead ? "[&>p:first-child]:font-bold [&>p:first-child]:text-ink" : ""}`}
        // Non-breaking spaces of copied text would not wrap on a phone (see site-page.tsx)
        dangerouslySetInnerHTML={{ __html: block.html.replace(/&nbsp;|\u00a0/g, " ") }}
      />
    </section>
  );
}

export async function NewsArticle({ page, href }: { page: SitePageData; href: string }) {
  const locale = await getLocale();
  const t = await getTranslations("News");
  const map = await loadNewsMap(locale, href);
  const crumbs = [{ title: t("title"), href: "/news" }, { title: page.title }];
  const allNews = { title: t("allNews"), href: "/news" };
  const firstText = page.blocks.findIndex((block) => block.type === "text");
  const shift = page.image ? 1 : 0;

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      {/* The floating "Contact us" button hides on large screens: the form is on the right */}
      <EquipmentPageMark name="" />
      <Breadcrumbs items={crumbs} />
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 motion-safe:animate-fade-up motion-safe:[animation-delay:40ms]">
        {/* Back to the list of all news */}
        <Link
          href="/news"
          className="group inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 py-1.25 pr-3.5 pl-2.5 text-xs font-extrabold text-brand transition-colors hover:bg-white"
        >
          <ArrowLeft size={15} strokeWidth={2.6} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-0.5" />
          {t("back")}
        </Link>
        {page.topic_title && page.topic_href && (
          <Link
            href={page.topic_href}
            className={`rounded-full px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] transition-[filter] hover:brightness-96 ${toneClass(page.topic_tone)}`}
          >
            {page.topic_title}
          </Link>
        )}
        {page.date && (
          <time dateTime={page.date} className="text-xs font-extrabold tracking-[1px] text-steel uppercase">
            {newsDate(page.date, locale)}
          </time>
        )}
      </div>
      <h1 className="mb-5.5 font-heading text-[31px] leading-[1.08] font-extrabold tracking-[-0.02em] text-ink motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[25px]">
        {page.title}
      </h1>

      <SectionMapSheet categories={map} current={href} title={t("byTopic")} topLink={allNews} />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-10 max-[1100px]:grid-cols-[minmax(0,1fr)_300px] max-[1100px]:gap-7 max-[820px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-8 max-[820px]:gap-5.5">
          {page.image && (
            <Reveal delay={120} radius={32}>
              <NewsPhoto image={page.image} alt={page.title} />
            </Reveal>
          )}
          {page.blocks.map((block, index) => (
            <Reveal key={block.id} delay={delay(index + shift)} radius={radius[block.type] ?? 32} className="min-w-0">
              {block.type === "text" ? (
                <NewsText block={block} lead={index === firstText} />
              ) : (
                <Block block={block} compact title={page.title} />
              )}
            </Reveal>
          ))}
          <NewsArrows newer={page.newer} older={page.older} />
          <Link href="/news" className="group inline-flex items-center gap-2 self-start text-[15px] font-extrabold text-brand motion-safe:animate-fade-up">
            <ArrowLeft size={18} strokeWidth={2.6} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1" />
            {t("allNews")}
          </Link>
        </div>

        {/* Right column: as tall as the left one, nothing with overflow or transform around the
            sticky form, or it would not stick (the same as on equipment pages) */}
        <aside className="flex min-w-0 flex-col gap-6 max-[820px]:hidden">
          {map.length > 0 && (
            <Reveal delay={150} radius={30} className="reveal-side">
              <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] px-4.5 pt-5 pb-3.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.09)]">
                <SectionMap categories={map} current={href} title={t("byTopic")} topLink={allNews} />
              </div>
            </Reveal>
          )}
          <div className="sticky top-6">
            <Reveal delay={350} radius={30}>
              <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.16)]">
                <ContactForm variant="page" heading="contact" page={href} />
              </div>
            </Reveal>
          </div>
        </aside>
      </div>
    </main>
  );
}
