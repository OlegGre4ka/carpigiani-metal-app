import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SupportEditor } from "@/components/admin/support-editor";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ id: string }> };

// A page of the "Support" menu (4.11): its settings and the article of its topic shown open; under
// them the articles of the topic. The address is read inside Suspense, as Next.js asks.
export default function SupportPageSettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Props) {
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId) || pageId <= 0) notFound();
  return <SupportEditor key={pageId} id={pageId} />;
}
