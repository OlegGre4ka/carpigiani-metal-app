import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/admin/page-builder";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ key: string; id: string }> };

// Page builder of one equipment category (the "Page" button in the list of categories,
// or the category in the menu on the left).
// The address (category number) is read inside Suspense, as Next.js asks: the menu and the
// frame of the admin panel show at once, and the cone loader stands in place of the builder.
export default function CategoryPageBuilderPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Builder params={params} />
    </Suspense>
  );
}

async function Builder({ params }: Props) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound();
  return <PageBuilder key={categoryId} target={{ kind: "category", id: categoryId }} />;
}
