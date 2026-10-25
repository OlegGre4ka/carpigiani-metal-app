"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { scoopArrow } from "@/components/card-styles";
import { Link, useRouter } from "@/i18n/navigation";

// Going from page to page without the list, like the arrows of the quick view of showcases:
// from news to news (the left arrow opens the newer news, the right one the older one, the
// order of /news) and from model to model on equipment pages (the order of its category).
// Large screens: two "ice cream scoops" on the sides of the page, in the middle of the screen,
// with the title of that page on hover (and a small photo of the model). Phones: the two
// arrows at the bottom of the page.
// The keys ← → do the same (not while typing in the form or with a photo open big).

type Neighbour = { href: string; title: string; image?: string | null } | null | undefined;

type Props = {
  prev: Neighbour;
  next: Neighbour;
  prevLabel: string;
  nextLabel: string;
  /** Name of the whole navigation for screen readers */
  navLabel: string;
};

export function PageArrows({ prev, next, prevLabel, nextLabel, navLabel }: Props) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      // A photo shown big or a panel is open: the keys belong to it
      if (document.querySelector('[aria-modal="true"]')) return;
      if (event.key === "ArrowLeft" && prev) router.push(prev.href);
      if (event.key === "ArrowRight" && next) router.push(next.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  if (!prev && !next) return null;

  const arrow = (to: Neighbour, side: "prev" | "next", where: string) => {
    const icon = side === "prev" ? <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" /> : <ChevronRight size={22} strokeWidth={2.4} aria-hidden="true" />;
    const label = side === "prev" ? prevLabel : nextLabel;
    // Nothing on that side: a pale arrow that leads nowhere
    if (!to) {
      return (
        <span role="link" aria-disabled="true" aria-label={label} className={`${scoopArrow} ${where}`}>
          {icon}
        </span>
      );
    }
    return (
      <Link href={to.href} aria-label={`${label}: ${to.title}`} className={`group/arrow ${scoopArrow} ${where}`}>
        {icon}
        {/* The title of that page (and the photo of the model), on hover (large screens) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 flex w-max max-w-72 -translate-y-1/2 items-center gap-3 rounded-2xl bg-ink py-2 text-[13px] leading-snug font-bold text-white opacity-0 shadow-[0_10px_24px_rgb(var(--ink-rgb)/0.25)] transition-[opacity,translate] duration-200 group-hover/arrow:opacity-100 group-focus-visible/arrow:opacity-100 max-[820px]:hidden ${
            to.image ? "pr-3.5 pl-2" : "px-3.5"
          } ${side === "prev" ? "left-full ml-3" : "right-full mr-3"}`}
        >
          {to.image && (
            <span className="relative size-14 flex-none overflow-hidden rounded-xl bg-white">
              <Image src={to.image} alt="" fill sizes="56px" className="object-contain p-1" />
            </span>
          )}
          <span className="min-w-0">
            <span className="mb-0.5 block text-[10.5px] font-extrabold tracking-[1px] text-brand-pale uppercase">{label}</span>
            {to.title}
          </span>
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Large screens: on the sides of the page, next to its content */}
      <nav aria-label={navLabel} className="max-[820px]:hidden">
        {arrow(prev, "prev", "fixed top-1/2 z-40 -translate-y-1/2 left-[max(14px,calc(50vw-706px))]")}
        {arrow(next, "next", "fixed top-1/2 z-40 -translate-y-1/2 right-[max(14px,calc(50vw-706px))]")}
      </nav>
      {/* Phones: at the bottom of the page */}
      <nav aria-label={navLabel} className="hidden items-center justify-between gap-4 max-[820px]:flex">
        <span className="flex items-center gap-2.5 text-[13px] font-extrabold text-brand">
          {arrow(prev, "prev", "relative")}
          {prevLabel}
        </span>
        <span className="flex items-center gap-2.5 text-right text-[13px] font-extrabold text-brand">
          {nextLabel}
          {arrow(next, "next", "relative")}
        </span>
      </nav>
    </>
  );
}

/** News: the newer news on the left, the older one on the right */
export function NewsArrows({ newer, older }: { newer: Neighbour; older: Neighbour }) {
  const t = useTranslations("News");
  return <PageArrows prev={newer} next={older} prevLabel={t("newer")} nextLabel={t("older")} navLabel={t("title")} />;
}

/** Equipment: the model before and after in its category */
export function ModelArrows({ prev, next }: { prev: Neighbour; next: Neighbour }) {
  const t = useTranslations("Equipment");
  return <PageArrows prev={prev} next={next} prevLabel={t("prevModel")} nextLabel={t("nextModel")} navLabel={t("models")} />;
}
