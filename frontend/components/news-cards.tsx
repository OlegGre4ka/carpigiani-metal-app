"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Reveal } from "@/components/reveal";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand-logo";
import { newsDate } from "@/lib/news-date";
import { toneClass } from "@/lib/news-tones";
import type { NewsCard, NewsTopicLink } from "@/lib/site-pages";

// Cards of news (claude/news-page-design.md): one big "main" news (the newest) and a compact
// grid three in a row under it; on phones the grid becomes compact rows with a square photo.
// The whole card leads to the news; the topic label inside it leads to its topic.
// Every card opens on scroll (components/reveal.tsx), the cards of a row one after another.

/** Label of the topic (a link to its page), in the colour of the topic */
export function NewsTag({ topic, className = "", onNavy = false }: { topic: NewsTopicLink; className?: string; onNavy?: boolean }) {
  // On the navy home page (mockup): see-through blue or white labels, by turns
  const look = onNavy
    ? `border ${topic.tone % 2 ? "border-white/28 bg-white/10 text-[#e3e8ed]" : "border-[var(--navy-tag-line)] bg-[var(--navy-tag-bg)] text-[var(--navy-tag-ink)]"} hover:brightness-120`
    : `${toneClass(topic.tone)} hover:brightness-96`;
  return (
    <Link
      href={topic.href}
      className={`relative z-1 inline-block rounded-full px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] transition-[filter] ${look} ${className}`}
    >
      {topic.title}
    </Link>
  );
}

/** Topic label and the date in one line */
export function NewsMeta({
  topic,
  date,
  className = "",
  onNavy = false,
}: {
  topic: NewsTopicLink | null;
  date: string;
  className?: string;
  onNavy?: boolean;
}) {
  const locale = useLocale();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {topic && <NewsTag topic={topic} onNavy={onNavy} />}
      <time dateTime={date} className={`text-xs font-extrabold tracking-[1px] uppercase ${onNavy ? "text-[var(--navy-tag-ink)]" : "text-steel"}`}>
        {newsDate(date, locale)}
      </time>
    </div>
  );
}

/** No photo yet: the brand mark, softly */
function NoPhoto() {
  return (
    <BrandMark className="absolute top-1/2 left-1/2 h-[42%] w-auto -translate-1/2 opacity-25" />
  );
}

/** The link over the whole card (the topic label stays above it) */
const stretched =
  "after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-brand";

/** The newest news, big: two of the three columns of the first row (the next news stands in the
 *  third one), the photo on the left, the text on the right; one under the other on phones */
export function FeaturedNews({ item }: { item: NewsCard }) {
  const t = useTranslations("News");
  return (
    <Reveal radius={36} className="h-full">
      <article className="group relative grid h-full min-h-85 grid-cols-[1.1fr_1fr] overflow-hidden rounded-[36px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] shadow-[0_18px_50px_rgb(var(--shadow-rgb)/0.1)] transition duration-350 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgb(var(--shadow-rgb)/0.16)] max-[820px]:min-h-0 max-[820px]:grid-cols-1 max-[820px]:rounded-[28px]">
        <div className="relative overflow-hidden bg-mist max-[820px]:aspect-[16/10]">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              loading="eager"
              sizes="(max-width: 820px) 100vw, 520px"
              className="object-cover transition-transform duration-800 group-hover:scale-105"
            />
          ) : (
            <NoPhoto />
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3 px-8 py-8 max-[820px]:px-5 max-[820px]:pt-5 max-[820px]:pb-6">
          <NewsMeta topic={item.topic} date={item.date} />
          <h2 className="line-clamp-3 font-heading tracking-[-0.02em] text-[26px] leading-[1.06] font-extrabold text-ink max-[820px]:text-[23px]">
            <Link href={item.href} className={`${stretched} after:rounded-[36px] max-[820px]:after:rounded-[28px]`}>
              {item.title}
            </Link>
          </h2>
          {item.summary && <p className="line-clamp-3 text-base leading-relaxed text-body max-[820px]:text-[15px]">{item.summary}</p>}
          {/* A real link of its own: the button stands above the link of the whole card
              (btn-shine makes it a positioned box), so it has to lead to the news itself */}
          <Link
            href={item.href}
            tabIndex={-1}
            className="btn-shine relative z-1 inline-flex items-center gap-2 self-start rounded-full bg-[image:var(--grad-btn)] px-6 py-3.25 text-sm font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.28)] transition hover:brightness-108"
          >
            {t("readMore")}
            <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

/** Grid of compact cards, three in a row (two on tablets); on phones one compact row each.
 *  featured: the newest news takes two columns of the first row (the whole row on tablets).
 *  onNavy: on the navy home page (mockup): blue cards with a thin metal rim. */
export function NewsGrid({ items, featured, onNavy = false }: { items: NewsCard[]; featured?: NewsCard; onNavy?: boolean }) {
  const t = useTranslations("News");
  return (
    <ul className="grid grid-cols-3 gap-6 max-[1100px]:grid-cols-2 max-[820px]:grid-cols-1 max-[820px]:gap-3.5">
      {featured && (
        <li className="col-span-2 min-w-0 max-[820px]:col-span-1">
          <FeaturedNews item={featured} />
        </li>
      )}
      {items.map((item, index) => (
        <li key={item.id} className="min-w-0">
          {/* The cards of a row open one after another */}
          <Reveal delay={((index + (featured ? 2 : 0)) % 3) * 90} radius={28} className="h-full">
            <article
              className={`group relative flex h-full flex-col rounded-[28px] p-3.5 transition duration-350 hover:-translate-y-1.25 max-[820px]:flex-row ${
                onNavy
                  ? "navy-card pb-6 hover:shadow-[0_28px_60px_rgb(0_10_50/0.6)] max-[820px]:pb-2.5"
                  : "border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] shadow-[0_12px_32px_rgb(var(--shadow-rgb)/0.08)] hover:shadow-[0_22px_46px_rgb(var(--shadow-rgb)/0.15)]"
              } max-[820px]:gap-3.5 max-[820px]:rounded-[22px] max-[820px]:p-2.5`}
            >
              <div className={`relative overflow-hidden rounded-[20px] max-[820px]:aspect-square ${onNavy ? "aspect-[4/3] bg-[var(--navy-photo)]" : "aspect-[16/10] bg-mist"} max-[820px]:w-28 max-[820px]:flex-none max-[820px]:rounded-2xl`}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 820px) 112px, (max-width: 1100px) 50vw, 420px"
                    className="object-cover transition-transform duration-700 group-hover:scale-106"
                  />
                ) : (
                  <NoPhoto />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <NewsMeta topic={item.topic} date={item.date} onNavy={onNavy} className="mx-1.5 mt-3.5 mb-2 max-[820px]:mx-0 max-[820px]:mt-0.5 max-[820px]:mb-1.5" />
                <h3 className={`mx-1.5 mb-1.5 line-clamp-2 text-[19px] leading-[1.3] font-extrabold max-[820px]:mx-0 ${onNavy ? "text-white" : "text-ink"} max-[820px]:mb-0 max-[820px]:text-base`}>
                  <Link href={item.href} className={`${stretched} after:rounded-[28px] max-[820px]:after:rounded-[22px]`}>
                    {item.title}
                  </Link>
                </h3>
                {item.summary && (
                  <p className={`mx-1.5 mb-3 line-clamp-2 leading-normal max-[820px]:mx-0 ${onNavy ? "text-[15px] text-on-dark-soft" : "text-sm text-ink-soft"} max-[820px]:mt-1 max-[820px]:mb-0 max-[820px]:text-[13px]`}>
                    {item.summary}
                  </p>
                )}
                <span aria-hidden="true" className={`mx-1.5 mt-auto mb-1 inline-flex items-center gap-1.5 font-extrabold max-[820px]:hidden ${onNavy ? "text-[14.5px] text-sky" : "text-sm text-brand"}`}>
                  {t("readMore")}
                  <ArrowRight size={16} strokeWidth={2.6} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
