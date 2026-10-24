import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { ContactsPage } from "@/components/contacts-page";
import { PageLoader } from "@/components/page-loader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: `${t("contacts")} · Carpigiani` };
}

// Contacts: the map of the office, phones, email, address, hours and the contact form.
// Everything comes from the admin panel ("Contacts"); read inside Suspense, a loader fills
// the screen until it comes.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader fullPage />}>
      <ContactsPage />
    </Suspense>
  );
}
