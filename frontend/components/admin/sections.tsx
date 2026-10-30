import type { ReactNode } from "react";

import { BRANDS_PATH, brandBase, type AdminBrand } from "@/lib/admin/brands";

export type AdminSubsection = {
  href: string;
  title: string;
  /** Categories from the database: the key of their brand */
  brand?: string;
  /** Shown under the sub-section only while one of its pages is open (subcategories of a category) */
  children?: AdminSubsection[];
};

export type AdminSection = {
  href: string;
  title: string;
  text: string;
  icon: ReactNode;
  /** Sub-sections open under the section in the menu */
  children?: AdminSubsection[];
  /** No page of its own: a click only opens its sub-sections */
  groupOnly?: boolean;
  /** Lit only on its own address, not on the pages under it ("Виробники") */
  exactOnly?: boolean;
  /** Section of a brand: its key (its categories go under it) */
  brand?: string;
  /** A brand hidden from the site: dimmed in the menu */
  hidden?: boolean;
};

/** Icon of a brand section: a machine with a cone */
export const brandIcon = (
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M5 9h14M9 13l3 5 3-5z" />
  </>
);

/** "Виробники": the list of brands (add, edit, hide, order, delete). Lit only on its own page,
 *  not on the pages of a brand (each brand has its own section under it). */
export const brandsSection: AdminSection = {
  href: BRANDS_PATH,
  title: "Виробники",
  text: "Бренди обладнання: назва, лого, адреса сторінки, порядок і показ на сайті",
  icon: (
    <>
      <path d="M3 21V10l5 3V10l5 3V7l8 4v10z" />
      <path d="M7 17h2M12 17h2M17 17h1" />
    </>
  ),
  exactOnly: true,
};

/** Section of each brand from the database: its categories → subcategories → equipment */
export function brandSections(brands: AdminBrand[]): AdminSection[] {
  return brands.map((brand) => ({
    href: brandBase(brand.key),
    title: brand.title_uk,
    text: `Категорії ${brand.title_uk} з підкатегоріями й обладнанням`,
    icon: brandIcon,
    brand: brand.key,
    hidden: !brand.is_visible,
  }));
}

// Other sections of the admin panel (after the brands). New sections are added here.
// Under "News" its topics (see AdminSidebar).
export const adminSections: AdminSection[] = [
  {
    href: "/fofkas-adminpanel/news",
    title: "Новини",
    text: "Теми новин і новини з фото, датою й текстом",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
  },
  {
    href: "/fofkas-adminpanel/requests",
    title: "Заявки",
    text: "Повідомлення з форми «Зв'язатися з нами»",
    icon: (
      <>
        <path d="M4 5h16v11H8l-4 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
  },
  {
    href: "/fofkas-adminpanel/contacts",
    title: "Контакти",
    text: "Телефони, email, адреса й точка на мапі",
    icon: (
      <>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
  },
  {
    href: "/fofkas-adminpanel/settings",
    title: "Загальні налаштування",
    text: "Шрифти заголовків і тексту всього сайту",
    // 30.10: each kind of settings is its own sub-item (more will come)
    groupOnly: true,
    children: [{ href: "/fofkas-adminpanel/settings/fonts", title: "Шрифти" }],
    icon: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
  },
];

export function SectionIcon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}
