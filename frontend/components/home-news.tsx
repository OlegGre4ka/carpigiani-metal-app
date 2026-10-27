import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { NewsGrid } from "@/components/news-cards";
import { Link } from "@/i18n/navigation";
import { loadNews } from "@/lib/site-pages";

/** Block "News" on the home page (after the IFI showcases), on the navy background: the three
 *  newest news as the same compact cards as on /news (blue, as in the mockup), and "All news". No news on the site yet: the block is not shown. */
export async function HomeNews() {
  const locale = await getLocale();
  const data = await loadNews(locale, 0, 3);
  if (data.items.length === 0) return null;
  const t = await getTranslations("News");

  return (
    <section className="band-blue">
      <div className="mx-auto w-full max-w-360 px-20 pt-25 pb-25 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-15 max-[820px]:pb-15">
        <div className="mb-8.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 max-[820px]:mb-5">
          <div><h2 className="font-heading text-[54px] leading-[1.05] font-extrabold tracking-[-1.5px] text-white motion-safe:animate-fade-up max-[820px]:text-[34px]">
            <span className="metal-text">{t("title")}</span>
          </h2>
          <span aria-hidden="true" className="title-line left" /></div>
          <Link href="/news" className="group inline-flex items-center gap-2 pb-2.5 text-[15px] font-extrabold text-sky">
            {t("allNews")}
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <NewsGrid items={data.items} onNavy />
      </div>
    </section>
  );
}
