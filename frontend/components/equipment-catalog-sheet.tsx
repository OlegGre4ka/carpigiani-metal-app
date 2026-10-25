"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { SectionMap } from "@/components/section-map";
import type { EquipmentMapCategory } from "@/lib/site-pages";

// Phones and tablets: the button under the title ("Equipment catalog", "News by topic") opens
// the same map of the section as a panel from the bottom (handle, title, cross, dimmed page behind).
export function EquipmentCatalogSheet({
  categories,
  current,
  title,
  topLink,
}: {
  categories: EquipmentMapCategory[];
  current: string;
  /** Heading: "Equipment catalog" by default, "IFI showcases" on pages of showcases */
  title?: string;
  /** A link above the groups ("All news →") */
  topLink?: { title: string; href: string };
}) {
  const t = useTranslations("EquipmentPage");
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = button.current;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // The page behind does not scroll while the panel is open
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="mb-4 hidden items-center gap-2.5 rounded-full border border-ink/16 bg-white/85 px-4.5 py-2.75 text-sm font-extrabold text-ink shadow-[0_8px_20px_rgb(var(--shadow-rgb)/0.1)] motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:inline-flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h11M4 17h7" />
        </svg>
        {title ?? t("map")}
      </button>
      {open && (
        <div className="fixed inset-0 z-70 min-[821px]:hidden">
          <div aria-hidden="true" onClick={() => setOpen(false)} className="scrim-in absolute inset-0 bg-[rgb(var(--ink-rgb)/0.45)]" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? t("map")}
            className="sheet-in absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-[30px] bg-paper px-4 pt-2.5 pb-6 shadow-[0_-20px_50px_rgb(var(--shadow-rgb)/0.28)]"
          >
            <span aria-hidden="true" className="mx-auto mb-3 block h-1.25 w-11 rounded-full bg-ink/20" />
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <h2 className="text-[26px] leading-none">{title ?? t("map")}</h2>
              <button
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex size-9 items-center justify-center rounded-full bg-mist text-ink hover:bg-mist-strong"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-4.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <SectionMap
              categories={categories}
              current={current}
              title={title ?? t("map")}
              header={null}
              topLink={topLink}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** The same panel for any section (news by topic) */
export { EquipmentCatalogSheet as SectionMapSheet };
