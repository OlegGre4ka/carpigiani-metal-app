"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { chip } from "@/components/card-styles";
import { EquipmentCards } from "@/components/equipment-cards";
import type { BrandShowcases } from "@/lib/site-pages";

// All showcases of a brand with chips to filter them by category (as on the old site, but neat):
// "All" and one chip per category. The cards are the same as on category pages (quick view on
// click). On phones the chips scroll sideways.

export function ShowcaseGrid({ chips, items }: BrandShowcases) {
  const t = useTranslations("Showcases");
  const [chosen, setChosen] = useState<number | null>(null);
  const shown = chosen === null ? items : items.filter((item) => item.category === chosen);

  return (
    <div>
      {chips.length > 1 && (
        <div
          role="group"
          aria-label={t("filter")}
          className="-mx-1 mb-7 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] max-[820px]:mb-5 max-[820px]:gap-2 [&::-webkit-scrollbar]:hidden"
        >
          <button type="button" aria-pressed={chosen === null} onClick={() => setChosen(null)} className={chip(chosen === null)}>
            {t("all")}
          </button>
          {chips.map((c) => (
            <button key={c.id} type="button" aria-pressed={chosen === c.id} onClick={() => setChosen(c.id)} className={chip(chosen === c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      )}
      {/* A new set of cards fades in after a chip is chosen */}
      <div key={chosen ?? "all"} className="motion-safe:animate-fade-up">
        <EquipmentCards items={shown} />
      </div>
    </div>
  );
}
