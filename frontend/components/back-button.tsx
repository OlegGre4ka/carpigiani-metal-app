"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

/** Metal round "back" button (29.10): to the previous page, or to the home page when the site
 *  was opened right here. Phones: in the header; larger screens: before the breadcrumbs. */
export function BackButton({ className = "", small = false }: { className?: string; small?: boolean }) {
  const t = useTranslations("Nav");
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={t("back")}
      title={t("back")}
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[image:var(--metal)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_6px_14px_rgb(0_0_0/0.25)] transition-transform hover:-translate-x-0.5 ${
        small ? "size-7.5" : "size-9.5"
      } ${className}`}
    >
      <ArrowLeft aria-hidden="true" className={small ? "size-3.75" : "size-4.5"} strokeWidth={2.4} />
    </button>
  );
}
