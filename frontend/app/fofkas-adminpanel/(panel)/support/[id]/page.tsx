import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/admin/page-builder";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ id: string }> };

// A page of the "Support" menu (4.11): the same page builder as for news; on top its address,
// topic of news and the "contact us" card, at the bottom the articles of the topic. The address
// is read inside Suspense, as Next.js asks.
export default function SupportPageBuilderPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Builder params={params} />
    </Suspense>
  );
}

async function Builder({ params }: Props) {
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId) || pageId <= 0) notFound();
  return <PageBuilder key={pageId} target={{ kind: "support", id: pageId }} />;
}
