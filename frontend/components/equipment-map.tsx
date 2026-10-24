"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { SectionMap } from "@/components/section-map";
import type { EquipmentMapCategory } from "@/lib/site-pages";

// "Map" of equipment on equipment pages: the shared map of a section (components/section-map.tsx)
// with the logo of the brand on top: categories that open like an accordion, inside them
// subcategories as small headings and the equipment.

/** Logos of the brands above the map */
const brandLogos: Record<string, { src: string; alt: string; width: number; height: number; className: string }> = {
  carpigiani: { src: "/images/carpigiani-brand-logo.webp", alt: "Carpigiani", width: 284, height: 123, className: "h-14" },
  ifi: { src: "/images/ifi-logo.webp", alt: "IFI", width: 127, height: 127, className: "h-16" },
  isa: { src: "/images/isa-logo.webp", alt: "ISA", width: 313, height: 130, className: "h-14" },
};

export function EquipmentMap({
  categories,
  current,
  withHeader = true,
  onNavigate,
  title,
  brand = "carpigiani",
}: {
  /** Brand of the page: its logo stands above the map */
  brand?: string;
  categories: EquipmentMapCategory[];
  /** Heading of the map: "Equipment catalog" by default, "IFI showcases" on pages of showcases */
  title?: string;
  /** Address of the page that is open now ("/maestro") */
  current: string;
  withHeader?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("EquipmentPage");
  const logo = brandLogos[brand];
  const name = title ?? t("map");
  // Logo of the brand of the page (as on the old site): Carpigiani on equipment, IFI on its showcases
  const header = (
    <>
      {logo && (
        <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className={`mx-auto mt-1 mb-3.5 w-auto ${logo.className}`} />
      )}
      <div className={`flex items-center gap-3 ${logo ? "justify-center" : ""}`}>
        {!logo && <Image src="/images/logo.webp" alt="" width={202} height={420} className="h-10 w-auto" />}
        <b className="font-heading text-2xl leading-none font-bold text-caramel">{name}</b>
      </div>
    </>
  );
  return (
    <SectionMap categories={categories} current={current} title={name} header={withHeader ? header : null} onNavigate={onNavigate} />
  );
}
