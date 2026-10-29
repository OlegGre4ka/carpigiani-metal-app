"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { GROUPS, ResultRow, useSearch, type SearchItem } from "@/components/site-search";
import { usePathname, useRouter } from "@/i18n/navigation";
import { chip } from "@/components/card-styles";

/** All results (/search?q=…): the field, chips by group and the full list (the title and the
 *  breadcrumbs are drawn by the page itself, app/[locale]/search/page.tsx) */
export function SearchPage() {
  const t = useTranslations("Search");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = params.get("q") ?? "";
  const [query, setQuery] = useState(fromUrl);
  const [group, setGroup] = useState<SearchItem["group"] | "">("");
  const { items, total, loading, q } = useSearch(query, 200);

  // Keep the address in step with the field (so the page can be shared)
  useEffect(() => {
    const word = query.trim();
    if (word === fromUrl) return;
    const timer = window.setTimeout(() => router.replace(word ? `${pathname}?q=${encodeURIComponent(word)}` : pathname), 400);
    return () => clearTimeout(timer);
  }, [query, fromUrl, pathname, router]);

  const present = GROUPS.filter((g) => items.some((i) => i.group === g));
  const shown = group ? items.filter((i) => i.group === group) : items;

  return (
    <div className="mx-auto max-w-200">
        <label className="flex items-center gap-3 rounded-full border border-white/90 bg-paper px-5 py-3 shadow-[0_14px_36px_rgb(var(--shadow-rgb)/0.12)]">
          <Search aria-hidden="true" className="size-5 shrink-0 text-navbar" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-hint"
          />
        </label>

        {q && total > 0 && (
          <div role="group" aria-label={t("filter")} className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setGroup("")} className={chip(group === "")}>
              {t("everything")} · {total}
            </button>
            {present.map((g) => (
              <button key={g} type="button" onClick={() => setGroup(g)} className={chip(group === g)}>
                {t(`groups.${g}`)} · {items.filter((i) => i.group === g).length}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-[28px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] p-2.5 shadow-[0_18px_44px_rgb(var(--shadow-rgb)/0.12)]">
          {query.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-hint">{t("hint")}</p>
          ) : shown.length === 0 && !loading && q ? (
            <div className="px-3 py-10 text-center">
              <p className="font-extrabold text-navbar">{t("nothing", { q: query.trim() })}</p>
              <p className="mt-1 text-sm text-ink-soft">{t("nothingHint")}</p>
            </div>
          ) : (
            shown.map((item) => <ResultRow key={`${item.group}${item.href}`} item={item} query={query} />)
          )}
        </div>
    </div>
  );
}
