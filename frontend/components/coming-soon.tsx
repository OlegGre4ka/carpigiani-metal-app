import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";

// Mobile number (the same as in the footer)
const PHONE = { label: "+38 067 244 1109", href: "tel:+380672441109" };

/** Temporary page: "This page is being prepared" */
export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("ComingSoon");

  return (
    <main className="flex flex-1 items-center justify-center px-20 pt-6 pb-20 max-[820px]:px-4 max-[820px]:pb-28">
      <section className="relative w-full max-w-180 overflow-hidden rounded-[36px] steel-card px-14 py-14 text-center shadow-[0_24px_60px_rgb(var(--shadow-rgb)/0.12)] backdrop-blur-sm max-[820px]:rounded-[28px] max-[820px]:px-6 max-[820px]:py-10">
        {/* Soft blue glow behind the mark */}
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-light-rgb)/0.22)_0%,transparent_70%)]"
        />

        {/* The brand mark rises softly */}
        <BrandMark className="relative mx-auto h-36 w-auto motion-safe:animate-fade-up max-[820px]:h-28" />

        <p className="relative mt-6 text-xs font-extrabold tracking-[2.5px] text-steel uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
          {t("eyebrow")}
        </p>
        <h1 className="relative mt-3 font-heading tracking-[-0.02em] text-[46px] leading-[1.02] font-extrabold text-navbar motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[820px]:text-[31px]">
          {title}
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
          <a
            href={PHONE.href}
            className="btn-shine rounded-full border-2 border-white/90 bg-[image:var(--grad-round)] px-6 py-3 font-bold text-brand shadow-[inset_0_-3px_6px_rgb(var(--brand-rgb)/0.14),0_8px_18px_rgb(var(--ink-rgb)/0.16)] transition-all duration-300 hover:border-white hover:bg-[image:var(--grad-btn)] hover:text-white"
          >
            {t("call")} {PHONE.label}
          </a>
        </div>
      </section>
    </main>
  );
}
