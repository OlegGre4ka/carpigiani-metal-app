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
      <div aria-hidden="true" className="fade-to-light" />
      <Services />
      <div aria-hidden="true" className="fade-to-dark" />
      {/* Equipment categories come from the admin panel (read on the server); a loader is shown in their place until they are ready */}
      <Suspense fallback={<PageLoader />}>
        <EquipmentCategories />
        {/* All IFI showcases with chips, under its own title (as on the old site) */}
        <div aria-hidden="true" className="fade-to-light mt-25 max-[820px]:mt-15" />
        <BrandShowcases brand="ifi" withTitle />
        <div aria-hidden="true" className="fade-to-dark" />
        {/* The three newest news and "All news" */}
        <HomeNews />
      </Suspense>
    </main>
  );
}
