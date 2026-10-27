import { Suspense } from "react";

import { BrandShowcases } from "@/components/brand-showcases";
import { EquipmentCategories } from "@/components/equipment-categories";
import { HeroSlider } from "@/components/hero-slider";
import { HomeNews } from "@/components/home-news";
import { PageLoader } from "@/components/page-loader";
import { Services } from "@/components/services";

// Home page. The cards and other blocks are added here step by step.
export default function HomePage() {
  return (
    <main className="home-navy flex-1 pb-10 max-[820px]:pb-8">
      {/* Header and slider stand on the navy background (globals.css: body:has(.home-navy)) */}
      <HeroSlider />
      {/* Bands change from block to block with a clean edge (27.10: no soft fades):
          light "What we do", blue equipment, light IFI showcases, blue news */}
      <Services />
      {/* Equipment categories come from the admin panel (read on the server); a loader is shown in their place until they are ready */}
      <Suspense fallback={<PageLoader />}>
        <EquipmentCategories />
        {/* All IFI showcases with chips, under its own title (as on the old site) */}
        <BrandShowcases brand="ifi" withTitle />
        {/* The three newest news and "All news" */}
        <HomeNews />
      </Suspense>
    </main>
  );
}
