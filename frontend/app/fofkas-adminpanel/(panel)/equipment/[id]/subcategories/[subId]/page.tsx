import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SubcategoryForm } from "@/components/admin/subcategory-form";
import { AdminLoader } from "@/components/cone-loader";

type Props = { params: Promise<{ id: string; subId: string }> };

// A subcategory: its name and the list of its equipment (shown on the category page).
// The address (subcategory number) is read inside Suspense, as Next.js asks: the menu and the
// frame of the admin panel show at once, and the cone loader stands in place of the form.
export default function SubcategoryPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Subcategory params={params} />
    </Suspense>
  );
}

async function Subcategory({ params }: Props) {
  const { subId } = await params;
  const subcategoryId = Number(subId);
  if (!Number.isInteger(subcategoryId) || subcategoryId <= 0) notFound();
  return <SubcategoryForm key={subcategoryId} id={subcategoryId} />;
}
