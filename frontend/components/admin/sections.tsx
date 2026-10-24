import type { ReactNode } from "react";

export type AdminSubsection = {
  href: string;
  title: string;
  /** Categories from the database: whose they are (Carpigiani equipment, IFI or ISA showcases) */
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
  /** No page of its own: a click only opens its sub-sections ("Showcases") */
  groupOnly?: boolean;
};

const showcaseIcon = (
  <>
    <rect x="3" y="9" width="18" height="10" rx="2" />
    <path d="M5 9l2-4h10l2 4M3 14h18" />
  </>
);

// Sections of the admin panel. New sections and sub-sections are added here.
// Under "Equipment", "IFI showcases" and "ISA showcases" the categories of that brand from the
// database, with their subcategories; under "News" its topics (see AdminSidebar).
export const adminSections: AdminSection[] = [
  {
    href: "/fofkas-adminpanel/equipment",
    title: "Обладнання для виробництва морозива",
    text: "Картки видів морозива на головній: Gelato, Soft, Stick та інші",
    icon: (
      <>
        <path d="M8 11a4 4 0 1 1 8 0" />
        <path d="M7 11h10l-5 10z" />
      </>
    ),
  },
  // IFI and ISA showcases: the same as equipment (categories → subcategories → showcases)
  ...(["ifi", "isa"] as const).map((brand) => ({
    href: `/fofkas-adminpanel/showcases/${brand}`,
    title: `Вітрини ${brand.toUpperCase()}`,
    text: `Категорії вітрин ${brand.toUpperCase()} з підкатегоріями й вітринами`,
    icon: showcaseIcon,
  })),
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
