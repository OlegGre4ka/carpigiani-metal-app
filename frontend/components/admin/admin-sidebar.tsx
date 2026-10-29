"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { AdminBrand } from "@/lib/admin/brands";

import { SectionIcon, adminSections, brandSections, brandsSection, type AdminSection, type AdminSubsection } from "./sections";

const home: AdminSection = {
  href: "/fofkas-adminpanel",
  title: "Головна",
  text: "Статистика сайту",
  icon: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
};

const NEWS_SECTION = "/fofkas-adminpanel/news";

/** Home, "Виробники", then a section per brand (from the database) with its categories,
 *  then the other sections; under "News" its topics */
function menuItems(brands: AdminBrand[], categories: AdminSubsection[], topics: AdminSubsection[]): AdminSection[] {
  return [
    home,
    brandsSection,
    ...brandSections(brands).map((section) => ({
      ...section,
      children: categories.filter((category) => category.brand === section.brand),
    })),
    ...adminSections.map((section) => (section.href === NEWS_SECTION ? { ...section, children: topics } : section)),
  ];
}

function isActive(pathname: string, href: string, exactOnly = false) {
  if (href === home.href || exactOnly) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** What every menu gets from the server */
type MenuData = { brands: AdminBrand[]; categories: AdminSubsection[]; topics: AdminSubsection[] };

/** List of sections. A section with sub-sections opens a nested list under it. */
function AdminNav({ onNavigate, ...data }: MenuData & { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} {...data} onNavigate={onNavigate} />;
}

/** The same list for the first moment of a page whose address is known only when it opens
 *  (e.g. the page builder of one category): nothing is marked yet */
export function AdminSidebarFallback() {
  return <NavList pathname="" brands={[]} categories={[]} topics={[]} />;
}

function NavList({
  pathname,
  brands,
  categories,
  topics,
  onNavigate,
}: MenuData & {
  pathname: string;
  onNavigate?: () => void;
}) {
  const items = menuItems(brands, categories, topics);
  // The section of the current page is open by default; a click on the arrow flips it
  const [flipped, setFlipped] = useState<string[]>([]);
  // On another page the sections start again from "the section of the page is open": a section
  // opened by hand and then entered (Equipment → one of its categories) must stay open, not fold up
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setFlipped([]);
  }
  const toggle = (href: string) =>
    setFlipped((list) => (list.includes(href) ? list.filter((h) => h !== href) : [...list, href]));

  return (
    <nav aria-label="Розділи адмін-панелі">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exactOnly);
          const exact = pathname === item.href;
          const hasChildren = Boolean(item.children?.length);
          const expanded = hasChildren && active !== flipped.includes(item.href);
          const listId = `admin-sub-${item.href.split("/").pop()}`;

          return (
            <li key={item.href}>
              <div
                className={`flex items-center rounded-2xl transition-colors ${
                  exact ? "bg-navbar text-white" : active ? "bg-white text-ink" : "text-ink hover:bg-white"
                }`}
              >
                {item.groupOnly ? (
                  // No page of its own ("Showcases"): the whole row opens and closes its sub-sections
                  <button
                    type="button"
                    onClick={() => toggle(item.href)}
                    aria-expanded={expanded}
                    aria-controls={listId}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4.5 pl-3.5 text-left text-[15px] leading-snug font-semibold"
                  >
                    <SectionIcon className="size-5 shrink-0">{item.icon}</SectionIcon>
                    <span className="flex-1">{item.title}</span>
                    <Chevron expanded={expanded} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={exact ? "page" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-[15px] leading-snug font-semibold"
                  >
                    <SectionIcon className="size-5 shrink-0">{item.icon}</SectionIcon>
                    <span className={item.hidden ? "opacity-55" : undefined}>{item.title}</span>
                    {/* A brand hidden from the site: still edited here, marked in the menu */}
                    {item.hidden && (
                      <span className="ml-auto shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                        приховано
                      </span>
                    )}
                  </Link>
                )}
                {hasChildren && !item.groupOnly && (
                  <button
                    type="button"
                    onClick={() => toggle(item.href)}
                    aria-expanded={expanded}
                    aria-controls={listId}
                    aria-label={`${expanded ? "Згорнути" : "Розгорнути"}: ${item.title}`}
                    className="mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-ink/8"
                  >
                    <Chevron expanded={expanded} />
                  </button>
                )}
              </div>

              {expanded && (
                <ul id={listId} className="mt-1 mb-1.5 ml-6 flex flex-col gap-0.5 border-l-2 border-mist pl-3">
                  {item.children!.map((child) => {
                    const childExact = pathname === child.href;
                    const childOpen = isActive(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childExact ? "page" : undefined}
                          className={`block rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                            childExact
                              ? "bg-navbar text-white"
                              : childOpen
                                ? "bg-white text-ink"
                                : "text-ink-soft hover:bg-white hover:text-ink"
                          }`}
                        >
                          {child.title}
                        </Link>
                        {/* Subcategories show only under the open category */}
                        {childOpen && Boolean(child.children?.length) && (
                          <ul className="mt-0.5 mb-1 ml-3 flex flex-col gap-0.5 border-l-2 border-mist pl-2.5">
                            {child.children!.map((grandchild) => {
                              const here = pathname === grandchild.href;
                              // Also lit on the pages of its equipment (…/items/…)
                              const inside = isActive(pathname, grandchild.href);
                              return (
                                <li key={grandchild.href}>
                                  <Link
                                    href={grandchild.href}
                                    onClick={onNavigate}
                                    aria-current={here ? "page" : undefined}
                                    className={`block rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                                      inside ? "bg-navbar text-white" : "text-ink-soft hover:bg-white hover:text-ink"
                                    }`}
                                  >
                                    {grandchild.title}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Arrow of a section with sub-sections: points up while they are open */
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4.5 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Menu on the left on large screens */
export function AdminSidebar(data: MenuData) {
  return <AdminNav {...data} />;
}

const noop = () => () => {};

/** On phones and tablets: burger button in the top bar, the menu slides out from the left */
export function AdminMobileMenu(data: MenuData) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The menu is placed straight into <body>: the blurred top bar would otherwise trap it
  const inBrowser = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  // Closes when the page changes (also by "back" in the browser)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Esc closes; the page underneath does not scroll while the menu is open
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="hidden max-[900px]:block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Відкрити меню"
        aria-expanded={open}
        aria-controls="admin-drawer"
        className="flex size-11 items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink transition-colors hover:bg-white"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="size-5.5"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {inBrowser &&
        createPortal(
          <>
            {/* Dark layer behind the menu; a tap on it closes the menu */}
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className={`fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px] transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            <div
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Меню адмін-панелі"
              inert={!open}
              className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col bg-page transition-transform duration-300 ease-out ${
                open ? "translate-x-0 shadow-[18px_0_50px_rgb(var(--ink-rgb)/0.25)]" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3.5">
                <span className="text-[11px] font-extrabold tracking-[2px] text-steel uppercase">Розділи</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрити меню"
                  className="flex size-10 items-center justify-center rounded-full bg-mist text-ink transition-colors hover:bg-mist-strong"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="size-4.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <AdminNav {...data} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
