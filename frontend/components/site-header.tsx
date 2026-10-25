"use client";

import NextLink from "next/link";
import { useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Menu, Settings, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { BrandLogo } from "@/components/brand-logo";

// All addresses are the same as on the old site (carpigiani.com.ua).
const brands = [
  { label: "CARPIGIANI", href: "/carpigiani" },
  { label: "IFI", href: "/ifi" },
  { label: "ISA", href: "/isa" },
];

// All three columns are filled from the admin panel: categories of Carpigiani equipment and
// categories of IFI / ISA showcases (each with a submenu of its equipment / showcases that have
// a page). The Carpigiani column is hidden while it has no categories; the IFI and ISA columns
// always show at least the link to the brand page.
const catalog = [
  { key: "carpigiani", href: "/carpigiani" },
  { key: "ifi", href: "/ifi" },
  { key: "isa", href: "/isa" },
] as const;

type CatalogKey = (typeof catalog)[number]["key"];

/** Category for the menu: title already in the page language.
 *  groups: its equipment with a page, under the names of subcategories (a submenu on hover) */
export type MenuCategory = {
  href: string;
  title: string;
  groups?: { title: string; items: { title: string; href: string }[] }[];
};

const supportItems = [
  { key: "gelatoUniversity", href: "/carpigiani-gelato-university" },
  { key: "gelatoCrystal", href: "/gelato-crystal" },
  { key: "project", href: "/project" },
  { key: "service", href: "/service" },
  { key: "sitemap", href: "/sitemap" },
] as const;

/** Topics of news for the "News" menu, and the addresses of all news and topics on the site */
export type NewsMenu = { topics: { title: string; href: string }[]; pages: string[] };

/** Which item of the main menu is the open page in: Home, News (the list, topics, news),
 *  Equipment catalog (brand pages, categories and equipment from the menu), Support (its pages)
 *  or Contacts. */
function activeSection(pathname: string, categories: MenuCategory[], showcasePages: string[] = [], newsPages: string[] = []) {
  if (pathname === "/") return "home";
  if (pathname === "/news" || newsPages.includes(pathname)) return "news";
  if (pathname === "/contacts") return "contacts";
  if (pathname === "/support" || supportItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)))
    return "support";
  const inCatalog =
    catalog.some((group) => group.href === pathname) ||
    categories.some(
      (category) =>
        category.href === pathname || category.groups?.some((group) => group.items.some((item) => item.href === pathname)),
    );
  return inCatalog || showcasePages.includes(pathname) ? "catalog" : null;
}

// A brand pill is dark only on its own page: /carpigiani, /ifi or /isa.
// On all other pages (home, news, categories...) no pill is dark.
function activeBrand(pathname: string) {
  return brands.find((b) => b.href === pathname)?.href ?? null;
}

const navLink = "rounded-full px-3.5 py-2.5 font-semibold whitespace-nowrap max-[1440px]:px-3 transition-colors";
/** Main menu item: dark (as the brand pills) while its page is open */
const navItem = (active: boolean) => `${navLink} ${active ? "bg-white text-ink" : "text-white/85 hover:bg-white/10 hover:text-white"}`;
/** Item of the phone menu: marked while its page is open */
const mobileItem = (active: boolean) => (active ? `${panelLink} bg-mist text-brand` : panelLink);
const panel =
  "invisible absolute top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";
const panelBox = "rounded-[22px] bg-white p-4 text-ink shadow-[0_20px_50px_rgb(var(--ink-rgb)/0.2)]";
const panelLink = "block rounded-[14px] px-3.5 py-2.5 text-[15px] font-semibold hover:bg-mist";

// The dropdowns open on hover (and on keyboard focus). After a click on a link inside, the
// mouse is still over the menu and the link keeps the focus, so the dropdown would stay open
// on the new page. So the click closes it: the focus is taken off the link, and the dropdown
// stays hidden until the mouse leaves the menu.
function useDropdownClose() {
  const [closed, setClosed] = useState<string | null>(null);
  return (key: string) => ({
    onClick: (event: MouseEvent) => {
      if (!(event.target as Element).closest("a")) return;
      (document.activeElement as HTMLElement | null)?.blur();
      setClosed(key);
    },
    onMouseLeave: () => setClosed((current) => (current === key ? null : current)),
    // Submenus inside are hidden too (they could stay "visible" inside a hidden menu)
    hidden: closed === key ? "invisible! opacity-0! [&_*]:invisible!" : "",
  });
}

function LocaleSwitcher({ onPick }: { onPick?: () => void }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div aria-label={t("language")} role="group" className="flex rounded-full bg-white/10 p-0.5 text-xs font-extrabold text-white">
      {routing.locales.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          onClick={onPick}
          aria-current={code === locale ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 uppercase transition-colors ${
            code === locale ? "bg-white text-ink" : "hover:bg-white/15"
          }`}
        >
          {code === "uk" ? "UA" : code}
        </Link>
      ))}
    </div>
  );
}

// Admin panel address (same for all languages, so a plain link without the language prefix)
const ADMIN_HREF = "/fofkas-adminpanel";

/** isAdmin: the visitor is logged in to the admin panel; only then the "Admin panel" item is shown.
 *  categories: equipment categories from the admin panel for the "Equipment catalog" menu. */
export function SiteHeader({
  isAdmin = false,
  categories = [],
  showcases = { ifi: [], isa: [] },
  showcasePages = [],
  news = { topics: [], pages: [] },
}: {
  isAdmin?: boolean;
  categories?: MenuCategory[];
  /** Categories of IFI / ISA showcases from the admin panel, for their columns of the menu */
  showcases?: { ifi: MenuCategory[]; isa: MenuCategory[] };
  /** Addresses of IFI / ISA categories and showcases (the menu marks "Equipment catalog" on them) */
  showcasePages?: string[];
  /** Topics of news (a dropdown under "News") and the pages on which "News" is lit */
  news?: NewsMenu;
}) {
  const t = useTranslations("Nav");
  const tc = useTranslations("Catalog");
  const ts = useTranslations("SupportMenu");
  const pathname = usePathname();
  const brand = activeBrand(pathname);
  const section = activeSection(pathname, categories, showcasePages, news.pages);
  const [open, setOpen] = useState(false);
  // No equipment categories yet: the "Equipment Carpigiani" column is not shown at all
  const groups = catalog.filter((group) => group.key !== "carpigiani" || categories.length > 0);
  const itemsOf = (key: CatalogKey) => (key === "carpigiani" ? categories : showcases[key]);
  const close = () => setOpen(false);
  const dropdown = useDropdownClose();
  const catalogMenu = dropdown("catalog");
  const supportMenu = dropdown("support");
  const newsMenu = dropdown("news");

  return (
    // Dark band on every page: on the home page it flows into the dark hero
    <header className="relative z-30 w-full bg-dark text-on-dark">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-3.5 px-20 py-5 max-[1280px]:px-8 max-[820px]:px-4 max-[820px]:py-3">
        <div className="flex shrink-0 items-center gap-5.5 max-[820px]:gap-2.5">
          <Link href="/" aria-label={t("toHome")} className="flex items-center gap-3">
            <BrandLogo hideWordOnPhone />
          </Link>

          {/* Three brands: always visible, also on phones */}
          <nav aria-label={t("brands")} className="flex gap-2 max-[820px]:gap-1.25">
            {brands.map((b) => {
              const active = b.href === brand;
              return (
                <Link
                  key={b.href}
                  href={b.href}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-full border px-3.5 py-1.75 text-xs font-extrabold tracking-[1.5px] transition-colors max-[820px]:px-2.25 max-[820px]:py-1.5 max-[820px]:text-[10px] max-[820px]:tracking-[0.8px] ${
                    active
                      ? "border-white bg-white text-ink"
                      : "border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10"
                  }`}
                >
                  {b.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main menu (desktop) */}
        <nav className="flex items-center gap-0.5 text-[15px] max-[1240px]:hidden">
          <Link href="/" aria-current={section === "home" ? "page" : undefined} className={navItem(section === "home")}>
            {t("home")}
          </Link>
          {/* News: with topics a dropdown (each topic leads to its page), without them a plain link */}
          {news.topics.length > 0 ? (
            <div className="group relative" onClick={newsMenu.onClick} onMouseLeave={newsMenu.onMouseLeave}>
              <Link
                href="/news"
                aria-current={pathname === "/news" ? "page" : undefined}
                className={`${navItem(section === "news")} flex items-center gap-1`}
              >
                {t("news")}
                <ChevronDown aria-hidden="true" className="size-4" />
              </Link>
              <div className={`${panel} left-0 ${newsMenu.hidden}`}>
                <div className={`${panelBox} w-max min-w-56`}>
                  {news.topics.map((topic) => (
                    <Link
                      key={topic.href}
                      href={topic.href}
                      aria-current={pathname === topic.href ? "page" : undefined}
                      className={pathname === topic.href ? `${panelLink} bg-mist text-brand` : panelLink}
                    >
                      {topic.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Link href="/news" aria-current={section === "news" ? "page" : undefined} className={navItem(section === "news")}>
              {t("news")}
            </Link>
          )}

          <div className="group relative" onClick={catalogMenu.onClick} onMouseLeave={catalogMenu.onMouseLeave}>
            <button type="button" className={`${navItem(section === "catalog")} flex items-center gap-1`}>
              {t("catalog")}
              <ChevronDown aria-hidden="true" className="size-4" />
            </button>
            <div className={`${panel} right-0 ${catalogMenu.hidden}`}>
              <div
                className={`${panelBox} grid gap-2 ${groups.length === 3 ? "w-190 grid-cols-3" : "w-127 grid-cols-2"}`}
              >
                {groups.map((group, column) => (
                  <div key={group.key}>
                    <Link
                      href={group.href}
                      className="mb-1 block rounded-[14px] px-3.5 py-2 text-xs font-extrabold tracking-[1.5px] text-steel uppercase hover:bg-mist"
                    >
                      {tc(group.key)}
                    </Link>
                    {itemsOf(group.key).map((item) =>
                      item.href.startsWith("http") ? (
                        <a key={item.href} href={item.href} target="_blank" rel="noopener" className={panelLink}>
                          {item.title}
                        </a>
                      ) : (
                        <CategoryItem key={item.href} category={item} openLeft={column === groups.length - 1} />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="group relative" onClick={supportMenu.onClick} onMouseLeave={supportMenu.onMouseLeave}>
            <Link
              href="/support"
              aria-current={pathname === "/support" ? "page" : undefined}
              className={`${navItem(section === "support")} flex items-center gap-1`}
            >
              {t("support")}
              <ChevronDown aria-hidden="true" className="size-4" />
            </Link>
            <div className={`${panel} right-0 ${supportMenu.hidden}`}>
              <div className={`${panelBox} w-max min-w-65`}>
                {supportItems.map((item) => (
                  <Link key={item.href} href={item.href} className={panelLink}>
                    {ts(item.key)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/contacts" aria-current={section === "contacts" ? "page" : undefined} className={navItem(section === "contacts")}>
            {t("contacts")}
          </Link>
          {isAdmin && (
            <NextLink
              href={ADMIN_HREF}
              aria-label={t("admin")}
              className="group/admin relative ml-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand"
            >
              {/* Only the icon: the full menu must stay in one line; the name shows on hover */}
              <Settings aria-hidden="true" className="size-4.5" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-full right-0 z-30 mt-2 rounded-full bg-ink px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white opacity-0 shadow-[0_10px_24px_rgb(var(--ink-rgb)/0.25)] transition-opacity group-hover/admin:opacity-100 group-focus-visible/admin:opacity-100"
              >
                {t("admin")}
              </span>
            </NextLink>
          )}
          <div className="ml-2">
            <LocaleSwitcher />
          </div>
        </nav>

        {/* Burger (phone) */}
        <div className="relative hidden max-[1240px]:block">
          <button
            type="button"
            aria-label={t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-11.5 items-center justify-center rounded-full bg-white/10 text-white"
          >
            {open ? <X aria-hidden="true" className="size-5.5" /> : <Menu aria-hidden="true" className="size-5.5" />}
          </button>
          {open && (
            <div className="absolute top-13.5 right-0 z-20 flex max-h-[calc(100dvh-90px)] w-[min(340px,calc(100vw-32px))] min-w-65 flex-col gap-0.5 overflow-y-auto rounded-[22px] bg-white p-4 text-ink shadow-[0_20px_50px_rgb(var(--ink-rgb)/0.2)]">
              <Link href="/" onClick={close} aria-current={section === "home" ? "page" : undefined} className={mobileItem(section === "home")}>
                {t("home")}
              </Link>
              {news.topics.length > 0 ? (
                // The name leads to all news, the arrow next to it opens the topics
                <MobileCategory
                  category={{ href: "/news", title: t("news"), groups: [{ title: "", items: news.topics }] }}
                  onPick={close}
                  nameClass={`${mobileItem(section === "news")} min-w-0 flex-1`}
                  listClass="mb-1 ml-3.5 border-l-2 border-mist pl-2.5"
                  current={pathname}
                  toggleLabel={t("showTopics")}
                />
              ) : (
                <Link href="/news" onClick={close} aria-current={section === "news" ? "page" : undefined} className={mobileItem(section === "news")}>
                  {t("news")}
                </Link>
              )}
              <div className="px-3.5 pt-2.5 pb-1 text-xs font-extrabold tracking-[1.5px] text-steel uppercase">
                {t("catalog")}
              </div>
              {groups.map((group) => (
                <div key={group.key}>
                  <Link href={group.href} onClick={close} className={`${mobileItem(pathname === group.href)} pl-6`}>
                    {tc(group.key)}
                  </Link>
                  {/* Categories of the brand: each is a link to its page, and the arrow next to it
                      opens its equipment / showcases (as the submenu on large screens) */}
                  {itemsOf(group.key).map((category) => (
                    <MobileCategory key={category.href} category={category} onPick={close} />
                  ))}
                </div>
              ))}
              <Link href="/support" onClick={close} className={mobileItem(section === "support")}>
                {t("support")}
              </Link>
              <Link href="/contacts" onClick={close} aria-current={section === "contacts" ? "page" : undefined} className={mobileItem(section === "contacts")}>
                {t("contacts")}
              </Link>
              {isAdmin && (
                <NextLink
                  href={ADMIN_HREF}
                  onClick={close}
                  className="mt-1 flex items-center gap-2 rounded-[14px] bg-ink px-3.5 py-2.5 text-[15px] font-semibold text-white"
                >
                  <Settings aria-hidden="true" className="size-4" />
                  {t("admin")}
                </NextLink>
              )}
              <div className="mt-2 w-max rounded-full bg-dark px-0.5">
                <LocaleSwitcher onPick={close} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** A category in the "Equipment catalog" menu. If it has equipment with pages, hovering it
 *  (or focusing it with the keyboard) slides out a submenu on the right, over the next column
 *  (the menu itself does not move): subcategories as small headings and the equipment under them.
 *  Short delays let the mouse go diagonally to the submenu without it closing. */
/** openLeft: the submenu opens to the left (the last column of the menu: on the right it could
 *  go off the screen) */
function CategoryItem({ category, openLeft = false }: { category: MenuCategory; openLeft?: boolean }) {
  const groups = category.groups ?? [];
  if (groups.length === 0) {
    return (
      <Link href={category.href} className={panelLink}>
        {category.title}
      </Link>
    );
  }
  return (
    <div className="group/cat relative">
      <Link href={category.href} aria-haspopup="true" className={`${panelLink} flex items-center justify-between gap-2 group-hover/cat:bg-mist`}>
        {category.title}
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-steel transition-transform group-hover/cat:translate-x-0.5" />
      </Link>
      {/* The padding is a bridge for the mouse between the item and the submenu */}
      <div className={`invisible absolute top-[-14px] z-30 opacity-0 transition-[opacity,visibility,translate] delay-200 duration-200 ${openLeft ? "right-full pr-3 translate-x-2" : "left-full pl-3 -translate-x-2"} group-focus-within/cat:visible group-focus-within/cat:translate-x-0 group-focus-within/cat:opacity-100 group-focus-within/cat:delay-0 group-hover/cat:visible group-hover/cat:translate-x-0 group-hover/cat:opacity-100 group-hover/cat:delay-100`}>
        <div className="max-h-[min(70vh,520px)] w-72 overflow-y-auto overscroll-contain rounded-[22px] border border-ink/8 bg-white p-3 shadow-[0_24px_54px_rgb(var(--ink-rgb)/0.22)]">
          {groups.map((group) => (
            <div key={group.title}>
              {groups.length > 1 && (
                <p className="mx-2.5 mt-2 mb-0.5 text-[10.5px] font-extrabold tracking-[1.1px] text-steel uppercase first:mt-1">{group.title}</p>
              )}
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-[14.5px] font-semibold hover:bg-mist">
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A category in the menu on phones: the name leads to the page of the category, the arrow
 *  next to it opens its equipment under the names of subcategories.
 *  Also "News" with its topics: nameClass / listClass place it at the top level of the menu,
 *  current marks the open topic. */
function MobileCategory({
  category,
  onPick,
  nameClass = `${panelLink} min-w-0 flex-1 pl-9 text-[14.5px]`,
  listClass = "mb-1 ml-9 border-l-2 border-mist pl-2.5",
  current,
  toggleLabel,
}: {
  category: MenuCategory;
  onPick: () => void;
  nameClass?: string;
  listClass?: string;
  current?: string;
  toggleLabel?: string;
}) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const groups = category.groups ?? [];
  const external = category.href.startsWith("http");
  const name = external ? (
    <a href={category.href} target="_blank" rel="noopener" onClick={onPick} className={nameClass}>
      {category.title}
    </a>
  ) : (
    <Link href={category.href} onClick={onPick} className={nameClass}>
      {category.title}
    </Link>
  );
  if (groups.length === 0) return <div className="flex">{name}</div>;

  return (
    <div>
      <div className="flex items-center gap-1">
        {name}
        <button
          type="button"
          aria-expanded={open}
          aria-label={toggleLabel ?? t("showEquipment", { name: category.title })}
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-brand hover:bg-mist"
        >
          <ChevronDown aria-hidden="true" className={`size-4.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className={listClass}>
            {groups.map((group) => (
              <div key={group.title}>
                {groups.length > 1 && (
                  <p className="mx-2 mt-2 mb-0.5 text-[10.5px] font-extrabold tracking-[1.1px] text-steel uppercase">{group.title}</p>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onPick}
                    aria-current={current === item.href ? "page" : undefined}
                    className={`block rounded-xl px-2.5 py-2 text-[14px] font-semibold hover:bg-mist ${
                      current === item.href ? "bg-mist text-brand" : "text-body"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
