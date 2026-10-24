import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { BrandShowcases } from "@/components/brand-showcases";
import { EquipmentCategories } from "@/components/equipment-categories";
import { IfiAbout } from "@/components/ifi-about";
import { PageLoader } from "@/components/page-loader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Equipment" });
  return { title: `${t("ifiTitle")} · Carpigiani`, description: t("ifiText") };
}

// Page /ifi (the IFI pill in the header), built like /carpigiani: the cards of the categories of
// IFI showcases (admin panel → IFI showcases), the text about IFI, then all showcases with chips.
// The data is read on the server. Until it is ready, a loader fills the screen,
// then the whole page (cards and text) appears at once.
export default function IfiPage() {
  return (
    <main className="flex-1 pb-16 max-[820px]:pb-10">
      <Suspense fallback={<PageLoader fullPage />}>
        <EquipmentCategories page="ifi" />
        <IfiAbout />
        <BrandShowcases brand="ifi" />
      </Suspense>
    </main>
  );
}
