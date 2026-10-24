import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { CarpigianiAbout } from "@/components/carpigiani-about";
import { EquipmentCategories } from "@/components/equipment-categories";
import { PageLoader } from "@/components/page-loader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Equipment" });
  return { title: `${t("carpigianiTitle")} · Carpigiani`, description: t("carpigianiText") };
}

// Page /carpigiani (the CARPIGIANI pill in the header): the same equipment category cards
// as on the home page, with its own title, and the text about the company below.
// The data is read on the server. Until it is ready, a loader fills the screen,
// then the whole page (cards and text) appears at once.
export default function CarpigianiPage() {
  return (
    <main className="flex-1 pb-16 max-[820px]:pb-10">
      <Suspense fallback={<PageLoader fullPage />}>
        <EquipmentCategories page="carpigiani" />
        <CarpigianiAbout />
      </Suspense>
    </main>
  );
}
