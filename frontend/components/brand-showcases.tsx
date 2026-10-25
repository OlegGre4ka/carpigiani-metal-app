import { getLocale, getTranslations } from "next-intl/server";

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
    // With the title (home page): a white band on the full width
    <section className={withTitle ? "bg-white" : ""}>
      <div
        className={`mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4 ${withTitle ? "py-24 max-[820px]:py-14" : "pt-14 max-[820px]:pt-10"}`}
      >
        {withTitle && (
          <h2 className="mb-10 text-center font-heading text-[46px] leading-[1.05] font-extrabold tracking-[-0.02em] text-ink motion-safe:animate-fade-up max-[820px]:mb-7 max-[820px]:text-[30px]">
            {t(`${brand}Title`)}
          </h2>
        )}
        <ShowcaseGrid chips={data.chips} items={data.items} />
      </div>
    </section>
  );
}
