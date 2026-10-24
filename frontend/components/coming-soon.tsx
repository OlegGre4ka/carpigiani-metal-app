import { getTranslations } from "next-intl/server";

import { ConeDraw } from "@/components/cone-draw";
import { Link } from "@/i18n/navigation";

// Mobile number (the same as in the footer)
const PHONE = { label: "+38 067 244 1109", href: "tel:+380672441109" };

/** Temporary page: "This page is being prepared" */
export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("ComingSoon");

  return (
    <main className="flex flex-1 items-center justify-center px-20 pt-6 pb-20 max-[820px]:px-4 max-[820px]:pb-28">
      <section className="relative w-full max-w-180 overflow-hidden rounded-[36px] border border-white/90 bg-white/70 px-14 py-14 text-center shadow-[0_24px_60px_rgba(90,60,40,0.12)] backdrop-blur-sm max-[820px]:rounded-[28px] max-[820px]:px-6 max-[820px]:py-10">
        {/* Soft cream glow behind the cone */}
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#f3dcc0_0%,transparent_70%)] opacity-70"
        />

        {/* The brand cone draws itself */}
        <ConeDraw tagline={false} className="relative mx-auto h-44 w-auto max-[820px]:h-36" />

        <p className="relative mt-6 text-xs font-extrabold tracking-[2.5px] text-gold uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
          {t("eyebrow")}
        </p>
        <h1 className="relative mt-3 font-heading text-[56px] leading-[1.02] font-bold text-caramel motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[820px]:text-[38px]">
          {title}
        </h1>
        <p className="relative mx-auto mt-4 max-w-[46ch] text-lg leading-relaxed text-cocoa-soft motion-safe:animate-fade-up motion-safe:[animation-delay:240ms] max-[820px]:text-base">
          {t("text")}
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:320ms]">
          <Link
            href="/"
            className="btn-shine rounded-full bg-[linear-gradient(180deg,#b88a5e,#7a5232)] px-7 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(122,82,50,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(122,82,50,0.45)]"
          >
            {t("home")}
          </Link>
          <a
            href={PHONE.href}
            className="btn-shine rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_35%_30%,#fff8ec,#f3dcc0_70%)] px-6 py-3 font-bold text-caramel shadow-[inset_0_-3px_6px_rgba(122,82,50,0.14),0_8px_18px_rgba(74,52,38,0.16)] transition-all duration-300 hover:border-white hover:bg-[linear-gradient(180deg,#b88a5e,#7a5232)] hover:text-white"
          >
            {t("call")} {PHONE.label}
          </a>
        </div>
      </section>
    </main>
  );
}
