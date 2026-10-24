import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { BrandShowcases } from "@/components/brand-showcases";
import { EquipmentCategories } from "@/components/equipment-categories";
import { IsaAbout } from "@/components/isa-about";
import { PageLoader } from "@/components/page-loader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Equipment" });
  return { title: `${t("isaTitle")} · Carpigiani`, description: t("isaText") };
}

// Page /isa (the ISA pill in the header), built like /ifi: the cards of the categories of
// ISA showcases (admin panel → ISA showcases), the text about ISA, then all showcases with chips.
// The data is read on the server. Until it is ready, a loader fills the screen,
// then the whole page (cards and text) appears at once.
export default function IsaPage() {
  return (
    <main className="flex-1 pb-16 max-[820px]:pb-10">
      <Suspense fallback={<PageLoader fullPage />}>
        <EquipmentCategories page="isa" />
        <IsaAbout />
        <BrandShowcases brand="isa" />
      </Suspense>
    </main>
  );
}
