import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
  // 30.10: "showcase" cards (VitrinaCard)
  const locale = await getLocale();
  return (
    <div className="grid grid-cols-3 gap-x-6.5 gap-y-7 max-[1100px]:grid-cols-2 max-[820px]:gap-4 max-[640px]:grid-cols-1">
      {categories.map((category, index) => (
        <VitrinaCard key={category.id} category={category} title={locale === "en" ? category.title_en : category.title_uk} index={index} />
      ))}
    </div>
  );
}

/** A category card of a brand page as a tall showcase (30.10, Oleh: the photos were cut and an
 *  inner frame looked poor). The card is white from edge to edge, the product photo (on white)
 *  is shown whole and its white melts into the card. At the bottom a navy band with light lines
 *  and a soft wave on top, like the curve of the logo, with the metal title: the product seems to
 *  stand on a showcase shelf. On hover the shelf rises a little, the product lifts and its shadow
 *  shows, the arrow appears. A photo with its own background fills the card above the shelf.
 *  An empty page: the card does not react. Looks: globals.css (.vitrina). */
function VitrinaCard({ category, title, index }: { category: EquipmentCategory; title: string; index: number }) {
  const linked = category.has_page !== false;
  // A product on white / transparent (or not known yet): whole; a photo with its own background: fills
  const whole = category.photo_kind !== "";
  const content = (
    <>
      <div className="absolute inset-x-0 top-0 bottom-[24%]">
        <Image
          src={category.image_url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 420px"
          className={`vitrina-photo ${whole ? "object-contain px-[9%] pt-[9%] pb-[13%]" : "object-cover"}`}
        />
        {whole && <span aria-hidden="true" className="vitrina-shadow" />}
      </div>
      <div className="vitrina-band">
        <div className="flex w-full items-end gap-3 px-6 pb-5.5 max-[820px]:px-5 max-[820px]:pb-4.5">
          <h3 className="min-w-0 flex-1 text-[21px] leading-tight font-extrabold max-[820px]:text-[19px]">
            <span className="metal-text">{title}</span>
          </h3>
          {linked && (
            <span aria-hidden="true" className="vitrina-arrow">
              <ArrowRight className="size-4.5" strokeWidth={2.4} />
            </span>
          )}
        </div>
      </div>
    </>
  );
  const className = `vitrina ${linked ? "is-linked" : ""} group motion-safe:animate-fade-up`;
  const style = delay(index);
  if (!linked) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }
  return category.href.startsWith("http") ? (
    <a href={category.href} target="_blank" rel="noopener" className={className} style={style}>
      {content}
    </a>
  ) : (
    <Link href={category.href} className={className} style={style}>
      {content}
    </Link>
  );
}

/** 3 cards in a row (2 on tablets, 1 on phones): photo with "More", name, arrow on phones.
 *  dark: the home page (navy cards), otherwise light glass cards (brand pages, 29.10). */
async function CardsGrid({ categories, dark = false, short = false }: { categories: EquipmentCategory[]; dark?: boolean; short?: boolean }) {
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
                className={`block w-full object-cover transition-transform duration-500 ${short ? "h-[clamp(190px,30vh,260px)] group-hover:scale-105 max-[820px]:h-52.5" : dark ? "aspect-[4/3] h-auto group-hover:scale-105" : "h-67.5 group-hover:scale-104 max-[820px]:h-52.5"}`}
              />
              {linked && <span className={`absolute right-3.5 bottom-3.5 ${moreButton}`}>{t("more")}</span>}
            </div>
            <div className="flex items-end gap-3">
              <h3 className={`min-w-0 flex-1 px-2 pt-4.5 pb-1.5 font-extrabold ${dark ? "text-[21px] text-white" : "text-xl"}`}>
                {short ? <span className="metal-text">{title}</span> : title}
              </h3>
              {linked && <PhoneArrow onNavy={dark} />}
            </div>
          </>
        );
        const className = `group block motion-safe:animate-fade-up rounded-[31px] ${dark ? `${short ? "lines-card" : "navy-card"} p-3.5 pb-5 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgb(0_10_50/0.6)]` : "glass-card p-4.5"} ${dark ? "transition duration-300" : cardLift}`;

        if (!linked) {
          const still = `block motion-safe:animate-fade-up rounded-[31px] ${dark ? `${short ? "lines-card" : "navy-card"} p-3.5 pb-5` : "glass-card p-4.5"}`;
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
