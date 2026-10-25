import type { ReactNode } from "react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { cardLift, moreButton } from "@/components/card-styles";
import { PhoneArrow } from "@/components/equipment-cards";
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
  // Home page: on the navy background with blue cards (mockup); brand pages: light
  const dark = !onBrandPage;
  // Words in <m>…</m> of the title shine like metal
  const metal = (chunks: ReactNode) => <span className="metal-text">{chunks}</span>;

  return (
    <section>
      <div
        className={`mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4 ${
          onBrandPage ? "pt-10 max-[820px]:pt-6" : "-mt-15 pt-2.5 max-[820px]:-mt-8"
        }`}
      >
        <Heading
          className={`motion-safe:animate-fade-up text-center font-heading leading-[1.05] font-extrabold ${
            dark ? "pb-1 text-[54px] tracking-[-1.5px] text-white max-[820px]:text-[34px]" : "text-[46px] tracking-[-0.02em] text-ink max-[820px]:text-[30px]"
          }`}
        >
          {t.rich(texts[page].title, { m: metal })}
        </Heading>
        <p
          className={`mx-auto mt-3.5 max-w-[60ch] text-center text-lg motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:mb-8 max-[820px]:text-base ${
            dark ? "mb-13 leading-[1.55] text-on-dark-soft" : "mb-12 text-hint"
          }`}
        >
          {t(texts[page].text)}
        </p>

        <div className={`grid grid-cols-3 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1 max-[820px]:gap-4 ${dark ? "gap-x-6.5 gap-y-7" : "gap-7"}`}>
          {categories.map((category, index) => {
            const title = locale === "en" ? category.title_en : category.title_uk;
            const external = category.href.startsWith("http");
            const content = (
              <>
                <div className={`relative overflow-hidden rounded-[22px] ${dark ? "bg-[var(--navy-photo)]" : ""}`}>
                  <Image
                    src={category.image_url}
                    alt=""
                    width={1200}
                    height={800}
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 420px"
                    className={`block w-full object-cover transition-transform duration-500 ${dark ? "aspect-[4/3] h-auto group-hover:scale-105" : "h-67.5 group-hover:scale-104 max-[820px]:h-52.5"}`}
                  />
                  <span className={`absolute right-3.5 bottom-3.5 ${moreButton}`}>{t("more")}</span>
                </div>
                <div className="flex items-end gap-3">
                  <h3 className={`min-w-0 flex-1 px-2 pt-4.5 pb-1.5 font-extrabold ${dark ? "text-[21px] text-white" : "text-xl"}`}>{title}</h3>
                  <PhoneArrow onNavy={dark} />
                </div>
              </>
            );
            const className = `group block motion-safe:animate-fade-up rounded-[31px] ${dark ? "navy-card p-3.5 pb-5 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgb(0_10_50/0.6)]" : "steel-card p-4.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"} ${dark ? "transition duration-300" : cardLift}`;

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
      </div>
    </section>
  );
}
