import type { ReactNode } from "react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { cardLift, moreButton } from "@/components/card-styles";
import { PhoneArrow } from "@/components/equipment-cards";
import { Link } from "@/i18n/navigation";
import { loadEquipmentCategories, type EquipmentCategory } from "@/lib/equipment-categories";

// The card styles live in components/card-styles.ts (also used by equipment cards)
export { cardLift, moreButton };

// Cards appear one after another when the page opens
const delay = (index: number) => ({ animationDelay: `${200 + index * 110}ms` });

/** Block "Equipment for ice cream production" on the home page (navy background): one card per
 *  Carpigiani category from the admin panel. No categories yet: the block is not shown.
 *  Brand pages (/ifi) show the cards of their brand with CategoryCards (components/brand-page.tsx). */
export async function EquipmentCategories() {
  const categories = await loadEquipmentCategories("carpigiani");
  if (categories.length === 0) return null;
  const t = await getTranslations("Equipment");
  // Words in <m>…</m> of the title shine like metal
  const metal = (chunks: ReactNode) => <span className="metal-text">{chunks}</span>;

  return (
    <section className="band-blue">
      <div className="mx-auto w-full max-w-360 px-20 pt-25 pb-25 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-15 max-[820px]:pb-15">
        <h2 className="pb-1 text-center font-heading text-[54px] leading-[1.05] font-extrabold tracking-[-1.5px] text-white motion-safe:animate-fade-up max-[820px]:text-[34px]">
          {t.rich("title", { m: metal })}
        </h2>
        <span aria-hidden="true" className="title-line" />
        <p className="mx-auto mt-3.5 mb-13 max-w-[60ch] text-center text-lg leading-[1.55] text-on-dark-soft motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:mb-8 max-[820px]:text-base">
          {t("text")}
        </p>
        <CardsGrid categories={categories} dark />
      </div>
    </section>
  );
}

/** The cards of the categories of a brand (the "Categories" block of a brand page, light).
 *  No categories yet: nothing is shown. */
export async function CategoryCards({ brand }: { brand: string }) {
  const categories = await loadEquipmentCategories(brand);
  if (categories.length === 0) return null;
  return <CardsGrid categories={categories} />;
}

/** 3 cards in a row (2 on tablets, 1 on phones): photo with "More", name, arrow on phones.
 *  dark: the home page (navy cards), otherwise light steel cards. */
async function CardsGrid({ categories, dark = false }: { categories: EquipmentCategory[]; dark?: boolean }) {
  const locale = await getLocale();
  const t = await getTranslations("Equipment");
  return (
    <div className={`grid grid-cols-3 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1 max-[820px]:gap-4 ${dark ? "gap-x-6.5 gap-y-7" : "gap-7"}`}>
      {categories.map((category, index) => {
        const title = locale === "en" ? category.title_en : category.title_uk;
        const external = category.href.startsWith("http");
        // The page of the category shows nothing besides its title yet: a card without a link
        // (no "More", no arrow, does not lift)
        const linked = category.has_page !== false;
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
              {linked && <span className={`absolute right-3.5 bottom-3.5 ${moreButton}`}>{t("more")}</span>}
            </div>
            <div className="flex items-end gap-3">
              <h3 className={`min-w-0 flex-1 px-2 pt-4.5 pb-1.5 font-extrabold ${dark ? "text-[21px] text-white" : "text-xl"}`}>{title}</h3>
              {linked && <PhoneArrow onNavy={dark} />}
            </div>
          </>
        );
        const className = `group block motion-safe:animate-fade-up rounded-[31px] ${dark ? "navy-card p-3.5 pb-5 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgb(0_10_50/0.6)]" : "steel-card p-4.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"} ${dark ? "transition duration-300" : cardLift}`;

        if (!linked) {
          const still = `block motion-safe:animate-fade-up rounded-[31px] ${dark ? "navy-card p-3.5 pb-5" : "steel-card p-4.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"}`;
          return (
            <div key={category.id} className={still} style={delay(index)}>
              {content}
            </div>
          );
        }
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
  );
}
