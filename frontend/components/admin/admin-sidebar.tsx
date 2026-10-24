"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { SectionIcon, adminSections, type AdminSection, type AdminSubsection } from "./sections";

const home: AdminSection = {
  href: "/fofkas-adminpanel",
  title: "Головна",
  text: "Статистика сайту",
  icon: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
};

/** Section of each brand: its categories (from the database) with their subcategories */
const brandOfSection: Record<string, string> = {
  "/fofkas-adminpanel/equipment": "carpigiani",
  "/fofkas-adminpanel/showcases/ifi": "ifi",
  "/fofkas-adminpanel/showcases/isa": "isa",
};

const NEWS_SECTION = "/fofkas-adminpanel/news";

/** All sections; under "Equipment", "IFI showcases", "ISA showcases" the categories of that brand,
 *  under "News" its topics */
function menuItems(categories: AdminSubsection[], topics: AdminSubsection[]): AdminSection[] {
  return [
    home,
    ...adminSections.map((section) => {
      if (section.href === NEWS_SECTION) return { ...section, children: topics };
      const brand = brandOfSection[section.href];
      if (!brand) return section;
      return { ...section, children: categories.filter((category) => (category.brand ?? "carpigiani") === brand) };
    }),
  ];
}

function isActive(pathname: string, href: string) {
  if (href === home.href) return pathname === home.href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** List of sections. A section with sub-sections opens a nested list under it. */
function AdminNav({
  categories,
  topics,
  onNavigate,
}: {
  categories: AdminSubsection[];
  topics: AdminSubsection[];
  onNavigate?: () => void;
}) {
  return <NavList pathname={usePathname()} categories={categories} topics={topics} onNavigate={onNavigate} />;
}

/** The same list for the first moment of a page whose address is known only when it opens
 *  (e.g. the page builder of one category): nothing is marked yet */
export function AdminSidebarFallback() {
  return <NavList pathname="" categories={[]} topics={[]} />;
}

function NavList({
  pathname,
  categories,
  topics,
  onNavigate,
}: {
  pathname: string;
  categories: AdminSubsection[];
  topics: AdminSubsection[];
  onNavigate?: () => void;
}) {
  const items = menuItems(categories, topics);
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
          const active = isActive(pathname, item.href);
          const exact = pathname === item.href;
          const hasChildren = Boolean(item.children?.length);
          const expanded = hasChildren && active !== flipped.includes(item.href);
          const listId = `admin-sub-${item.href.split("/").pop()}`;

          return (
            <li key={item.href}>
              <div
                className={`flex items-center rounded-2xl transition-colors ${
                  exact ? "bg-cocoa text-white" : active ? "bg-white text-cocoa" : "text-cocoa hover:bg-white"
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
                    {item.title}
                  </Link>
                )}
                {hasChildren && !item.groupOnly && (
                  <button
                    type="button"
                    onClick={() => toggle(item.href)}
                    aria-expanded={expanded}
                    aria-controls={listId}
                    aria-label={`${expanded ? "Згорнути" : "Розгорнути"}: ${item.title}`}
                    className="mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-cocoa/8"
                  >
                    <Chevron expanded={expanded} />
                  </button>
                )}
              </div>

              {expanded && (
                <ul id={listId} className="mt-1 mb-1.5 ml-6 flex flex-col gap-0.5 border-l-2 border-sand pl-3">
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
                              ? "bg-cocoa text-white"
                              : childOpen
                                ? "bg-white text-cocoa"
                                : "text-cocoa-soft hover:bg-white hover:text-cocoa"
                          }`}
                        >
                          {child.title}
                        </Link>
                        {/* Subcategories show only under the open category */}
                        {childOpen && Boolean(child.children?.length) && (
                          <ul className="mt-0.5 mb-1 ml-3 flex flex-col gap-0.5 border-l-2 border-sand pl-2.5">
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
                                      inside ? "bg-cocoa text-white" : "text-cocoa-soft hover:bg-white hover:text-cocoa"
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
export function AdminSidebar({ categories, topics }: { categories: AdminSubsection[]; topics: AdminSubsection[] }) {
  return <AdminNav categories={categories} topics={topics} />;
}

const noop = () => () => {};

/** On phones and tablets: burger button in the top bar, the menu slides out from the left */
export function AdminMobileMenu({ categories, topics }: { categories: AdminSubsection[]; topics: AdminSubsection[] }) {
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
        className="flex size-11 items-center justify-center rounded-full border border-cocoa/15 bg-white/70 text-cocoa transition-colors hover:bg-white"
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
              className={`fixed inset-0 z-40 bg-cocoa/35 backdrop-blur-[2px] transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            <div
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Меню адмін-панелі"
              inert={!open}
              className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col bg-cream transition-transform duration-300 ease-out ${
                open ? "translate-x-0 shadow-[18px_0_50px_rgba(74,52,38,0.25)]" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-cocoa/10 px-4 py-3.5">
                <span className="text-[11px] font-extrabold tracking-[2px] text-gold uppercase">Розділи</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрити меню"
                  className="flex size-10 items-center justify-center rounded-full bg-sand text-cocoa transition-colors hover:bg-[#ecdcc6]"
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
                <AdminNav categories={categories} topics={topics} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
