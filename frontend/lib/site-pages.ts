import "server-only";

import { cache } from "react";

// The Next.js server talks to the API directly
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// Blocks of pages built in the admin panel, as the site gets them: only visible blocks with
// something to show, texts in one language. Made by the backend: app/routers/pages_router.py
export type SliderBlock = { id: string; type: "slider"; images: string[]; autoplay: boolean };
export type TextBlock = { id: string; type: "text"; title: string; html: string };
export type GalleryBlock = {
  id: string;
  type: "gallery";
  photos: { image: string; caption: string; link: string }[];
  per_row: 3 | 4 | 6;
  captions: boolean;
  zoom: boolean;
};
export type FeaturesBlock = { id: string; type: "features"; title: string; items: { title: string; text: string }[] };
export type TableBlock = { id: string; type: "table"; title: string; header: string[]; rows: string[][] };
export type VideoBlock = { id: string; type: "video"; caption: string; video_id: string };

/** Equipment card of a subcategory.
 *  label: the name of the category, shown above the name.
 *  href: the page of the equipment; empty while that page is not made (the card is not a link) */
export type EquipmentCard = { id: string; image: string | null; title: string; label: string; text: string; href: string };
/** A subcategory on the category page: its title (empty when hidden) and its equipment */
export type SubcategoryBlock = { id: string; type: "subcategory"; title: string; items: EquipmentCard[] };

/** PDF catalogs to download (equipment pages); the file is already the one for the language */
export type CatalogsBlock = {
  id: string;
  type: "catalogs";
  items: { url: string; name: string; size: number; label: string }[];
};

/** Main photo of an equipment page */
export type PhotoBlock = { id: string; type: "photo"; image: string };

export type PageBlock =
  | PhotoBlock
  | SliderBlock
  | TextBlock
  | GalleryBlock
  | FeaturesBlock
  | TableBlock
  | VideoBlock
  | SubcategoryBlock
  | CatalogsBlock;

/** A page built in the admin panel, already in the language of the site (English texts fall back
 *  to Ukrainian where they are empty): a category page (/gelato), an equipment page (/labotronic),
 *  a news item (/230500-back-to-roots) or the page of a news topic (/news/content/5-interesting). */
export type SitePageData = {
  kind: "category" | "equipment" | "news" | "news_topic";
  title: string;
  /** The category (for the breadcrumbs); on an equipment page, the category it belongs to */
  category_title: string;
  category_href: string;
  /** Equipment page: the name of the equipment ("Carpigiani Maestro") */
  item_title: string;
  /** Brand of its category: Carpigiani equipment or IFI / ISA showcases */
  brand?: "carpigiani" | "ifi" | "isa";
  blocks: PageBlock[];
  /** News: its date ("2023-05-23"), main photo, topic (empty without one) and the colour of
   *  the topic label. Topic page: topic_title and topic_href are the topic itself. */
  date?: string;
  image?: string | null;
  topic_title?: string;
  topic_href?: string;
  topic_tone?: number;
  /** News: the newer and the older news, for the arrows of the page */
  newer?: { href: string; title: string } | null;
  older?: { href: string; title: string } | null;
  /** Equipment: the models before and after in its category, for the arrows of the page */
  prev_item?: { href: string; title: string; image: string | null } | null;
  next_item?: { href: string; title: string; image: string | null } | null;
};

/** The page with this address in this language, or null if there is none yet.
 *  Asked once per visit even if both the tab title and the page need it. */
export const loadSitePage = cache(async (href: string, lang: string): Promise<SitePageData | null> => {
  try {
    const query = new URLSearchParams({ href, lang: lang === "en" ? "en" : "uk" });
    const response = await fetch(`${BACKEND_URL}/api/pages?${query}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SitePageData;
  } catch {
    // API is not reachable: the page is treated as not made yet
    return null;
  }
});

/** The "map" of equipment (right column of equipment pages): categories, inside them
 *  subcategories (small headings) and the equipment that has a page. */
export type EquipmentMapCategory = {
  title: string;
  href: string;
  groups: { title: string; items: { title: string; href: string }[] }[];
  /** How many there are in all (the number next to the name); without it the items are counted */
  count?: number;
  /** The list is shortened: "All in the topic (N) →" leads here (the map of news) */
  more?: { href: string; count: number } | null;
};

export const loadEquipmentMap = cache(async (lang: string, brand: string = "carpigiani"): Promise<EquipmentMapCategory[]> => {
  try {
    const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk", brand });
    const response = await fetch(`${BACKEND_URL}/api/pages/catalog?${query}`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as EquipmentMapCategory[];
  } catch {
    return [];
  }
});

/** All showcases of a brand for the block with chips (/ifi, the home page): the chips are its
 *  categories, a card knows its category (to filter) */
export type ShowcaseCard = EquipmentCard & { category: number };
export type BrandShowcases = { chips: { id: number; title: string }[]; items: ShowcaseCard[] };

export const loadShowcases = cache(async (lang: string, brand: string): Promise<BrandShowcases> => {
  try {
    const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk", brand });
    const response = await fetch(`${BACKEND_URL}/api/pages/showcases?${query}`, { cache: "no-store" });
    if (!response.ok) return { chips: [], items: [] };
    return (await response.json()) as BrandShowcases;
  } catch {
    return { chips: [], items: [] };
  }
});

/** A topic of news on the site; tone: its place among the topics (the colour of its label) */
export type NewsTopicLink = { title: string; href: string; tone: number };

/** A news card: its page, title, date ("2023-05-23"), main photo, short text and topic */
export type NewsCard = {
  id: number;
  href: string;
  title: string;
  date: string;
  image: string | null;
  summary: string;
  topic: NewsTopicLink | null;
};

/** A part of the list of news (newest first): all of them or of one topic, with the topics for
 *  the chips; total: how many news there are in all */
export type NewsListData = {
  topics: NewsTopicLink[];
  topic: NewsTopicLink | null;
  items: NewsCard[];
  offset: number;
  total: number;
};

const NO_NEWS: NewsListData = { topics: [], topic: null, items: [], offset: 0, total: 0 };

/** limit news from offset; topic: the address of a topic (only its news) */
export const loadNews = cache(
  async (lang: string, offset: number = 0, limit: number = 12, topic: string = ""): Promise<NewsListData> => {
    try {
      const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk", offset: String(offset), limit: String(limit) });
      if (topic) query.set("topic", topic);
      const response = await fetch(`${BACKEND_URL}/api/pages/news?${query}`, { cache: "no-store" });
      if (!response.ok) return NO_NEWS;
      return (await response.json()) as NewsListData;
    } catch {
      return NO_NEWS;
    }
  },
);

/** For the "News" menu: its topics, and the addresses of all news and topics on the site */
export type NewsMenu = { topics: NewsTopicLink[]; pages: string[] };

export const loadNewsMenu = cache(async (lang: string): Promise<NewsMenu> => {
  try {
    const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk" });
    const response = await fetch(`${BACKEND_URL}/api/pages/news-menu?${query}`, { cache: "no-store" });
    if (!response.ok) return { topics: [], pages: [] };
    return (await response.json()) as NewsMenu;
  } catch {
    return { topics: [], pages: [] };
  }
});

/** The map "News by topic" of a news page: topics with their newest news (current: the open one) */
export const loadNewsMap = cache(async (lang: string, current: string): Promise<EquipmentMapCategory[]> => {
  try {
    const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk", current });
    const response = await fetch(`${BACKEND_URL}/api/pages/news-map?${query}`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as EquipmentMapCategory[];
  } catch {
    return [];
  }
});

/** Contacts of the company from the admin panel, in the language of the page */
export type SiteContacts = {
  phones: { label: string; href: string }[];
  email: string;
  company: string;
  street: string;
  city: string;
  hours: string;
  lat: number;
  lng: number;
};

export const loadContacts = cache(async (lang: string): Promise<SiteContacts | null> => {
  try {
    const query = new URLSearchParams({ lang: lang === "en" ? "en" : "uk" });
    const response = await fetch(`${BACKEND_URL}/api/pages/contacts?${query}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SiteContacts;
  } catch {
    return null;
  }
});
