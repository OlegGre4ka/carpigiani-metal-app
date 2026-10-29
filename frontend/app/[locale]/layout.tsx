import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/admin/backend";
import { loadEquipmentCategories, loadSiteBrands } from "@/lib/equipment-categories";
import { loadContacts, loadEquipmentMap, loadGeneral, loadNewsMenu } from "@/lib/site-pages";
import { siteFontCss, siteFontVariables } from "@/lib/site-fonts";
import { ContactsSync } from "@/components/contacts-sync";
import { SiteFooter } from "@/components/site-footer";
import { ContactWidget } from "@/components/contact-widget";
import { FontPicker } from "@/components/font-picker";
import { SiteSplash } from "@/components/site-splash";
import "../globals.css";

// Fonts of the site: lib/site-fonts.ts (all of them can be switched on; the chosen ones come from
// the admin panel → "Загальні налаштування", see SiteFonts below).

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
    <html lang={locale} className={`${siteFontVariables} h-full antialiased`}>
      <body className="site-body min-h-full flex flex-col font-sans">
        {/* Without JavaScript blocks that appear on scroll (components/reveal.tsx) are simply shown */}
        <noscript>
          <style>{".reveal,.reveal [data-reveal-kids]>*,.reveal [data-reveal-rows]>*,.reveal [data-reveal-pop]{opacity:1!important;transform:none!important;scale:1!important;clip-path:none!important}"}</style>
        </noscript>
        {/* The fonts chosen in the admin panel (first, so they come with the first part of the page) */}
        <Suspense fallback={null}>
          <SiteFonts />
        </Suspense>
        <NextIntlClientProvider>
          {/* The splash screen with the logo and its running spark (opening and reloading the site) */}
          <SiteSplash />
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
          {/* The font switcher is hidden for now (29.10: Inter Tight chosen); to compare fonts again,
              set NEXT_PUBLIC_FONT_PICKER=1 */}
          {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_FONT_PICKER === "1" && <FontPicker />}
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
          // An empty page of the category: its name in the menu is plain text
          link: c.has_page !== false,
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

// The fonts of the titles and of the texts chosen in the admin panel. Not saved yet (or the
// server is not answering): the usual ones from app/theme.css (Inter Tight).
async function SiteFonts() {
  const general = await loadGeneral();
  if (!general) return null;
  return <style>{siteFontCss(general.font_title, general.font_text)}</style>;
}
