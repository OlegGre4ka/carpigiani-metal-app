import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { BrandPage } from "@/components/brand-page";
import { SitePage } from "@/components/site-page";
import { ComingSoon } from "@/components/coming-soon";
import { NewsArticle } from "@/components/news-article";
import { NewsListPage } from "@/components/news-list-page";
import { PageLoader } from "@/components/page-loader";
import { routing } from "@/i18n/routing";
import { loadBrandPage, loadSitePage } from "@/lib/site-pages";
import { comingSoonPages } from "@/lib/coming-soon-pages";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

// Addresses without their own folder in app/[locale]:
// 1. a page made in the admin panel: of a brand (/carpigiani, /ifi, /isa and new brands),
//    of an equipment category (/gelato, /soft, ...),
//    of a piece of equipment (/maestro, /labotronic, ...), of a news item (/230500-back-to-roots)
//    or of a news topic (/news/content/5-interesting: its news, page by page: ?page=2);
// 2. otherwise a temporary page "being prepared": for addresses from the menu and the slider
//    the title comes from lib/coming-soon-pages.ts, for any other address (e.g. old site links
//    like /labotronic in pasted texts) the title is made from the address itself.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(comingSoonPages).map((page) => ({ locale, slug: [page] })),
  );
}

function titleKey(slug: string[]) {
  return slug.length === 1 ? comingSoonPages[slug[0]] : undefined;
}

// "/labotronic" -> "Labotronic", "/fast-food/rex" -> "Rex"
function titleFromAddress(slug: string[]) {
  let last = slug[slug.length - 1] ?? "";
  try {
    last = decodeURIComponent(last);
  } catch {
    // a broken % code: the address stays as it is
  }
  const words = last.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

function addressOf(slug: string[]) {
  try {
    return `/${slug.map(decodeURIComponent).join("/")}`;
  } catch {
    // A broken address (bad % code) cannot be a category page
    return "";
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const brand = await loadBrandPage(addressOf(slug), locale);
  if (brand) return { title: `${brand.title} · Carpigiani`, description: brand.subtitle || undefined };
  const page = await loadSitePage(addressOf(slug), locale);
  if (page) return { title: `${page.title} · Carpigiani` };

  const key = titleKey(slug);
  const t = await getTranslations({ locale });
  const title = key ? t(key) : titleFromAddress(slug);
  // Not finished pages are kept out of Google for now
  return { title: `${title} · Carpigiani`, robots: { index: false } };
}

// The page is read inside Suspense: header and footer show at once, and until the page
// data comes from the server a loader fills the screen (nothing below it is visible).
export default function SlugPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageLoader fullPage />}>
      <PageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PageContent({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const brand = await loadBrandPage(addressOf(slug), locale);
  if (brand) return <BrandPage page={brand} />;
  const page = await loadSitePage(addressOf(slug), locale);
  if (page?.kind === "news") return <NewsArticle page={page} href={addressOf(slug)} />;
  if (page?.kind === "news_topic") {
    const number = Number((await searchParams).page);
    return <NewsListPage page={Number.isInteger(number) && number > 1 ? number : 1} topicHref={page.topic_href} />;
  }
  if (page) return <SitePage page={page} href={addressOf(slug)} locale={locale} />;

  const key = titleKey(slug);
  const t = await getTranslations({ locale });
  return <ComingSoon title={key ? t(key) : titleFromAddress(slug)} />;
}
