"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

/** Metal round "back" button (29.10): to the previous page, or to the home page when the site
 *  was opened right here. Phones only, in the header (larger screens: still to be thought over).
 *  The same look as the "Up" button and the slider arrows (.metal-round: navy on hover). */
export function BackButton({ className = "" }: { className?: string }) {
  const t = useTranslations("Nav");
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={t("back")}
      title={t("back")}
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className={`metal-round back-btn flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-[image:var(--metal)] text-ink shadow-[inset_0_-3px_6px_rgb(var(--ink-rgb)/0.18)] transition-all duration-300 hover:text-white ${className}`}
    >
      <ArrowLeft aria-hidden="true" className="size-4.5" strokeWidth={2.4} />
    </button>
  );
}
