import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/admin/page-builder";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ key: string; id: string; subId: string; itemId: string }> };

// Page of one piece of equipment (the "Page" button next to the equipment in its subcategory).
// The same page builder as for categories; only the set of blocks differs.
// The address is read inside Suspense, as Next.js asks: the menu and the frame of the admin
// panel show at once, and the cone loader stands in place of the builder.
export default function EquipmentPageBuilderPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Builder params={params} />
    </Suspense>
  );
}

async function Builder({ params }: Props) {
  const { id, subId, itemId } = await params;
  const categoryId = Number(id);
  const subcategoryId = Number(subId);
  const item = decodeURIComponent(itemId);
  const valid = (n: number) => Number.isInteger(n) && n > 0;
  if (!valid(categoryId) || !valid(subcategoryId) || !/^[A-Za-z0-9_-]{1,40}$/.test(item)) notFound();
  return (
    <PageBuilder
      key={`${subcategoryId}-${item}`}
      target={{ kind: "equipment", categoryId, subcategoryId, itemId: item }}
    />
  );
}
