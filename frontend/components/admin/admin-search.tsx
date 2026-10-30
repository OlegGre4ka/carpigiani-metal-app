"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAdminCall } from "./admin-fetch";
import { AdminMark } from "@/components/brand-logo";
import { Lit } from "@/components/site-search";

// Search in the admin panel (30.10, Oleh): the same as the search of the site
// (components/site-search.tsx), but over everything, hidden things too, and a result opens its
// screen in the admin panel. Under each title: where it is ("Carpigiani › Італійське морозиво ›
// Апарати"), so a model deep inside a brand is found at once. Opens with the button in the top
// bar, "/" or Ctrl+K. Data: GET /api/admin/search (backend/app/routers/search_router.py).

type Found = {
  group: "equipment" | "subcategories" | "categories" | "brands" | "news" | "topics";
  title: string;
  href: string;
  where: string;
  image: string | null;
  hidden: boolean;
  snippet: string;
};

const GROUPS: { key: Found["group"]; title: string }[] = [
  { key: "equipment", title: "Обладнання" },
  { key: "subcategories", title: "Підкатегорії" },
  { key: "categories", title: "Категорії" },
  { key: "brands", title: "Виробники" },
  { key: "news", title: "Новини" },
  { key: "topics", title: "Теми новин" },
];

export function AdminSearch() {
  const router = useRouter();
  const call = useAdminCall();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; items: Found[] }>({ q: "", items: [] });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // "/" or Ctrl+K opens the search (not while typing somewhere)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // The browser's autofill sends key events without a key (30.10: it broke here)
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      const typing = event.target instanceof Element && event.target.closest("input, textarea, [contenteditable=true]");
      if ((key === "/" && !typing) || (key === "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const scroll = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = scroll;
    };
  }, [open]);

  // Results while typing, from the 2nd letter
  const q = query.trim();
  useEffect(() => {
    if (!open || q.length < 2) return;
    const control = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await call(`/api/admin/search?${new URLSearchParams({ q, limit: "40" })}`, { signal: control.signal });
        if (response.ok) setResult({ q, items: ((await response.json()) as { items: Found[] }).items });
      } catch {
        // aborted or offline: the old results stay
      } finally {
        if (!control.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      control.abort();
      clearTimeout(timer);
    };
  }, [q, open, call]);

  const groups = useMemo(() => {
    const items = q.length < 2 ? [] : result.items;
    return GROUPS.map((g) => ({ ...g, items: items.filter((i) => i.group === g.key) })).filter((g) => g.items.length);
  }, [q, result]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const close = () => {
    setOpen(false);
    setActive(0);
  };
  const go = (item: Found) => {
    close();
    router.push(item.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") close();
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      go(flat[active]);
    }
  };

  let index = -1;
  const panel = open
    ? createPortal(
        <div className="fixed inset-0 z-1000" onKeyDown={onKeyDown}>
          <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-[rgb(var(--navbar-rgb)/0.45)] backdrop-blur-[3px]" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Пошук в адмін-панелі"
            className="relative mx-auto mt-6 flex max-h-[calc(100dvh-48px)] w-[min(780px,calc(100vw-24px))] flex-col overflow-hidden rounded-[26px] bg-paper shadow-[0_30px_80px_rgb(0_10_40/0.4)] max-[600px]:mt-3"
          >
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
                placeholder="Назва апарата, категорії, новини або слово з тексту…"
                aria-label="Що шукати"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[17px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-hint [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Закрити пошук"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-mist text-navbar transition-colors hover:bg-mist-strong"
              >
                <X aria-hidden="true" className="size-4.5" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-2.5 py-2">
              {q.length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-hint">
                  Шукає по всій адмінці: виробники, категорії, підкатегорії, обладнання, новини — і в назвах, і в текстах сторінок. Приховане теж
                  знаходиться.
                </p>
              ) : flat.length === 0 && !loading && result.q === q ? (
                <div className="px-3 py-8 text-center">
                  <p className="font-extrabold text-navbar">Нічого не знайдено за «{q}»</p>
                  <p className="mt-1 text-sm text-ink-soft">Спробуйте коротше слово або іншу назву.</p>
                </div>
              ) : (
                groups.map((group) => (
                  <section key={group.key} className="mb-1.5">
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">{group.title}</p>
                    {group.items.map((item) => {
                      index += 1;
                      const mine = index;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          onMouseEnter={() => setActive(mine)}
                          data-active={active === mine || undefined}
                          className="group flex items-center gap-3.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-mist data-active:bg-mist"
                        >
                          <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white shadow-[inset_0_0_0_1px_rgb(var(--ink-rgb)/0.08)]">
                            {item.image ? (
                              <Image src={item.image} alt="" fill sizes="48px" className={item.group === "news" ? "object-cover" : "object-contain p-1"} />
                            ) : (
                              <AdminMark className="h-[60%] w-auto opacity-50" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className={`truncate text-[15px] font-extrabold text-navbar ${item.hidden ? "opacity-60" : ""}`}>
                                <Lit text={item.title} query={q} />
                              </span>
                              {item.hidden && (
                                <span className="shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-[11px] font-bold text-ink-soft">приховано</span>
                              )}
                            </span>
                            <span className="block truncate text-xs font-semibold text-steel">{item.where}</span>
                            {item.snippet && (
                              <span className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-ink-soft">
                                <Lit text={item.snippet} query={q} />
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-navbar opacity-0 transition-opacity group-hover:opacity-100 group-data-active:opacity-100"
                          />
                        </Link>
                      );
                    })}
                  </section>
                ))
              )}
            </div>
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
        aria-label="Пошук в адмін-панелі"
        className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-ink/12 bg-white/80 pr-3 pl-3.5 text-sm text-ink-soft transition-colors hover:border-navbar/30 hover:bg-white max-[900px]:size-10 max-[900px]:justify-center max-[900px]:p-0"
      >
        <Search aria-hidden="true" className="size-4.5 text-navbar" />
        <span className="max-[900px]:hidden">Пошук</span>
        <kbd className="rounded-md bg-mist px-1.5 py-0.5 font-sans text-[11px] font-bold text-steel max-[900px]:hidden">/</kbd>
      </button>
      {panel}
    </>
  );
}
