import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { NewsSlider } from "@/components/news-cards";
import { Link } from "@/i18n/navigation";
import { loadNews } from "@/lib/site-pages";

/** Block "News" on the home page (after the IFI showcases), on the blue band: the newest news
 *  as a strip that moves one news to the left every 5 seconds, with arrows (as on the old
 *  site), and "All news". No news on the site yet: the block is not shown. */
export async function HomeNews() {
  const locale = await getLocale();
  const data = await loadNews(locale, 0, 9);
  if (data.items.length === 0) return null;
  const t = await getTranslations("News");

  return (
    <section className="band-blue">
      <div className="mx-auto w-full max-w-360 px-20 pt-25 pb-25 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-15 max-[820px]:pb-15">
        <NewsSlider
          items={data.items}
          allNews={
            <Link href="/news" className="group inline-flex items-center gap-2 text-[15px] font-extrabold text-sky">
              {t("allNews")}
              <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />
      </div>
    </section>
  );
}
