import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { EquipmentPageMark } from "@/components/contact-widget";
import { SectionMark } from "@/components/section-mark";
import { NewsText } from "@/components/news-article";
import { SupportArrows } from "@/components/news-arrows";
import { NewsGrid } from "@/components/news-cards";
import { NewsPhoto } from "@/components/news-photo";
import { Reveal } from "@/components/reveal";
import { Block } from "@/components/site-page";
import { Link } from "@/i18n/navigation";
import { newsDate } from "@/lib/news-date";
import { toneClass } from "@/lib/news-tones";
import type { SitePageData } from "@/lib/site-pages";

// A page of the "Support" menu (4.11): Carpigiani Gelato University, Technologies and any other
// the client adds in the admin panel → "Підтримка". It shows one article of its topic of news
// open (chosen in the admin panel, else the newest), as on a news page: the topic and the date,
// the title, the main photo and the blocks. Right: all the articles of the topic as a menu (the
// open one a dark pill) and the "contact us" card with its own title and text, the form and a
// link to the Contacts page. At the bottom: the other articles of the topic as news cards.

const delay = (index: number) => (index < 3 ? 120 + index * 90 : 0);
const radius: Record<string, number> = { slider: 40, gallery: 28, video: 32, text: 24 };

export async function SupportPage({ page, href }: { page: SitePageData; href: string }) {
  const locale = await getLocale();
  const t = await getTranslations();
  // An article of the topic opened from here stays in "Support" (4.11): ?support=<this page>;
  // the article of the menu item keeps its own address
  const linkOf = (articleHref: string) =>
    articleHref === page.support_home || !page.support_id ? articleHref : `${articleHref}?support=${page.support_id}`;
  const articles = (page.articles ?? []).map((article) => ({ ...article, href: linkOf(article.href) }));
  const open = linkOf(page.main_href ?? "");
  const others = articles.filter((article) => article.href !== open);
  // The arrows on the sides: the newer and the older article of the topic (as on news pages)
  const at = articles.findIndex((article) => article.href === open);
  const newer = at > 0 ? articles[at - 1] : null;
  const older = at >= 0 && at < articles.length - 1 ? articles[at + 1] : null;
  const firstText = page.blocks.findIndex((block) => block.type === "text");
  const shift = page.image ? 1 : 0;

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      {/* The form is on the right: the floating "Contact us" button hides on large screens */}
      <EquipmentPageMark name="" />
      {/* "Support" stays lit in the menu, also on an article that is one of the news */}
      <SectionMark section="support" />
      <Breadcrumbs
        items={[
          { title: t("Nav.support") },
          // The name of the page leads to its first article, unless that one is open
          { title: page.section_title || page.title, href: page.support_home && page.support_home !== page.main_href ? page.support_home : undefined },
          ...(page.support_home && page.support_home !== page.main_href ? [{ title: page.title }] : []),
        ]}
      />
      {(page.topic_title || page.date) && (
        <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 motion-safe:animate-fade-up motion-safe:[animation-delay:40ms]">
          {page.topic_title &&
            (page.topic_href ? (
              <Link
                href={page.topic_href}
                className={`rounded-full px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] transition-[filter] hover:brightness-96 ${toneClass(page.topic_tone)}`}
              >
                {page.topic_title}
              </Link>
            ) : (
              <span className={`rounded-full px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] ${toneClass(page.topic_tone)}`}>
                {page.topic_title}
              </span>
            ))}
          {page.date && (
            <time dateTime={page.date} className="text-xs font-extrabold tracking-[1px] text-steel uppercase">
              {newsDate(page.date, locale)}
            </time>
          )}
        </div>
      )}
      <h1 className="mb-5.5 w-fit max-w-full font-heading text-[33px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[25px]">
        {page.title}
      </h1>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-10 max-[1100px]:grid-cols-[minmax(0,1fr)_300px] max-[1100px]:gap-7 max-[820px]:grid-cols-1">
        {/* The open article, as on its news page */}
        <div className="flex min-w-0 flex-col gap-8 max-[820px]:gap-5.5">
          {page.image && (
            <Reveal delay={120} radius={32}>
              <NewsPhoto image={page.image} alt={page.title} />
            </Reveal>
          )}
          {page.blocks.map((block, index) => (
            <Reveal key={block.id} delay={delay(index + shift)} radius={radius[block.type] ?? 32} className="min-w-0">
              {block.type === "text" ? <NewsText block={block} lead={index === firstText} /> : <Block block={block} compact title={page.title} />}
            </Reveal>
          ))}
          {/* From article to article of the topic, as on news pages */}
          <SupportArrows
            newer={newer ? { href: newer.href, title: newer.title } : null}
            older={older ? { href: older.href, title: older.title } : null}
          />
        </div>

        {/* Right column: as tall as the left one, nothing with a transform around the sticky card */}
        <aside className="flex min-w-0 flex-col gap-6">
          {articles.length > 1 && (
            <Reveal delay={150} radius={30} className="reveal-side">
              <nav
                aria-label={t("SupportPage.articles")}
                className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] px-4.5 pt-5 pb-3.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.09)]"
              >
                <p className="mb-2 px-1.5 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">
                  {page.topic_title ? t("SupportPage.articlesOf", { topic: page.topic_title }) : t("SupportPage.articles")}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {articles.map((article) => {
                    return (
                      <li key={article.href}>
                        {article.href === open ? (
                          // The article open on this page: a dark pill, as in the menu of news
                          <span aria-current="page" className="flex items-start gap-2 rounded-[14px] bg-navbar px-3 py-2 text-[14px] leading-snug font-bold text-white">
                            <span aria-hidden="true" className="mt-1.75 size-1.5 shrink-0 rounded-full bg-sky" />
                            <span className="min-w-0">{article.title}</span>
                          </span>
                        ) : (
                          <Link
                            href={article.href}
                            className="group flex items-start gap-2 rounded-[14px] px-1.5 py-2 text-[14px] leading-snug font-bold text-navbar transition-colors hover:bg-mist"
                          >
                            <ArrowRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                            <span className="min-w-0">{article.title}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Reveal>
          )}
          <div className="sticky top-6">
            <Reveal delay={350} radius={30}>
              <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.16)]">
                <ContactForm
                  variant="page"
                  heading="contact"
                  page={href}
                  subject={page.section_title || page.title}
                  customTitle={page.contact_title || undefined}
                  customText={page.contact_text || undefined}
                />
                <Link
                  href="/contacts"
                  className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-extrabold text-navbar hover:underline"
                >
                  {t("SupportPage.toContacts")}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </aside>
      </div>

      {/* The other articles of the topic, as news cards (no title over them, 4.11) */}
      {others.length > 0 && (
        <section aria-label={t("SupportPage.articles")} className="mt-16 max-[820px]:mt-10">
          <NewsGrid items={others} />
        </section>
      )}
    </main>
  );
}
