import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ShowcaseGrid } from "@/components/showcase-grid";
import { loadShowcases } from "@/lib/site-pages";

/** Block with all showcases of a brand and the chips: at the bottom of /ifi (no title) and on
 *  the home page after the equipment categories (with its own title, as on the old site).
 *  No showcases yet: the block is not shown. */
export async function BrandShowcases({ brand, withTitle = false }: { brand: string; withTitle?: boolean }) {
  const locale = await getLocale();
  const data = await loadShowcases(locale, brand);
  if (data.items.length === 0) return null;
  const t = await getTranslations("Showcases");

  return (
    // With the title (home page): a light band with white cards (approved prototype)
    <section className={withTitle ? "band-light" : ""}>
      <div
        className={`mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4 ${withTitle ? "pt-5 pb-25 max-[820px]:pb-15" : "pt-14 max-[820px]:pt-10"}`}
      >
        {withTitle && (
          <h2 className="pb-1 text-center font-heading text-[52px] leading-[1.05] font-extrabold tracking-[-1.5px] text-[#0a1a3a] motion-safe:animate-fade-up max-[820px]:text-[32px]">
            {t.rich(`${brand}Title`, { m: (chunks: ReactNode) => <span className="metal-text-dark">{chunks}</span> })}
          </h2>
        )}
        {withTitle && <span aria-hidden="true" className="title-line mb-9" />}
        <ShowcaseGrid chips={data.chips} items={data.items} />
      </div>
    </section>
  );
}
