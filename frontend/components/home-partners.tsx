import { getTranslations } from "next-intl/server";

import { PartnersStrip } from "@/components/partners-strip";
import { loadPartners } from "@/lib/site-pages";

/** Block "Partners" on the home page, before the footer (as on the old site, 4.11): the logos of
 *  the partners from the admin panel → "Загальні налаштування" → "Партнери". No partners on the
 *  site: the block is not shown. */
export async function HomePartners() {
  const partners = await loadPartners();
  if (partners.length === 0) return null;
  const t = await getTranslations("Partners");

  return (
    <section aria-labelledby="partners-title" className="band-light">
      <div className="mx-auto w-full max-w-360 px-20 pt-20 pb-20 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-12 max-[820px]:pb-12">
        <h2
          id="partners-title"
          className="mx-auto mb-9 w-fit max-w-full text-center font-heading text-[38px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark max-[820px]:mb-6 max-[820px]:text-[28px]"
        >
          {t("title")}
        </h2>
        <PartnersStrip partners={partners} prevLabel={t("prev")} nextLabel={t("next")} />
      </div>
    </section>
  );
}
