import { Geologica, Golos_Text, Inter_Tight, Manrope, Montserrat, Onest, Playfair_Display, Rubik, Unbounded } from "next/font/google";

// Fonts of the site (29.10): the client chooses the font of the titles and of the texts in the
// admin panel → "Загальні налаштування" (saved on the server, /api/pages/general). All have
// Ukrainian letters. Only Inter Tight (the usual one) is loaded in advance; the browser takes
// any other only when it is chosen. Used by both root layouts (the site and the admin panel,
// where the choice is previewed).

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "cyrillic"], display: "swap" });
// (next/font wants each set of options written out in full)
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const golos = Golos_Text({ variable: "--font-golos", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const geologica = Geologica({ variable: "--font-geologica", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], display: "swap", preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "cyrillic"], display: "swap", preload: false });

/** For the class of <html>: every font can be switched on */
export const siteFontVariables = [interTight, manrope, montserrat, golos, onest, geologica, rubik, unbounded, playfair]
  .map((font) => font.variable)
  .join(" ");

export type SiteFont = {
  key: string;
  label: string;
  /** The CSS variable of the font */
  css: string;
  /** For long texts too (false: only for titles, the letters are too wide or too decorative) */
  forText: boolean;
  /** A few words for the admin panel */
  note: string;
};

export const SITE_FONTS: SiteFont[] = [
  { key: "inter-tight", label: "Inter Tight", css: "--font-inter-tight", forText: true, note: "Строгий і сучасний (зараз на сайті)" },
  { key: "manrope", label: "Manrope", css: "--font-manrope", forText: true, note: "М'який, округлий" },
  { key: "montserrat", label: "Montserrat", css: "--font-montserrat", forText: true, note: "Широкий, впевнений" },
  { key: "golos", label: "Golos Text", css: "--font-golos", forText: true, note: "Спокійний, дуже читабельний" },
  { key: "onest", label: "Onest", css: "--font-onest", forText: true, note: "Чистий, технологічний" },
  { key: "geologica", label: "Geologica", css: "--font-geologica", forText: true, note: "Чіткий, інженерний" },
  { key: "rubik", label: "Rubik", css: "--font-rubik", forText: true, note: "Дружній, трохи заокруглений" },
  { key: "unbounded", label: "Unbounded", css: "--font-unbounded", forText: false, note: "Широкий, преміальний — тільки для заголовків" },
  { key: "playfair", label: "Playfair Display", css: "--font-playfair", forText: false, note: "Класика з засічками, «італійський» — тільки для заголовків" },
];

export const DEFAULT_FONT = "inter-tight";

const byKey = new Map(SITE_FONTS.map((font) => [font.key, font]));

/** The font for a key (unknown → the usual one; a font only for titles is not used for texts) */
export function siteFont(key: string | undefined, forText = false): SiteFont {
  const font = byKey.get(key ?? "") ?? byKey.get(DEFAULT_FONT)!;
  return forText && !font.forText ? byKey.get(DEFAULT_FONT)! : font;
}

/** The CSS that sets the chosen fonts for the whole site */
export function siteFontCss(title: string | undefined, text: string | undefined) {
  const family = (font: SiteFont) => `var(${font.css}), Arial, sans-serif`;
  return `:root{--font-title:${family(siteFont(title))};--font-text:${family(siteFont(text, true))}}`;
}
