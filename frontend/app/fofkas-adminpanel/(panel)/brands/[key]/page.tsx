import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/admin/page-builder";
import { AdminLoader } from "@/components/cone-loader";
import { getAdminBrands } from "@/lib/admin/backend";

type Props = { params: Promise<{ key: string }> };

// Section of one brand (Carpigiani, IFI, ISA or a brand added on "Виробники"): the builder of its
// page on the site (/ifi): title, line under it, blocks; the "Categories" block holds the list of
// its categories (add, edit, hide, order). The address is read inside Suspense, as Next.js asks:
// the menu and the frame show at once, the cone loader stands in place of the builder.
export default function BrandPageBuilderPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Categories params={params} />
    </Suspense>
  );
}

async function Categories({ params }: Props) {
  const { key } = await params;
  const brands = await getAdminBrands();
  const brand = brands.find((item) => item.key === key);
  if (!brand) notFound();
  return <PageBuilder key={brand.key} target={{ kind: "brand", brand, brands }} />;
}
