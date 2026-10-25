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
    <main className="home-navy flex-1 pb-25 max-[820px]:pb-15">
      {/* Header and slider stand on the navy background (globals.css: body:has(.home-navy)) */}
      <HeroSlider />
      {/* Navy flows into the white "What we do" band (backgrounds change from block to block) */}
      <div aria-hidden="true" className="h-37.5 bg-linear-to-b from-transparent to-white max-[820px]:h-22.5" />
      <Services />
      {/* The white band flows back into navy; the blocks below stand on the navy background */}
      <div aria-hidden="true" className="-mt-px h-42.5 bg-linear-to-b from-white to-transparent max-[820px]:h-22.5" />
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
