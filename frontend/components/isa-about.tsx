import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { aboutCard, aboutLink, aboutSection } from "@/components/carpigiani-about";
import { Link } from "@/i18n/navigation";

/** Text about ISA under the category cards of the /isa page (as on the old site): the ISA logo
 *  on the right, the text flows around it, then the two groups of showcases. The model names
 *  lead to the pages of these showcases (old addresses). */
export async function IsaAbout() {
  const t = await getTranslations("IsaAbout");
  const bold = (chunks: ReactNode) => <b className="font-bold text-cocoa">{chunks}</b>;
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
          src="/images/isa-logo.webp"
          alt="ISA"
          width={313}
          height={130}
          className="float-right mt-1.5 mb-4 ml-10 h-auto w-64 max-[640px]:float-none max-[640px]:mx-auto max-[640px]:mb-6 max-[640px]:w-52"
        />
        <p>{t.rich("p1", { b: bold })}</p>
        <p className="mt-5">
          {t.rich("p2", {
            carrettino: link("/isa-il-carrettino"),
            millennium: link("/isa-millennium"),
            oneshow: link("/isa-oneshow-free"),
            supercapri: link("/isa-supercapri"),
          })}
        </p>
        <p className="mt-5">{t.rich("p3", { b: bold })}</p>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 marker:text-caramel-light">
          <li>{t("group1")}</li>
          <li>{t("group2")}</li>
        </ul>
        <p className="mt-5">{t("p4")}</p>
      </div>
    </section>
  );
}
