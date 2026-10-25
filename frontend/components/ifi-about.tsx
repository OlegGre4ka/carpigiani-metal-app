import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { aboutCard, aboutLink, aboutSection } from "@/components/carpigiani-about";
import { Link } from "@/i18n/navigation";

/** Text about IFI under the category cards of the /ifi page (as on the old site): the IFI logo
 *  on the right, the text flows around it; then the panel options and the note about versions.
 *  PANORAMA and TONDA lead to the pages of these showcases (old addresses). */
export async function IfiAbout() {
  const t = await getTranslations("IfiAbout");
  const bold = (chunks: ReactNode) => <b className="font-bold text-ink">{chunks}</b>;
  const link = (href: string) =>
    function ShowcaseLink(chunks: ReactNode) {
      return (
        <Link href={href} className={aboutLink}>
          {chunks}
        </Link>
      );
    };

  return (
    <section className={aboutSection}>
      <div className={`${aboutCard} flow-root`}>
        <Image
          src="/images/ifi-logo.webp"
          alt="IFI"
          width={127}
          height={127}
          className="float-right mt-1.5 mb-4 ml-10 h-auto w-32 max-[640px]:float-none max-[640px]:mx-auto max-[640px]:mb-6 max-[640px]:w-24"
        />
        <p>{t.rich("p1", { b: bold, panorama: link("/ifi-panorama"), tonda: link("/ifi-tonda") })}</p>
        <p className="mt-5">{t("panelsTitle")}</p>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 marker:text-brand-light">
          <li>{t.rich("panel1", { b: bold })}</li>
          <li>{t.rich("panel2", { b: bold })}</li>
          <li>{t.rich("panel3", { b: bold })}</li>
        </ul>
        <p className="mt-5">{t("p2")}</p>
      </div>
    </section>
  );
}
