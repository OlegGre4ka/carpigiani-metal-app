import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";

// The 404 page of the site (4.11): an address that is not a page of the site (no page in the
// admin panel and not one of the pages being prepared, lib/coming-soon-pages.ts). The same card
// as "This page is being prepared": the mark, a big metal 404, the way home and the search.
export async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex flex-1 items-center justify-center px-20 pt-6 pb-20 max-[820px]:px-4 max-[820px]:pb-28">
      <section className="relative w-full max-w-180 overflow-hidden rounded-[36px] steel-card px-14 py-12 text-center shadow-[0_24px_60px_rgb(var(--shadow-rgb)/0.12)] backdrop-blur-sm max-[820px]:rounded-[28px] max-[820px]:px-6 max-[820px]:py-10">
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-light-rgb)/0.22)_0%,transparent_70%)]"
        />

        <div className="relative flex items-center justify-center gap-4 motion-safe:animate-fade-up max-[820px]:gap-2.5">
          <span aria-hidden="true" className="font-heading text-[120px] leading-none font-extrabold tracking-[-0.04em] metal-text-dark max-[820px]:text-[78px]">
            4
          </span>
          <BrandMark className="h-28 w-auto max-[820px]:h-19" />
          <span aria-hidden="true" className="font-heading text-[120px] leading-none font-extrabold tracking-[-0.04em] metal-text-dark max-[820px]:text-[78px]">
            4
          </span>
        </div>

        <p className="relative mt-6 text-xs font-extrabold tracking-[2.5px] text-steel uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
          {t("eyebrow")}
        </p>
        <h1 className="relative mx-auto mt-3 w-fit max-w-full font-heading tracking-[-0.02em] text-[42px] leading-[1.05] font-extrabold metal-text-dark motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[820px]:text-[29px]">
          {t("title")}
        </h1>
        <p className="relative mx-auto mt-4 max-w-[46ch] text-lg leading-relaxed text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:240ms] max-[820px]:text-base">
          {t("text")}
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:320ms]">
          <Link
            href="/"
            className="btn-shine rounded-full bg-[image:var(--grad-btn)] px-7 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgb(var(--brand-rgb)/0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgb(var(--brand-rgb)/0.45)]"
          >
            {t("home")}
          </Link>
          <Link
            href="/search"
            className="metal-round inline-flex items-center gap-2 rounded-full border border-white/80 bg-[image:var(--metal)] px-6 py-3.25 font-extrabold text-[#05070b] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_10px_22px_rgb(var(--shadow-rgb)/0.22)] transition-colors hover:text-white"
          >
            <Search aria-hidden="true" className="size-4.5" />
            {t("search")}
          </Link>
        </div>
      </section>
    </main>
  );
}
