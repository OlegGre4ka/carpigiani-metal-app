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
    // page-waves: the light background with soft lines behind the whole page (globals.css)
    <main className="page-waves flex-1 pb-16 max-[820px]:pb-10">
      <div className="mx-auto w-full max-w-360 px-20 pt-7 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-5">
        {/* Head of the page (29.10): large screens — the logo of the brand on a white tile LEFT of
            the title, in one row (low head, so the category cards are on the first screen);
            phones — a smaller logo above the title. Title in still dark metal, trail line, the
            line under the title. */}
        <header className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-6 max-[820px]:flex-col max-[820px]:gap-3">
            {page.logo_url && (
              <div className="steel-card flex h-16 shrink-0 items-center justify-center rounded-[20px] px-5 shadow-[0_12px_30px_rgb(var(--shadow-rgb)/0.12)] motion-safe:animate-fade-up max-[820px]:h-12 max-[820px]:rounded-[16px] max-[820px]:px-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- logo from the admin panel, any size */}
                <img src={page.logo_url} alt={page.title} className="max-h-10 w-auto max-w-44 object-contain max-[820px]:max-h-7.5 max-[820px]:max-w-32" />
              </div>
            )}
            <h1 className="pb-1 text-left font-heading text-[44px] leading-[1.08] font-extrabold tracking-[-0.02em] motion-safe:animate-fade-up max-[820px]:text-center max-[820px]:text-[30px]">
              <span className="metal-text-calm">{page.title}</span>
            </h1>
          </div>
          <span aria-hidden="true" className="title-line mt-3!" />
          {page.subtitle && (
            <p className="mx-auto mt-3 max-w-[70ch] text-[17px] leading-[1.5] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] max-[820px]:text-[15px]">
              {page.subtitle}
            </p>
          )}
        </header>

        <div className="mt-8 flex flex-col gap-20 max-[820px]:mt-6 max-[820px]:gap-12">
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
