import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ShowcaseGrid } from "@/components/showcase-grid";
import { loadShowcases } from "@/lib/site-pages";

/** Block with all showcases of a brand and the chips: at the bottom of /ifi (no title) and on
 *  the home page after the equipment categories (with its own title, as on the old site).
 *  No showcases yet: the block is not shown. */
export async function BrandShowcases({ brand, withTitle = false }: { brand: "ifi" | "isa"; withTitle?: boolean }) {
  const locale = await getLocale();
  const data = await loadShowcases(locale, brand);
  if (data.items.length === 0) return null;
  const t = await getTranslations("Showcases");

  return (
    // With the title (home page): on the navy background, blue cards (mockup)
    <section>
      <div
        className={`mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4 ${withTitle ? "pt-27.5 max-[820px]:pt-16" : "pt-14 max-[820px]:pt-10"}`}
      >
        {withTitle && (
          <h2 className="mb-12 pb-1 text-center font-heading text-[54px] leading-[1.05] font-extrabold tracking-[-1.5px] text-white motion-safe:animate-fade-up max-[820px]:mb-7 max-[820px]:text-[34px]">
            {t.rich(`${brand}Title`, { m: (chunks: ReactNode) => <span className="metal-text">{chunks}</span> })}
          </h2>
        )}
        <ShowcaseGrid chips={data.chips} items={data.items} onNavy={withTitle} />
      </div>
    </section>
  );
}
