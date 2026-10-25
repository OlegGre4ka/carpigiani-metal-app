"use client";

import { useTranslations } from "next-intl";
import { useState, type CSSProperties, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { EquipmentMapCategory } from "@/lib/site-pages";

// "Map of a section" in the right column of a page: groups that open like an accordion
// (categories of equipment / showcases, topics of news), inside them small headings and the
// items. The group of the open page is open and the page itself is a dark pill. Built from the
// database. The same look for equipment, showcases and news, only the data differ.
// The same list is in the right column (large screens) and in the panel from the bottom
// (phones). Design: claude/equipment-page-design.md, news-page-design.md;
// motion: equipment-page-animation.md.

export function SectionMap({
  categories,
  current,
  title,
  header,
  topLink,
  onNavigate,
}: {
  categories: EquipmentMapCategory[];
  /** Address of the page that is open now ("/maestro", "/230500-back-to-roots") */
  current: string;
  /** Name of the map, for screen readers (and the heading, when no header is given) */
  title: string;
  /** Top of the card: the brand logo and the name; null: no top (the panel on phones has its own) */
  header?: ReactNode | null;
  /** A link above the groups ("All news →") */
  topLink?: { title: string; href: string };
  onNavigate?: () => void;
}) {
  // Only the map of news shortens its groups ("All in the topic (9) →")
  const t = useTranslations("News");
  const hasCurrent = (category: EquipmentMapCategory) =>
    category.groups.some((group) => group.items.some((item) => item.href === current));
  const [open, setOpen] = useState<string[]>(() => categories.filter(hasCurrent).map((c) => c.href));

  return (
    <nav aria-label={title}>
      {header !== null && (
        <div className="mb-1.5 border-b border-ink/10 px-1.5 pb-3">
          {header ?? <b className="block px-1 font-heading tracking-[-0.02em] text-xl leading-none font-extrabold text-ink">{title}</b>}
        </div>
      )}
      {topLink && (
        <Link
          href={topLink.href}
          onClick={onNavigate}
          className="group mb-0.5 flex items-center gap-1.5 rounded-[14px] px-2 py-2 text-sm font-extrabold text-brand transition-colors hover:bg-[rgb(var(--mist-rgb)/0.5)]"
        >
          {topLink.title}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
      {categories.map((category) => {
        const expanded = open.includes(category.href);
        const count = category.count ?? category.groups.reduce((sum, group) => sum + group.items.length, 0);
        const shown = category.groups.reduce((sum, group) => sum + group.items.length, 0);
        const bodyId = `map-${category.href.replace(/\W+/g, "-")}`;
        let index = 0;
        return (
          <div key={category.href} className="border-b border-ink/8 last:border-b-0">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={() => setOpen((list) => (expanded ? list.filter((h) => h !== category.href) : [...list, category.href]))}
              className={`flex w-full items-center justify-between gap-2 rounded-[14px] px-2 py-2.75 text-left text-[15px] font-extrabold transition-colors hover:bg-[rgb(var(--mist-rgb)/0.5)] ${
                expanded ? "text-brand" : "text-ink"
              }`}
            >
              <span>
                {category.title}
                <em className="ml-1.5 text-xs font-bold text-steel not-italic">{count}</em>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`shrink-0 stroke-brand transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {/* Opens smoothly in height (grid rows 0fr → 1fr) */}
            <div
              id={bodyId}
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className={`min-h-0 overflow-hidden ${expanded ? "map-open" : ""}`} inert={!expanded}>
                <div className={`pb-2 ${shown > 12 ? "max-h-105 overflow-y-auto overscroll-contain" : ""}`}>
                  {category.groups.map((group) => (
                    <div key={group.title}>
                      {category.groups.length > 1 && (
                        <p className="mx-2 mt-2 mb-0.5 text-[10.5px] font-extrabold tracking-[1.1px] text-steel uppercase">{group.title}</p>
                      )}
                      {group.items.map((item) => {
                        const here = item.href === current;
                        const delay = { "--d": `${Math.min(index++ * 38, 500)}ms` } as CSSProperties;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={here ? "page" : undefined}
                            style={delay}
                            className={`map-item relative my-px block rounded-xl py-1.5 text-[14.5px] transition-colors ${
                              here
                                ? "map-current bg-ink pr-3 pl-6.5 font-extrabold text-white before:absolute before:top-1/2 before:left-2.75 before:-mt-0.75 before:size-1.5 before:rounded-full before:bg-brand-pale"
                                : "px-3 font-semibold text-body hover:bg-[rgb(var(--mist-rgb)/0.6)] hover:text-ink"
                            }`}
                          >
                            {item.title}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                  {/* Only part of the group is listed: a link to all of it */}
                  {category.more && (
                    <Link
                      href={category.more.href}
                      onClick={onNavigate}
                      style={{ "--d": `${Math.min(index * 38, 500)}ms` } as CSSProperties}
                      className="map-item mt-0.5 block rounded-xl px-3 py-1.5 text-[13px] font-extrabold text-steel transition-colors hover:bg-[rgb(var(--mist-rgb)/0.6)] hover:text-brand"
                    >
                      {t("allInTopic", { count: category.more.count })}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
