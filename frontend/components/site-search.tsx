"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-logo";
import { Link, useRouter } from "@/i18n/navigation";

// Search over the site (29.10): the magnifier in the header opens a panel at the top of the
// screen (also the "/" key); results come while typing, from the 2nd letter, grouped
// (equipment, showcases, categories, brand pages, news), titles first, then texts with the
// piece of text around the word. Arrows move through them, Enter opens, Esc closes.
// "All results" leads to /search?q=… (the full list, can be shared by a link).
// Data: GET /api/search (backend/app/routers/search_router.py).

export type SearchItem = {
  group: "equipment" | "showcases" | "categories" | "brands" | "news";
  title: string;
  href: string;
  image: string | null;
  snippet: string;
  in_title: boolean;
};

export const GROUPS: SearchItem["group"][] = ["equipment", "showcases", "categories", "brands", "news"];

/** The typed words lit in a text */
export function Lit({ text, query }: { text: string; query: string }) {
  const word = query.trim();
  if (word.length < 2) return <>{text}</>;
  const parts: ReactNode[] = [];
  const low = text.toLowerCase();
  const w = word.toLowerCase();
  let from = 0;
  for (let at = low.indexOf(w); at >= 0; at = low.indexOf(w, from)) {
    parts.push(text.slice(from, at), <mark key={at} className="search-mark">{text.slice(at, at + w.length)}</mark>);
    from = at + w.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}

/** Results of the search for a query (debounced while typing) */
export function useSearch(query: string, limit: number) {
  const locale = useLocale();
  const [state, setState] = useState<{ q: string; items: SearchItem[]; total: number; loading: boolean }>({ q: "", items: [], total: 0, loading: false });
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const control = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const params = new URLSearchParams({ q, lang: locale, limit: String(limit) });
        const response = await fetch(`/api/search?${params}`, { signal: control.signal });
        const data = (await response.json()) as { items: SearchItem[]; total: number };
        setState({ q, items: data.items, total: data.total, loading: false });
      } catch {
        if (!control.signal.aborted) setState((s) => ({ ...s, loading: false }));
      }
    }, 220);
    return () => {
      control.abort();
      clearTimeout(timer);
    };
  }, [query, limit, locale]);
  const short = query.trim().length < 2;
  return short ? { q: "", items: [], total: 0, loading: false } : state;
}

/** One result: a small photo (or the mark), the title and the piece of text */
export function ResultRow({ item, query, active = false, onPick }: { item: SearchItem; query: string; active?: boolean; onPick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onPick}
      data-active={active || undefined}
      className="search-row group flex items-center gap-3.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-mist data-active:bg-mist"
    >
      <span className="relative flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white shadow-[inset_0_0_0_1px_rgb(var(--ink-rgb)/0.08)]">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="52px" className={item.group === "news" ? "object-cover" : "object-contain p-1"} />
        ) : (
          <BrandMark className="h-[62%] w-auto opacity-60" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold text-navbar">
          <Lit text={item.title} query={query} />
        </span>
        {item.snippet && (
          <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">
            <Lit text={item.snippet} query={query} />
          </span>
        )}
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-navbar opacity-0 transition-opacity group-hover:opacity-100 group-data-active:opacity-100" />
    </Link>
  );
}

/** The magnifier button of the header and its panel. shortcut: the "/" key opens it */
export function SiteSearch({ shortcut = false, className = "" }: { shortcut?: boolean; className?: string }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { items, total, loading, q } = useSearch(open ? query : "", 8);

  // In the order of the groups, so the arrows go down the list as it is shown
  const groups = useMemo(() => GROUPS.map((g) => ({ group: g, items: items.filter((i) => i.group === g) })).filter((g) => g.items.length), [items]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !open && !target.closest("input, textarea, [contenteditable=true]")) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, open]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const scroll = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = scroll;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setActive(0);
  };
  const all = () => {
    const word = query.trim();
    if (word.length < 2) return;
    close();
    router.push(`/search?q=${encodeURIComponent(word)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") close();
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = flat[active];
      if (picked) {
        close();
        router.push(picked.href);
      } else all();
    }
  };

  let index = -1;
  const panel = open
    ? createPortal(
        <div className="fixed inset-0 z-90" onKeyDown={onKeyDown}>
          <div aria-hidden="true" onClick={close} className="scrim-in absolute inset-0 bg-[rgb(var(--navbar-rgb)/0.55)] backdrop-blur-[3px]" />
          <div role="dialog" aria-modal="true" aria-label={t("title")} className="search-panel relative mx-auto mt-6 flex max-h-[calc(100dvh-48px)] w-[min(760px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] bg-paper shadow-[0_30px_80px_rgb(0_10_40/0.45)] max-[820px]:mt-3 max-[820px]:max-h-[calc(100dvh-24px)] max-[820px]:rounded-[22px]">
            <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-3.5">
              <Search aria-hidden="true" className="size-5 shrink-0 text-navbar" />
              <input
                ref={input}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[17px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-hint [&::-webkit-search-cancel-button]:hidden"
              />
              <button type="button" onClick={close} aria-label={t("close")} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist text-navbar transition-colors hover:bg-mist-strong">
                <X aria-hidden="true" className="size-4.5" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-2.5 py-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-hint">{t("hint")}</p>
              ) : flat.length === 0 && !loading && q ? (
                <div className="px-3 py-8 text-center">
                  <p className="font-extrabold text-navbar">{t("nothing", { q: query.trim() })}</p>
                  <p className="mt-1 text-sm text-ink-soft">{t("nothingHint")}</p>
                </div>
              ) : (
                groups.map(({ group, items: list }) => (
                  <section key={group} className="mb-1.5">
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">{t(`groups.${group}`)}</p>
                    {list.map((item) => {
                      index += 1;
                      const mine = index;
                      return (
                        <div key={`${item.group}${item.href}`} onMouseEnter={() => setActive(mine)}>
                          <ResultRow item={item} query={query} active={active === mine} onPick={close} />
                        </div>
                      );
                    })}
                  </section>
                ))
              )}
            </div>

            {total > 0 && (
              <button type="button" onClick={all} className="flex items-center justify-center gap-2 border-t border-ink/8 px-5 py-3.5 text-sm font-extrabold text-navbar transition-colors hover:bg-mist">
                {t("all", { count: total })}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ${className}`}
      >
        <Search aria-hidden="true" className="size-4.5" />
      </button>
      {panel}
    </>
  );
}
