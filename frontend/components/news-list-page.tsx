import { getLocale, getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { chip } from "@/components/card-styles";
import { NewsGrid } from "@/components/news-cards";
import { NewsMore } from "@/components/news-more";
import { Link, redirect } from "@/i18n/navigation";
import { loadNews } from "@/lib/site-pages";

// List of news (claude/news-page-design.md): /news and the page of a topic
// (/news/content/5-interesting, its address is typed by the client). The title and the chips
// "All" + topics in one line (each chip is a link to its page), the newest news big, the next
// ones in a compact grid of three: the newest one takes two columns of the first row, the next
// one stands next to it. "Show more" and "Shown 14 of 35" under them.
// The first page has 14 news (the first row of 2 and four rows of 3); /news?page=2 ... (for
// search engines and old links) show the next 12 each.

const FIRST = 14;
const BATCH = 12;

export async function NewsListPage({ page, topicHref }: { page: number; topicHref?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("News");
  const offset = page > 1 ? FIRST + (page - 2) * BATCH : 0;
  const data = await loadNews(locale, offset, page > 1 ? BATCH : FIRST, topicHref);
  const base = topicHref ?? "/news";
  // A page past the last one (e.g. news were deleted): the first page
  if (page > 1 && data.items.length === 0) redirect({ href: base, locale });

  const title = data.topic?.title ?? t("title");
  const crumbs = topicHref ? [{ title: t("title"), href: "/news" }, { title }] : [{ title }];
  const [first, ...rest] = data.items;
  const featured = page === 1 ? first : undefined;
  const grid = featured ? rest : data.items;

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      <Breadcrumbs items={crumbs} />
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 max-[820px]:mb-4">
        <h1 className="font-heading text-[40px] leading-[1.08] font-bold tracking-[-0.4px] text-caramel motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[30px]">
          {title}
        </h1>
        {data.topics.length > 0 && (
          // On phones the chips are one line that scrolls sideways
          <div
            role="group"
            aria-label={t("filter")}
            className="flex flex-wrap gap-2 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:-mx-4 max-[820px]:w-[calc(100%+32px)] max-[820px]:flex-nowrap max-[820px]:overflow-x-auto max-[820px]:px-4 max-[820px]:pb-1 max-[820px]:[scrollbar-width:none] max-[820px]:[&::-webkit-scrollbar]:hidden"
          >
            <Link href="/news" aria-current={!topicHref ? "page" : undefined} className={chip(!topicHref)}>
              {t("all")}
            </Link>
            {data.topics.map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                aria-current={topic.href === topicHref ? "page" : undefined}
                className={chip(topic.href === topicHref)}
              >
                {topic.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      {data.items.length === 0 ? (
        <p className="rounded-[32px] border border-white/90 bg-white/70 px-8 py-12 text-center text-lg text-cocoa-soft shadow-[0_14px_40px_rgba(90,60,40,0.08)] motion-safe:animate-fade-up">
          {topicHref ? t("emptyTopic") : t("empty")}
        </p>
      ) : (
        <>
          <NewsGrid items={grid} featured={featured} />
          {/* The key starts it again when another topic or page is opened */}
          <NewsMore
            key={`${base}-${page}`}
            shown={offset + data.items.length}
            total={data.total}
            topic={topicHref}
            nextHref={`${base}?page=${page + 1}`}
          />
        </>
      )}
    </main>
  );
}
