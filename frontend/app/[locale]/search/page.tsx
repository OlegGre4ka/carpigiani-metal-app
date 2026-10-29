import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageLoader } from "@/components/page-loader";
import { SearchPage } from "@/components/search-page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });
  // Results of a search are not for Google
  return { title: `${t("title")} · Carpigiani`, robots: { index: false } };
}

// All results of the search over the site (/search?q=…); the panel in the header leads here
export default function Search({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      <Suspense fallback={<PageLoader fullPage />}>
        <Head params={params} />
        <SearchPage />
      </Suspense>
    </main>
  );
}

async function Head({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });
  return (
    <>
      <Breadcrumbs items={[{ title: t("title") }]} />
      <h1 className="mb-5.5 font-heading text-[33px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark max-[820px]:text-[25px]">{t("title")}</h1>
    </>
  );
}
