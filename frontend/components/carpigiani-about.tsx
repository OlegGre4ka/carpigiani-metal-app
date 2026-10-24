import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Text about the Carpigiani company at the bottom of the /carpigiani page (as on the old site).
 *  The Carpigiani logo floats on the left, the text flows around it.
 *  Only the Carpigiani Gelato University link works; other brand names are plain text. */
/** The block with the text about a brand under its category cards (also IFI: components/ifi-about.tsx) */
export const aboutSection = "mx-auto w-full max-w-360 px-20 pt-20 max-[820px]:px-4 max-[820px]:pt-12";
export const aboutCard =
  "rounded-[40px] motion-safe:animate-fade-up motion-safe:[animation-delay:450ms] border border-white/90 bg-white/75 px-14 py-12 text-[17px] leading-[1.8] text-cocoa-soft shadow-[0_14px_40px_rgba(90,60,40,0.08)] backdrop-blur-md max-[820px]:rounded-[28px] max-[820px]:px-5 max-[820px]:py-7 max-[820px]:text-base max-[820px]:leading-[1.7]";
/** A link inside the text (to a page of the site) */
export const aboutLink =
  "font-bold text-caramel underline decoration-caramel/30 underline-offset-4 transition-colors hover:decoration-caramel";

export async function CarpigianiAbout() {
  const t = await getTranslations("CarpigianiAbout");

  return (
    <section className={aboutSection}>
      <div className={aboutCard}>
        <Image
          src="/images/carpigiani-brand-logo.webp"
          alt="Carpigiani"
          width={284}
          height={123}
          className="float-left mt-1.5 mr-10 mb-4 h-auto w-60 max-[640px]:float-none max-[640px]:mx-auto max-[640px]:mb-6 max-[640px]:w-48"
        />
        <p>{t("p1")}</p>
        <p className="mt-5">{t("p2")}</p>
        <p className="mt-5">
          {t.rich("p3", {
            link: (chunks) => (
              <Link
                href="/carpigiani-gelato-university"
                className={aboutLink}
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="mt-5 text-cocoa">{t("p4")}</p>
      </div>
    </section>
  );
}
