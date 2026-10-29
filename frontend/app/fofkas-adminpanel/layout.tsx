import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { siteFontVariables } from "@/lib/site-fonts";
import "../globals.css";

// Admin panel: its own root layout (Ukrainian only, no site header and footer). Its own font is
// Manrope; the fonts of the site are there too, to preview them in "Загальні налаштування".
const fontSans = Manrope({
  variable: "--font-manrope-admin",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "Адмін-панель · Carpigiani",
  // Never shown in Google
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${fontSans.variable} ${siteFontVariables} h-full antialiased`}>
      <body className={`${fontSans.className} min-h-full`}>{children}</body>
    </html>
  );
}
