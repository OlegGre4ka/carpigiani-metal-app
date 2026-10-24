import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TopicNews } from "@/components/admin/news-section";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ id: string }> };

// One topic of news: its news and "Add news" (the "Page" button of the topic, or the topic in
// the menu on the left). The address is read inside Suspense, as Next.js asks.
export default function TopicPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Topic params={params} />
    </Suspense>
  );
}

async function Topic({ params }: Props) {
  const { id } = await params;
  const topicId = Number(id);
  if (!Number.isInteger(topicId) || topicId <= 0) notFound();
  return <TopicNews key={topicId} topicId={topicId} />;
}
