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
  // Home page: a dark band on the full width with dark steel cards; brand pages: light
  const dark = !onBrandPage;

  return (
    <section className={dark ? "bg-dark text-on-dark" : ""}>
      <div
        className={`mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4 ${
          onBrandPage ? "pt-10 max-[820px]:pt-6" : "py-24 max-[820px]:py-14"
        }`}
      >
        <Heading
          className={`motion-safe:animate-fade-up font-heading text-[46px] leading-[1.05] font-extrabold tracking-[-0.02em] max-[820px]:text-[30px] ${
            dark ? "text-white" : "text-center text-ink"
          }`}
        >
          {t(texts[page].title)}
        </Heading>
        <p
          className={`mt-3.5 mb-12 max-w-[60ch] text-lg motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:mb-8 max-[820px]:text-base ${
            dark ? "text-on-dark-soft" : "mx-auto text-center text-hint"
          }`}
        >
          {t(texts[page].text)}
        </p>

        <div className="grid grid-cols-3 gap-7 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1 max-[820px]:gap-4">
          {categories.map((category, index) => {
            const title = locale === "en" ? category.title_en : category.title_uk;
            const external = category.href.startsWith("http");
            const content = (
              <>
                <div className={`relative overflow-hidden rounded-[22px] ${dark ? "bg-dark-card" : ""}`}>
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
                <h3 className={`px-2 pt-4.5 pb-1.5 text-xl font-extrabold ${dark ? "text-white" : ""}`}>{title}</h3>
              </>
            );
            const className = `group block motion-safe:animate-fade-up rounded-[30px] p-4.5 ${dark ? "steel-card-dark" : "steel-card shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"} ${cardLift}`;

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
