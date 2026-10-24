import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/admin/page-builder";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ id: string }> };

// Page of one news item: the same page builder as for categories and equipment; on top the
// fields of its card (date, topic, main photo, short text). The address is read inside
// Suspense, as Next.js asks.
export default function NewsPageBuilderPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Builder params={params} />
    </Suspense>
  );
}

async function Builder({ params }: Props) {
  const { id } = await params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId) || newsId <= 0) notFound();
  return <PageBuilder key={newsId} target={{ kind: "news", id: newsId }} />;
}
