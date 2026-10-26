import type { Metadata } from "next";
import { Suspense } from "react";
import { Golos_Text, Inter_Tight, Manrope, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/admin/backend";
import { loadEquipmentCategories, loadSiteBrands } from "@/lib/equipment-categories";
import { loadContacts, loadEquipmentMap, loadNewsMenu } from "@/lib/site-pages";
import { ContactsSync } from "@/components/contacts-sync";
import { SiteFooter } from "@/components/site-footer";
import { ContactWidget } from "@/components/contact-widget";
import { FontPicker } from "@/components/font-picker";
import "../globals.css";

// Font of the whole site: Manrope (text and headings; see app/theme.css).
// Keep the "cyrillic" subset: the site is in Ukrainian.
const fontSans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// TEMPORARY: stricter fonts to compare (the switcher in the corner, only on the local site).
// When Oleh chooses one, keep only it here and in app/theme.css, and remove the switcher.
const fontInterTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "cyrillic"], display: "swap" });
const fontMontserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"], display: "swap" });
const fontGolos = Golos_Text({ variable: "--font-golos", subsets: ["latin", "cyrillic"], display: "swap" });
const fontChoices = `${fontInterTight.variable} ${fontMontserrat.variable} ${fontGolos.variable}`;


type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Pre-renders a page for every language.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// The browser tab title comes from the translation files.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className={`${fontSans.variable} ${fontChoices} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* Without JavaScript blocks that appear on scroll (components/reveal.tsx) are simply shown */}
        <noscript>
          <style>{".reveal,.reveal [data-reveal-kids]>*,.reveal [data-reveal-rows]>*,.reveal [data-reveal-pop]{opacity:1!important;transform:none!important;scale:1!important;clip-path:none!important}"}</style>
        </noscript>
        <NextIntlClientProvider>
          {/* The splash screen with the logo (components/site-splash.tsx) is switched off until the
              client's new logo and its animation are ready */}
          {/* The page is ready at once without the admin item; it is added only for a logged-in admin */}
          <Suspense fallback={<SiteHeader />}>
            <HeaderForVisitor />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          {/* The contacts come from the admin panel; until then the footer shows the usual ones */}
          <Suspense fallback={<SiteFooter />}>
            <FooterWithContacts />
          </Suspense>
          <ContactWidget />
          {process.env.NODE_ENV === "development" && <FontPicker />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Header with data from the server: is this visitor a logged-in admin (only asked when the
// login cookie exists), the visible brands (admin panel → "Виробники") with their categories for
// the "Manufacturers" and "Equipment catalog" menus, and the news pages
async function HeaderForVisitor() {
  const locale = await getLocale();
  const [user, siteBrands, news] = await Promise.all([getCurrentUser(), loadSiteBrands(), loadNewsMenu(locale)]);
  // Each brand: its categories, each with its equipment that has a page (the submenu that
  // slides out on hover)
  const brands = await Promise.all(
    siteBrands.map(async (brand) => {
      const [list, map] = await Promise.all([loadEquipmentCategories(brand.key), loadEquipmentMap(locale, brand.key)]);
      const groups = new Map(map.map((c) => [c.href, c.groups]));
      return {
        key: brand.key,
        href: brand.href,
        title: locale === "en" ? brand.title_en : brand.title_uk,
        logo: brand.logo_url,
        categories: list.map((c) => ({
          href: c.href,
          title: locale === "en" ? c.title_en : c.title_uk,
          groups: groups.get(c.href) ?? [],
        })),
      };
    }),
  );
  return <SiteHeader isAdmin={Boolean(user)} brands={brands} news={news} />;
}

// Footer with the contacts from the admin panel; the phones also go to the contact forms
async function FooterWithContacts() {
  const contacts = await loadContacts(await getLocale());
  return (
    <>
      <SiteFooter contacts={contacts} />
      {contacts && <ContactsSync phones={contacts.phones} />}
    </>
  );
}
