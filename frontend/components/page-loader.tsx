import { useTranslations } from "next-intl";

import { RingLoader } from "@/components/cone-loader";

/** Loader shown while the page data comes from the server: the coffee-coloured spinning ring.
 *  fullPage: a full screen high (plus room for the header), so nothing below it (texts, footer)
 *  peeks in at the bottom until the page is ready; the ring stays in the middle of what is seen.
 *  Without fullPage: a block of the given height, for a part of the page (e.g. the cards on the home page). */
export function PageLoader({ fullPage = false }: { fullPage?: boolean }) {
  const t = useTranslations("Loader");

  return (
    <div
      className={`flex w-full items-center justify-center ${
        fullPage ? "min-h-svh pb-40 max-[820px]:pb-24" : "min-h-130 max-[820px]:min-h-90"
      }`}
    >
      <RingLoader label={t("text")} />
    </div>
  );
}
