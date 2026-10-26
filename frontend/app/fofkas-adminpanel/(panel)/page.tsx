import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { SectionIcon, adminSections, brandSections, type AdminSection } from "@/components/admin/sections";
import { backendFetch, getAdminBrands } from "@/lib/admin/backend";
import { BRANDS_PATH } from "@/lib/admin/brands";

// Home of the admin panel: site statistics.
// No real data yet: requests come after the contact form is connected,
// visits after the Umami counter is installed on the server. Until then every
// block honestly says what it will show.
export default function AdminHomePage() {
  return (
    <div>
      <h1 className="motion-safe:animate-fade-up font-heading tracking-[-0.02em] text-[36px] leading-none font-extrabold text-ink max-[600px]:text-[30px]">Головна</h1>
      <p className="mt-3 max-w-[60ch] motion-safe:animate-fade-up motion-safe:[animation-delay:80ms] text-[16px] leading-relaxed text-ink-soft">
        Заявки, відвідування й наповнення сайту в одному місці.
      </p>

      <QuickActions />

      <div className="mt-6 grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
        <Requests />
        <Content />
        <Visits />
      </div>
    </div>
  );
}

/* ---------- Building blocks ---------- */

type CardProps = { title: string; badge?: ReactNode; children: ReactNode; className?: string; delay?: number };

/** White card. Appears with a soft rise; delay (ms) makes the cards come one after another */
function Card({ title, badge, children, className = "", delay = 0 }: CardProps) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className={`motion-safe:animate-fade-up rounded-[28px] steel-card p-6 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[600px]:rounded-3xl max-[600px]:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading tracking-[-0.02em] text-[23px] leading-none font-extrabold text-ink">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function NotConnected({ children = "Ще не підключено" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs font-bold text-steel">
      <span className="size-1.5 rounded-full bg-steel" aria-hidden="true" />
      {children}
    </span>
  );
}

function Empty({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-[22px] border border-dashed border-ink/20 bg-page/60 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist text-brand">
        <SectionIcon className="size-5.5">{icon}</SectionIcon>
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm leading-normal text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

/* ---------- 1. Quick actions ---------- */

const actions = [
  { href: "/fofkas-adminpanel/news", label: "Додати новину" },
  { href: BRANDS_PATH, label: "Додати виробника" },
];

function QuickActions() {
  return (
    <div className="mt-6 flex flex-wrap gap-2.5 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[600px]:grid max-[600px]:grid-cols-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--grad-btn)] px-5 py-3 text-sm max-[600px]:gap-1.5 max-[600px]:px-3 max-[600px]:text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.25)] transition hover:-translate-y-0.5 hover:brightness-108"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}

/* ---------- 2. Requests from the contact form ---------- */

type RequestItem = { id: number; name: string; email: string; subject: string; message: string; is_read: boolean; created_at: string };

async function loadRequests(): Promise<{ items: RequestItem[]; new: number } | null> {
  try {
    const response = await backendFetch("/api/admin/requests");
    if (!response.ok) return null;
    return (await response.json()) as { items: RequestItem[]; new: number };
  } catch {
    return null;
  }
}

/** "1 нова заявка", "3 нові заявки", "5 нових заявок" */
function newRequests(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return "нова заявка";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "нові заявки";
  return "нових заявок";
}

// The card shows at once; the requests come from the server inside Suspense
function Requests() {
  return (
    <Card delay={240} title="Заявки" badge={<Link href="/fofkas-adminpanel/requests" className="text-sm font-bold text-brand hover:text-ink">Усі заявки →</Link>}>
      <Suspense fallback={<p className="text-ink-soft">…</p>}>
        <RequestsSummary />
      </Suspense>
    </Card>
  );
}

async function RequestsSummary() {
  const data = await loadRequests();
  const latest = data?.items.slice(0, 4) ?? [];
  return (
    <>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-[40px] leading-none font-extrabold text-brand">{data?.new ?? 0}</span>
        <span className="text-sm font-semibold text-ink-soft">{newRequests(data?.new ?? 0)}</span>
      </div>
      {latest.length === 0 ? (
        <Empty
          title="Заявок поки немає"
          icon={
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          }
        >
          Тут будуть останні заявки з форми «Зв&apos;язатися з нами» на сайті.
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-ink/8">
          {latest.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${item.is_read ? "bg-ink/15" : "bg-brand"}`} />
              <Link href="/fofkas-adminpanel/requests" className="min-w-0 flex-1 hover:text-brand">
                <b className={`block truncate text-[15px] ${item.is_read ? "font-semibold" : "font-extrabold"}`}>
                  {item.name || item.email}
                  {item.subject && <span className="font-semibold text-ink-soft"> · {item.subject}</span>}
                </b>
                <span className="block truncate text-sm text-ink-soft">{item.message || "(без повідомлення)"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------- 3. Content of the site ---------- */

/** Sections that are not content to fill in */
const NOT_CONTENT = ["/fofkas-adminpanel/requests", "/fofkas-adminpanel/contacts"];

/** "1 категорія", "3 категорії", "5 категорій" */
function categories(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} категорія`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} категорії`;
  return `${n} категорій`;
}

/** "1 новина", "3 новини", "5 новин" */
function news(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} новина`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} новини`;
  return `${n} новин`;
}

/** What is already filled in: categories of each brand, and news. */
async function loadCounts(sections: AdminSection[]): Promise<Record<string, string | null>> {
  try {
    const [response, newsResponse] = await Promise.all([
      backendFetch("/api/admin/equipment-categories"),
      backendFetch("/api/admin/news"),
    ]);
    if (!response.ok) return {};
    const all = (await response.json()) as { is_visible: boolean; brand?: string }[];
    const summary = (list: { is_visible: boolean }[]) =>
      `${categories(list.length)}, на сайті ${list.filter((item) => item.is_visible).length}`;
    const counts: Record<string, string> = {};
    for (const section of sections) {
      if (!section.brand) continue;
      const list = all.filter((item) => item.brand === section.brand);
      if (list.length) counts[section.href] = summary(list) + (section.hidden ? " (виробник прихований)" : "");
    }
    const newsList = newsResponse.ok ? ((await newsResponse.json()) as { is_visible: boolean }[]) : [];
    if (newsList.length) {
      counts["/fofkas-adminpanel/news"] = `${news(newsList.length)}, на сайті ${newsList.filter((item) => item.is_visible).length}`;
    }
    return counts;
  } catch {
    return {};
  }
}

// The card shows at once; the numbers come from the server inside Suspense
// (Next.js asks for this: data read with the login cookie must be inside Suspense).
function Content() {
  return (
    <Card delay={320} title="Наповнення сайту">
      <Suspense fallback={<ContentList sections={otherSections} counts={null} />}>
        <ContentWithCounts />
      </Suspense>
    </Card>
  );
}

/** Content sections other than the brands (news) */
const otherSections = adminSections.filter((section) => !NOT_CONTENT.includes(section.href));

async function ContentWithCounts() {
  // A line per brand from the database, then news
  const sections = [...brandSections(await getAdminBrands()), ...otherSections];
  return <ContentList sections={sections} counts={await loadCounts(sections)} />;
}

/** counts = null while the numbers are loading */
function ContentList({ sections, counts }: { sections: AdminSection[]; counts: Record<string, string | null> | null }) {
  return (
    <ul className="flex flex-col divide-y divide-ink/8">
      {sections.map((section) => {
        const count = counts?.[section.href];
        return (
          <li key={section.href} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist text-brand">
              <SectionIcon className="size-5.5">{section.icon}</SectionIcon>
            </span>
            <div className="min-w-0 flex-1">
              <p className="leading-snug font-bold">{section.title}</p>
              <p className={`mt-0.5 text-sm ${count ? "font-semibold text-brand" : "text-ink-soft"}`}>
                {counts === null ? "…" : (count ?? "Ще нічого не додано")}
              </p>
            </div>
            <Link href={section.href} className="shrink-0 text-sm font-bold text-brand hover:text-ink">
              {count ? "Відкрити →" : "Додати →"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- 4. Visits (Umami) ---------- */

const periods = ["Сьогодні", "7 днів", "30 днів"];

const details = [
  {
    title: "Популярні сторінки",
    text: "Які сторінки відкривають найчастіше",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  },
  {
    title: "Звідки приходять",
    text: "Google, соцмережі, прямі заходи",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  {
    title: "Пристрої",
    text: "Телефони, комп'ютери, планшети",
    icon: (
      <>
        <rect x="2" y="4" width="14" height="11" rx="1.5" />
        <rect x="15" y="9" width="7" height="12" rx="1.5" />
        <path d="M6 19h6" />
      </>
    ),
  },
];

function Visits() {
  return (
    <Card delay={400} title="Відвідування" badge={<NotConnected>Лічильник Umami підключимо на сервері</NotConnected>} className="col-span-full">
      <div className="grid grid-cols-3 gap-3 max-[600px]:gap-2">
        {periods.map((period) => (
          <div key={period} className="rounded-[20px] bg-page/80 px-4 py-3.5 max-[600px]:px-3">
            <p className="text-xs font-bold tracking-[1px] text-steel uppercase">{period}</p>
            <p className="mt-1.5 text-[32px] leading-none font-extrabold text-ink/30">—</p>
            <p className="mt-1 text-xs text-ink-soft">відвідувачів</p>
          </div>
        ))}
      </div>

      {/* Place for the chart */}
      <div className="relative mt-4 flex h-48 items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-ink/20 bg-page/60 px-6 text-center max-[600px]:h-40">
        <svg aria-hidden="true" viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-3/5 w-full text-mist">
          <path d="M0 120V60h400v60z" fill="currentColor" opacity="0.35" />
          <path d="M0 30h400M0 60h400M0 90h400" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>
        <p className="relative max-w-[42ch] text-sm leading-normal text-ink-soft">
          Тут буде графік відвідувань по днях. Дані з&apos;являться, коли лічильник почне рахувати відвідувачів сайту.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        {details.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-[20px] bg-page/80 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist text-brand">
              <SectionIcon className="size-5">{item.icon}</SectionIcon>
            </span>
            <div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className="mt-0.5 text-xs leading-normal text-ink-soft">{item.text}</p>
              <p className="mt-2 text-xs font-semibold text-ink/45">Немає даних</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
