import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminMobileMenu, AdminSidebar, AdminSidebarFallback } from "@/components/admin/admin-sidebar";
import { AntdProvider } from "@/components/admin/antd-provider";
import { UserBadge } from "@/components/admin/user-badge";
import { getCurrentUser, getMenuCategories, getMenuTopics } from "@/lib/admin/backend";
import { AdminLoader } from "@/components/cone-loader";

// Admin panel frame: top bar with logo, sections on the left, content on the right.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream text-cocoa">
      <header className="sticky top-0 z-10 border-b border-cocoa/10 bg-[rgba(250,243,232,0.9)] backdrop-blur-md">
        <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-8 py-3.5 max-[900px]:px-4 max-[600px]:py-2.5">
          <div className="flex min-w-0 items-center gap-3 max-[400px]:gap-2">
            {/* The menus mark the current page, so they wait for its address (see AdminSidebarFallback) */}
            <Suspense fallback={<span className="hidden size-11 max-[900px]:block" />}>
              <MobileMenu />
            </Suspense>
            <Link href="/fofkas-adminpanel" className="flex items-center gap-3 max-[600px]:gap-2">
              {/* Admin panel logo: the cone in a gear (the site has the plain cone) */}
              <Image
                src="/images/admin/admin-logo.webp"
                alt="Carpigiani"
                width={327}
                height={360}
                className="h-12 w-auto max-[600px]:h-10"
              />
              <span className="leading-none">
                <span className="block font-heading text-2xl font-bold tracking-[1px] max-[600px]:text-xl max-[400px]:text-[17px] max-[400px]:tracking-[0.5px]">
                  CARPIGIANI
                </span>
                <span className="mt-1 block text-[10px] font-extrabold tracking-[2px] text-gold uppercase max-[600px]:text-[9px]">
                  Адмін-панель
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-sm max-[600px]:gap-2">
            <SiteButton />
            <Suspense fallback={null}>
              <UserInfo />
            </Suspense>
            {/* On phones and tablets "Log out" is in the menu under the letter circle */}
            <form action="/fofkas-adminpanel/logout" method="post" className="max-[900px]:hidden">
              <button
                type="submit"
                className="cursor-pointer rounded-full border border-cocoa/20 bg-white/70 px-4 py-2 font-bold transition-colors hover:bg-white"
              >
                Вийти
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-360 grid-cols-[280px_1fr] gap-8 px-8 py-8 max-[900px]:grid-cols-1 max-[900px]:gap-4 max-[900px]:px-4 max-[900px]:py-4">
        <aside className="sticky top-24 self-start rounded-[28px] border border-white/90 bg-white/60 p-3 shadow-[0_14px_40px_rgba(90,60,40,0.08)] max-[900px]:hidden">
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

// Menus with the categories (and their subcategories) and the topics of news from the database
async function Sidebar() {
  const [categories, topics] = await Promise.all([getMenuCategories(), getMenuTopics()]);
  return <AdminSidebar categories={categories} topics={topics} />;
}

async function MobileMenu() {
  const [categories, topics] = await Promise.all([getMenuCategories(), getMenuTopics()]);
  return <AdminMobileMenu categories={categories} topics={topics} />;
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
      <span className="flex min-w-0 items-center gap-2 text-cocoa-soft max-[900px]:hidden">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-extrabold text-caramel uppercase"
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
      className="btn-shine inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_35%_30%,#fff8ec,#f3dcc0_70%)] px-4 py-2 font-bold whitespace-nowrap text-caramel shadow-[inset_0_-3px_6px_rgba(122,82,50,0.14),0_8px_18px_rgba(74,52,38,0.16)] transition-all duration-300 hover:border-white hover:bg-[linear-gradient(180deg,#b88a5e,#7a5232)] hover:text-white hover:shadow-[0_12px_24px_rgba(122,82,50,0.35)] max-[600px]:px-3.5"
    >
      <span className="max-[600px]:hidden">Відкрити сайт</span>
      <span className="hidden max-[600px]:inline">Сайт</span> <span aria-hidden="true">↗</span>
    </a>
  );
}
