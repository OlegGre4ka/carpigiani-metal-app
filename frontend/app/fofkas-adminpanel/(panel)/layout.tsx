import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminMobileMenu, AdminSidebar, AdminSidebarFallback } from "@/components/admin/admin-sidebar";
import { AdminSearch } from "@/components/admin/admin-search";
import { AntdProvider } from "@/components/admin/antd-provider";
import { UserBadge } from "@/components/admin/user-badge";
import { getAdminBrands, getCurrentUser, getMenuCategories, getMenuTopics } from "@/lib/admin/backend";
import { AdminLoader } from "@/components/cone-loader";
import { BrandMark } from "@/components/brand-logo";

// Admin panel frame: top bar with logo, sections on the left, content on the right.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-page text-ink">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-[rgb(var(--paper-rgb)/0.9)] backdrop-blur-md">
        <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-8 py-3.5 max-[900px]:px-4 max-[600px]:py-2.5">
          <div className="flex min-w-0 items-center gap-3 max-[400px]:gap-2">
            {/* The menus mark the current page, so they wait for its address (see AdminSidebarFallback) */}
            <Suspense fallback={<span className="hidden size-11 max-[900px]:block" />}>
              <MobileMenu />
            </Suspense>
            <Link href="/fofkas-adminpanel" className="flex items-center gap-3 max-[600px]:gap-2">
              {/* Admin panel logo: the brand mark */}
              <BrandMark className="h-12 w-auto max-[600px]:h-10" />
              <span className="leading-none">
                <span className="block text-lg font-extrabold tracking-[3px] max-[600px]:text-base max-[400px]:text-[15px] max-[400px]:tracking-[2px]">
                  CARPIGIANI
                </span>
                <span className="mt-1 block text-[10px] font-extrabold tracking-[2px] text-steel uppercase max-[600px]:text-[9px]">
                  Адмін-панель
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-sm max-[600px]:gap-2">
            {/* Search over the whole admin panel (30.10) */}
            <AdminSearch />
            <SiteButton />
            <Suspense fallback={null}>
              <UserInfo />
            </Suspense>
            {/* On phones and tablets "Log out" is in the menu under the letter circle */}
            <form action="/fofkas-adminpanel/logout" method="post" className="max-[900px]:hidden">
              <button
                type="submit"
                className="cursor-pointer rounded-full border border-ink/20 bg-white/70 px-4 py-2 font-bold transition-colors hover:bg-white"
              >
                Вийти
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-360 grid-cols-[280px_1fr] gap-8 px-8 py-8 max-[900px]:grid-cols-1 max-[900px]:gap-4 max-[900px]:px-4 max-[900px]:py-4">
        <aside className="sticky top-24 self-start rounded-[28px] steel-card p-3 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[900px]:hidden">
          <Suspense fallback={<AdminSidebarFallback />}>
            <Sidebar />
          </Suspense>
        </aside>
        <main className="min-w-0">
          <Suspense fallback={<AdminLoader />}>
            <RequireUser>
              <AntdProvider>{children}</AntdProvider>
            </RequireUser>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Menus with the brands, their categories (and subcategories) and the topics of news from the database
async function menuData() {
  const [brands, categories, topics] = await Promise.all([getAdminBrands(), getMenuCategories(), getMenuTopics()]);
  return { brands, categories, topics };
}

async function Sidebar() {
  return <AdminSidebar {...await menuData()} />;
}

async function MobileMenu() {
  return <AdminMobileMenu {...await menuData()} />;
}

// Shows the page only to a logged-in admin; an expired login goes back to the login page
async function RequireUser({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/fofkas-adminpanel/logout");
  return children;
}

/** Who is logged in: letter + email on large screens, only the letter (click shows the email) on smaller ones */
async function UserInfo() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <>
      <span className="flex min-w-0 items-center gap-2 text-ink-soft max-[900px]:hidden">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-extrabold text-brand uppercase"
        >
          {user.email[0]}
        </span>
        <span className="truncate">{user.email}</span>
      </span>
      <span className="hidden max-[900px]:block">
        <UserBadge email={user.email} />
      </span>
    </>
  );
}

/** Opens the site in a new tab. Light "scoop" like the slider arrows, turns brown on hover */
function SiteButton() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener"
      className="btn-shine inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-white/90 bg-[image:var(--grad-round)] px-4 py-2 font-bold whitespace-nowrap text-brand shadow-[inset_0_-3px_6px_rgb(var(--brand-rgb)/0.14),0_8px_18px_rgb(var(--ink-rgb)/0.16)] transition-all duration-300 hover:border-white hover:bg-[image:var(--grad-btn)] hover:text-white hover:shadow-[0_12px_24px_rgb(var(--brand-rgb)/0.35)] max-[600px]:px-3.5"
    >
      <span className="max-[600px]:hidden">Відкрити сайт</span>
      <span className="hidden max-[600px]:inline">Сайт</span> <span aria-hidden="true">↗</span>
    </a>
  );
}
