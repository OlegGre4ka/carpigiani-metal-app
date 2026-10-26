"use client";

import NextLink from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Menu, Settings, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { BrandMark } from "@/components/brand-logo";

// Brands (manufacturers) come from the admin panel → "Виробники", in its order; hidden ones are
// not sent. Their pages keep the addresses of the old site (/carpigiani, /ifi, /isa).
// "Manufacturers": a metal button next to the logo with the logos of the brands stacked in it;
// a click opens the list of brands (also on phones).
// "Equipment catalog": a column per brand with its categories (each with a submenu of its
// equipment / showcases that have a page).

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

/** A brand for the menus: title already in the page language */
export type MenuBrand = {
  key: string;
  href: string;
  title: string;
  logo: string | null;
  categories: MenuCategory[];
};

/** Topics of news for the "News" menu, and the addresses of all news and topics on the site */
export type NewsMenu = { topics: { title: string; href: string }[]; pages: string[] };

/** Which item of the main menu is the open page in: Home, News (the list, topics, news),
 *  Manufacturers (brand pages), Equipment catalog (categories and equipment from the menu),
 *  Support (its pages) or Contacts. */
function activeSection(pathname: string, brands: MenuBrand[], newsPages: string[] = []) {
  if (pathname === "/") return "home";
  if (pathname === "/news" || newsPages.includes(pathname)) return "news";
  if (pathname === "/contacts") return "contacts";
  if (pathname === "/support" || supportItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)))
    return "support";
  if (brands.some((brand) => brand.href === pathname)) return "brands";
  const inCatalog = brands.some((brand) =>
    brand.categories.some(
      (category) =>
        category.href === pathname || category.groups?.some((group) => group.items.some((item) => item.href === pathname)),
    ),
  );
  return inCatalog ? "catalog" : null;
}

/** Small logo of a brand on a white tile (logos are colour on a transparent background) */
function BrandTile({ brand, size = "md" }: { brand: MenuBrand; size?: "md" | "sm" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-white shadow-[inset_0_-2px_4px_rgb(0_10_40/0.12)] ${
        size === "md" ? "h-10 w-18 p-1.5" : "h-8 w-14 p-1"
      }`}
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- small logo from the admin panel
        <img src={brand.logo} alt="" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="truncate px-1 text-[10px] font-extrabold tracking-[0.5px] text-ink uppercase">{brand.title}</span>
      )}
    </span>
  );
}

/** List of brands: in the "Manufacturers" dropdown and in its own menu on phones */
function BrandsList({ brands, pathname, onPick }: { brands: MenuBrand[]; pathname: string; onPick?: () => void }) {
  const t = useTranslations("Nav");
  return (
    <>
      <p className="px-3.5 pt-1 pb-2 text-xs font-extrabold tracking-[1.5px] text-sky uppercase">{t("manufacturersTitle")}</p>
      {brands.map((brand) => {
        const here = pathname === brand.href;
        return (
          <Link
            key={brand.key}
            href={brand.href}
            onClick={onPick}
            aria-current={here ? "page" : undefined}
            className={`${panelLink} flex items-center gap-3.5 ${here ? "bg-white/10 text-white" : ""}`}
          >
            <BrandTile brand={brand} />
            {brand.title}
          </Link>
        );
      })}
    </>
  );
}

/** "Manufacturers": a chrome pill next to the logo with the round logos of the brands stacked
 *  in it (they fan out on hover). A click opens the list of brands; a click outside, Esc or
 *  another page closes it. On phones only the stack of logos is shown. Looks: globals.css (.brands-btn). */
function BrandsButton({ brands, pathname }: { brands: MenuBrand[]; pathname: string }) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const here = brands.some((brand) => brand.href === pathname);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("manufacturers")}
        onClick={() => setOpen((v) => !v)}
        className={`brands-btn btn-shine ${open ? "open" : ""} ${here ? "here" : ""}`}
      >
        <span aria-hidden="true" className="brands-stack">
          {brands.slice(0, 4).map((brand, i) => (
            <i key={brand.key} style={{ "--i": i } as CSSProperties}>
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small logo from the admin panel
                <img src={brand.logo} alt="" />
              ) : (
                <b>{brand.title.slice(0, 1)}</b>
              )}
            </i>
          ))}
        </span>
        <span className="brands-label">{t("manufacturers")}</span>
        <ChevronDown aria-hidden="true" className="brands-chev" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 pt-2.5 max-[420px]:-left-12">
          <div className={`${panelBox} w-max min-w-72 max-w-[calc(100vw-32px)] motion-safe:animate-fade-up`}>
            <BrandsList brands={brands} pathname={pathname} onPick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const navLink = "rounded-full px-3.5 py-2.5 font-semibold whitespace-nowrap max-[1440px]:px-3 transition-colors";
/** Main menu item: lit while its page is open */
const navItem = (active: boolean) => `${navLink} ${active ? "bg-[image:var(--grad-btn)] text-white shadow-[0_8px_22px_rgb(20_100_255/0.4)]" : "text-on-navy hover:bg-white/10 hover:text-white"}`;
/** Item of the phone menu: marked while its page is open */
const mobileItem = (active: boolean) => (active ? `${panelLink} bg-white/10 text-white` : panelLink);
const panel =
  "invisible absolute top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";
const panelBox = "rounded-[22px] border border-white/15 bg-[image:var(--grad-navy-panel)] p-4 text-on-navy shadow-[0_30px_70px_rgb(0_10_40/0.6)]";
const panelLink = "block rounded-[14px] px-3.5 py-2.5 text-[15px] font-semibold hover:bg-white/10 hover:text-white";

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
            code === locale ? "bg-[image:var(--metal)] text-ink" : "text-on-navy-soft hover:bg-white/15"
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
  brands = [],
  news = { topics: [], pages: [] },
}: {
  isAdmin?: boolean;
  /** Visible brands with their categories, from the admin panel */
  brands?: MenuBrand[];
  /** News: the pages on which "News" is lit (topics are not in the menu any more) */
  news?: NewsMenu;
}) {
  const t = useTranslations("Nav");
  const ts = useTranslations("SupportMenu");
  const pathname = usePathname();
  const section = activeSection(pathname, brands, news.pages);
  // Phones: the main menu (burger)
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const dropdown = useDropdownClose();
  const catalogMenu = dropdown("catalog");
  const supportMenu = dropdown("support");
  // Catalog: a column per brand, up to 4 in a row
  const columns = Math.min(Math.max(brands.length, 1), 4);

  return (
    // Navy band on every page; on the home page it is see-through over the navy background
    <header className="site-header relative z-30 w-full bg-navy text-white">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-3.5 px-20 py-5 max-[1280px]:px-8 max-[820px]:px-4 max-[820px]:py-3">
        {/* The mark and, next to it, the "Manufacturers" button (where the brand pills were) */}
        <div className="flex shrink-0 items-center gap-5 max-[820px]:gap-3">
          <Link href="/" aria-label={t("toHome")} className="flex shrink-0 items-center">
            <BrandMark className="h-12 w-auto max-[820px]:h-10" />
          </Link>
          {brands.length > 0 && <BrandsButton brands={brands} pathname={pathname} />}
        </div>

        {/* Main menu (desktop) */}
        <nav className="flex items-center gap-0.5 text-[15px] max-[1240px]:hidden">
          <Link href="/" aria-current={section === "home" ? "page" : undefined} className={navItem(section === "home")}>
            {t("home")}
          </Link>
          {/* News: a plain link (the topics are reached from the news section: tags and its map) */}
          <Link href="/news" aria-current={section === "news" ? "page" : undefined} className={navItem(section === "news")}>
            {t("news")}
          </Link>

          <div className="group relative" onClick={catalogMenu.onClick} onMouseLeave={catalogMenu.onMouseLeave}>
            <button type="button" className={`${navItem(section === "catalog")} flex items-center gap-1`}>
              {t("catalog")}
              <ChevronDown aria-hidden="true" className="size-4" />
            </button>
            <div className={`${panel} right-0 ${catalogMenu.hidden}`}>
              <div
                className={`${panelBox} grid gap-2`}
                style={{ gridTemplateColumns: `repeat(${columns}, 15rem)` }}
              >
                {brands.map((brand, index) => (
                  <div key={brand.key}>
                    <Link
                      href={brand.href}
                      className="mb-1 block rounded-[14px] px-3.5 py-2 text-xs font-extrabold tracking-[1.5px] text-sky uppercase hover:bg-white/10"
                    >
                      {brand.title}
                    </Link>
                    {brand.categories.map((item) =>
                      item.href.startsWith("http") ? (
                        <a key={item.href} href={item.href} target="_blank" rel="noopener" className={panelLink}>
                          {item.title}
                        </a>
                      ) : (
                        <CategoryItem key={item.href} category={item} openLeft={index % columns === columns - 1} />
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
            <div className="absolute top-13.5 right-0 z-20 flex max-h-[calc(100dvh-90px)] w-[min(340px,calc(100vw-32px))] min-w-65 flex-col gap-0.5 overflow-y-auto rounded-[22px] border border-white/15 bg-[image:var(--grad-navy-panel)] p-4 text-on-navy shadow-[0_30px_70px_rgb(0_10_40/0.6)]">
              <Link href="/" onClick={close} aria-current={section === "home" ? "page" : undefined} className={mobileItem(section === "home")}>
                {t("home")}
              </Link>
              <Link href="/news" onClick={close} aria-current={section === "news" ? "page" : undefined} className={mobileItem(section === "news")}>
                {t("news")}
              </Link>
              <div className="px-3.5 pt-2.5 pb-1 text-xs font-extrabold tracking-[1.5px] text-sky uppercase">
                {t("catalog")}
              </div>
              {brands.map((brand) => (
                <div key={brand.key}>
                  <Link href={brand.href} onClick={close} className={`${mobileItem(pathname === brand.href)} pl-6`}>
                    {brand.title}
                  </Link>
                  {/* Categories of the brand: each is a link to its page, and the arrow next to it
                      opens its equipment / showcases (as the submenu on large screens) */}
                  {brand.categories.map((category) => (
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
                  className="mt-1 flex items-center gap-2 rounded-[14px] bg-white/10 px-3.5 py-2.5 text-[15px] font-semibold text-white"
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
      {/* The brand trail line under the menu */}
      <div aria-hidden="true" className="brand-line" />
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
      <Link href={category.href} aria-haspopup="true" className={`${panelLink} flex items-center justify-between gap-2 group-hover/cat:bg-white/10`}>
        {category.title}
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-sky transition-transform group-hover/cat:translate-x-0.5" />
      </Link>
      {/* The padding is a bridge for the mouse between the item and the submenu */}
      <div className={`invisible absolute top-[-14px] z-30 opacity-0 transition-[opacity,visibility,translate] delay-200 duration-200 ${openLeft ? "right-full pr-3 translate-x-2" : "left-full pl-3 -translate-x-2"} group-focus-within/cat:visible group-focus-within/cat:translate-x-0 group-focus-within/cat:opacity-100 group-focus-within/cat:delay-0 group-hover/cat:visible group-hover/cat:translate-x-0 group-hover/cat:opacity-100 group-hover/cat:delay-100`}>
        <div className="max-h-[min(70vh,520px)] w-72 overflow-y-auto overscroll-contain rounded-[22px] border border-white/15 bg-[image:var(--grad-navy-panel)] p-3 text-on-navy shadow-[0_30px_70px_rgb(0_10_40/0.6)]">
          {groups.map((group) => (
            <div key={group.title}>
              {groups.length > 1 && (
                <p className="mx-2.5 mt-2 mb-0.5 text-[10.5px] font-extrabold tracking-[1.1px] text-sky uppercase first:mt-1">{group.title}</p>
              )}
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-[14.5px] font-semibold hover:bg-white/10 hover:text-white">
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
  listClass = "mb-1 ml-9 border-l-2 border-white/15 pl-2.5",
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
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sky hover:bg-white/10"
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
                  <p className="mx-2 mt-2 mb-0.5 text-[10.5px] font-extrabold tracking-[1.1px] text-sky uppercase">{group.title}</p>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onPick}
                    aria-current={current === item.href ? "page" : undefined}
                    className={`block rounded-xl px-2.5 py-2 text-[14px] font-semibold hover:bg-white/10 hover:text-white ${
                      current === item.href ? "bg-white/10 text-white" : "text-on-navy"
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
