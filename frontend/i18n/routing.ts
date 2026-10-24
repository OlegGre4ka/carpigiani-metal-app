import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk", "en"],
  defaultLocale: "uk",
  // Always open in Ukrainian; browser language is ignored.
  localeDetection: false,
  // Ukrainian pages have no /uk prefix, so old site addresses stay the same
  // (/maestro, /news, ...). English pages live under /en.
  localePrefix: "as-needed",
});