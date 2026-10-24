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
    <section
      className={`mx-auto w-full max-w-360 px-20 max-[820px]:px-4 ${withTitle ? "pt-24 max-[820px]:pt-14" : "pt-14 max-[820px]:pt-10"}`}
    >
      {withTitle && (
        <h2 className="mb-10 text-center font-heading text-[54px] leading-[1.05] font-bold tracking-[-0.5px] text-caramel motion-safe:animate-fade-up max-[820px]:mb-7 max-[820px]:text-[36px]">
          {t(`${brand}Title`)}
        </h2>
      )}
      <ShowcaseGrid chips={data.chips} items={data.items} />
    </section>
  );
}
