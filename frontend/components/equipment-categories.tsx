import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { cardLift, moreButton } from "@/components/card-styles";
import { Link } from "@/i18n/navigation";
import { loadEquipmentCategories } from "@/lib/equipment-categories";

// The card styles live in components/card-styles.ts (also used by equipment cards)
export { cardLift, moreButton };

// Cards appear one after another when the page opens
const delay = (index: number) => ({ animationDelay: `${200 + index * 110}ms` });

/** Title and text above the cards on each page */
const texts = {
  home: { title: "title", text: "text" },
  carpigiani: { title: "carpigianiTitle", text: "carpigianiText" },
  ifi: { title: "ifiTitle", text: "ifiText" },
  isa: { title: "isaTitle", text: "isaText" },
} as const;

/** Block "Equipment for ice cream production": one card per category from the admin panel.
 *  No categories yet: on the home page the block is not shown; on a brand page only its title.
 *  page="home": block on the home page (heading h2), Carpigiani categories.
 *  page="carpigiani" / "ifi" / "isa": the cards of that brand on its page (/carpigiani, /ifi, /isa), with its
 *  own title (heading h1, a bit higher). */
export async function EquipmentCategories({ page = "home" }: { page?: keyof typeof texts }) {
  const categories = await loadEquipmentCategories(page === "home" ? "carpigiani" : page);
  const onBrandPage = page !== "home";
  // On the home page the block goes away; a brand page keeps its title (its text is below)
  if (categories.length === 0 && !onBrandPage) return null;

  const locale = await getLocale();
  const t = await getTranslations("Equipment");
  const Heading = onBrandPage ? "h1" : "h2";

  return (
    <section
      className={`mx-auto w-full max-w-360 px-20 max-[820px]:px-4 ${
        onBrandPage ? "pt-10 max-[820px]:pt-6" : "pt-24 max-[820px]:pt-14"
      }`}
    >
      <Heading className="text-center motion-safe:animate-fade-up font-heading text-[54px] leading-[1.05] font-bold tracking-[-0.5px] text-caramel max-[820px]:text-[36px]">
        {t(texts[page].title)}
      </Heading>
      <p className="mx-auto mt-3.5 mb-13 max-w-[60ch] text-center text-lg motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] text-[#7a6656] max-[820px]:mb-8 max-[820px]:text-base">
        {t(texts[page].text)}
      </p>

      <div className="grid grid-cols-3 gap-7 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1 max-[820px]:gap-4">
        {categories.map((category, index) => {
          const title = locale === "en" ? category.title_en : category.title_uk;
          const external = category.href.startsWith("http");
          const content = (
            <>
              <div className="relative overflow-hidden rounded-[22px]">
                <Image
                  src={category.image_url}
                  alt=""
                  width={1200}
                  height={800}
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 420px"
                  className="block h-67.5 w-full object-cover transition-transform duration-500 group-hover:scale-104 max-[820px]:h-52.5"
                />
                <span className={`absolute right-4 bottom-4 ${moreButton}`}>{t("more")}</span>
              </div>
              <h3 className="px-2 pt-4.5 pb-1.5 text-xl font-extrabold">{title}</h3>
            </>
          );
          const className = `group block motion-safe:animate-fade-up rounded-[32px] border border-white/90 bg-white/75 p-4.5 shadow-[0_14px_40px_rgba(90,60,40,0.08)] backdrop-blur-md ${cardLift}`;

          return external ? (
            <a key={category.id} href={category.href} target="_blank" rel="noopener" className={className} style={delay(index)}>
              {content}
            </a>
          ) : (
            <Link key={category.id} href={category.href} className={className} style={delay(index)}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
