import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { NewsListPage } from "@/components/news-list-page";
import { PageLoader } from "@/components/page-loader";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

/** Number of the page from the address: /news?page=2 → 2 (anything else → 1) */
function pageOf(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "News" });
  const page = pageOf((await searchParams).page);
  return { title: `${t("title")}${page > 1 ? ` · ${t("page", { number: page })}` : ""} · Carpigiani` };
}

// All news, newest first, 12 per page (old addresses /news?start=16 are sent here by proxy.ts).
// Read inside Suspense: header and footer show at once,
// a loader fills the screen until the news come from the server.
export default function NewsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageLoader fullPage />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: Props) {
  const { page } = await searchParams;
  return <NewsListPage page={pageOf(page)} />;
}
