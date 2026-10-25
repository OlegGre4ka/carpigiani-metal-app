"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type MouseEvent } from "react";

import { NewsGrid } from "@/components/news-cards";
import { Spinner } from "@/components/cone-loader";
import { Link } from "@/i18n/navigation";
import type { NewsCard, NewsListData } from "@/lib/site-pages";

// "Show more" under the news and "Shown 13 of 35": the next news come under the ones already on
// the page. The button is also a plain link to the next page (/news?page=2), so search engines
// and visitors without JavaScript still reach all news.

const BATCH = 12;

export function NewsMore({
  shown,
  total,
  topic,
  nextHref,
}: {
  /** How many news are on the page already (counted from the newest) */
  shown: number;
  total: number;
  /** Address of the topic of the page (only its news) */
  topic?: string;
  /** The next page of the list, for search engines */
  nextHref: string;
}) {
  const t = useTranslations("News");
  const locale = useLocale();
  const [more, setMore] = useState<NewsCard[]>([]);
  const [count, setCount] = useState(shown);
  const [all, setAll] = useState(total);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function load(event: MouseEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const query = new URLSearchParams({ lang: locale === "en" ? "en" : "uk", offset: String(count), limit: String(BATCH) });
      if (topic) query.set("topic", topic);
      const response = await fetch(`/api/pages/news?${query}`);
      if (!response.ok) throw new Error("not loaded");
      const data = (await response.json()) as NewsListData;
      setMore((list) => [...list, ...data.items]);
      setCount((n) => n + data.items.length);
      setAll(data.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {more.length > 0 && (
        <div className="mt-6 max-[820px]:mt-3.5">
          <NewsGrid items={more} />
        </div>
      )}
      {all > 0 && (
        <div className="mt-9 flex flex-col items-center gap-3.5 max-[820px]:mt-7">
          {count < all && (
            <Link
              href={nextHref}
              onClick={load}
              aria-busy={loading}
              className="btn-shine inline-flex items-center gap-2.5 rounded-full border border-ink/18 bg-white px-8.5 py-3.75 text-[15px] font-extrabold text-ink shadow-[0_8px_20px_rgb(var(--shadow-rgb)/0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgb(var(--shadow-rgb)/0.16)]"
            >
              {loading && <Spinner dark />}
              {t("showMore")}
            </Link>
          )}
          {failed && <p role="alert" className="text-sm font-bold text-danger-ink">{t("loadFailed")}</p>}
          <p className="text-[13px] font-bold text-hint" aria-live="polite">
            {t("shown", { shown: count, total: all })}
          </p>
        </div>
      )}
    </>
  );
}
