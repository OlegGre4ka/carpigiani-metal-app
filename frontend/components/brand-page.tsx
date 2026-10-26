import { BrandShowcases } from "@/components/brand-showcases";
import { CategoryCards } from "@/components/equipment-categories";
import { Reveal } from "@/components/reveal";
import { Block } from "@/components/site-page";
import type { BrandPageData } from "@/lib/site-pages";

// The page of a brand (/carpigiani, /ifi, /isa and brands added in the admin panel), built in the
// admin panel: title, the line under it (only when filled in), then the blocks in the order the
// client put them. The "Categories" block shows the cards of the brand's categories; the other
// blocks are the same as on category pages. At the bottom, when switched on: all equipment of the
// brand with filter chips by category.

// Blocks appear when scrolled to; the first ones on the screen one by one
const delay = (index: number) => (index < 3 ? 120 + index * 90 : 0);

export function BrandPage({ page }: { page: BrandPageData }) {
  return (
    <main className="flex-1 pb-16 max-[820px]:pb-10">
      <div className="mx-auto w-full max-w-360 px-20 pt-10 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-6">
        <h1 className="text-center font-heading text-[46px] leading-[1.05] font-extrabold tracking-[-0.02em] text-ink motion-safe:animate-fade-up max-[820px]:text-[30px]">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mx-auto mt-3.5 max-w-[60ch] text-center text-lg text-hint motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:text-base">
            {page.subtitle}
          </p>
        )}

        <div className="mt-12 flex flex-col gap-20 max-[820px]:mt-8 max-[820px]:gap-12">
          {page.blocks.map((block, index) =>
            block.type === "categories" ? (
              <CategoryCards key={block.id} brand={page.key} />
            ) : (
              <Reveal key={block.id} delay={delay(index)} radius={block.type === "text" ? 40 : 32} className="min-w-0">
                <Block block={block} compact={false} title={page.title} />
              </Reveal>
            ),
          )}
        </div>
      </div>

      {page.show_equipment && <BrandShowcases brand={page.key} />}
    </main>
  );
}
