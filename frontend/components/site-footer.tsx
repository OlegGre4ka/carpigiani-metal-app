import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import type { SiteContacts } from "@/lib/site-pages";

// Contacts come from the admin panel ("Contacts", the layout passes them); until they come
// (or if the server does not answer) the ones the site always had.
const defaultPhones = [
  { label: "+38 044 465 5543", href: "tel:+380444655543" },
  { label: "+38 067 244 1109", href: "tel:+380672441109" },
];
const defaultEmail = "info@carpigiani.com.ua";

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/gelato.in.ukraine",
    icon: <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6v4h3v8h4v-8h3l1-4h-4V6.5c0-.3.2-.5.5-.5H15z" />,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCv5TBtOrqlGHZxeSFxvvNSQ",
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.5v5l4.5-2.5z" />
      </>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/carpigiani_ukraine/",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r=".6" />
      </>
    ),
  },
];

const companyLinks = [
  { key: "support", ns: "Nav", href: "/support" },
  { key: "project", ns: "SupportMenu", href: "/project" },
  { key: "service", ns: "SupportMenu", href: "/service" },
  { key: "contacts", ns: "Nav", href: "/contacts" },
] as const;

const heading = "mb-3 text-xs font-extrabold tracking-[2px] text-brand-pale uppercase";
const link = "text-white/90 transition-colors hover:text-white";

export function SiteFooter({ contacts }: { contacts?: SiteContacts | null }) {
  const t = useTranslations("Footer");
  const phones = contacts?.phones.length ? contacts.phones : defaultPhones;
  const email = contacts?.email || defaultEmail;
  const tNav = useTranslations("Nav");
  const tSupport = useTranslations("SupportMenu");

  return (
    // Metal footer on the full width: dark steel with a light line on top
    <footer className="relative mt-auto overflow-hidden border-t border-[var(--footer-line)] bg-[image:var(--grad-footer)] text-[var(--footer-text)]">
      {/* Big faint mark on the right: a quiet "signature" of the brand */}
      <BrandMark className="pointer-events-none absolute -right-6 -bottom-16 h-80 w-auto opacity-[0.07] max-[820px]:h-52" />

      <div className="relative mx-auto grid w-full max-w-360 grid-cols-[1.1fr_1.6fr_0.8fr] gap-12 px-20 pt-12 pb-8 max-[1100px]:px-10 max-[820px]:grid-cols-1 max-[820px]:gap-7 max-[820px]:px-4 max-[820px]:pt-9 max-[820px]:pb-6">
        {/* Column 1: brand and socials */}
        <div>
          <div className="text-white">
            <BrandLogo size="sm" />
          </div>
          <p className="mt-4 max-w-72 text-sm leading-relaxed">{t("about")}</p>
          <div className="mt-4 flex gap-2.5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-transparent hover:bg-[image:var(--grad-btn)]"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {s.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: contacts (address and phones side by side, so the footer stays low) */}
        <div>
          <div className={heading}>{t("contactsTitle")}</div>
          <div className="grid grid-cols-2 gap-6 text-[15px] leading-[1.6] max-[820px]:grid-cols-1 max-[820px]:gap-2.5 max-[820px]:text-sm">
            <address className="not-italic min-[821px]:whitespace-nowrap">
              {contacts ? contacts.company : t("company")}
              <br />
              {contacts ? contacts.street : t("street")}
              <br />
              {contacts ? contacts.city : t("city")}
            </address>
            <div className="flex flex-col">
              {phones.map((p) => (
                <a key={p.href} href={p.href} className={`${link} font-semibold`}>
                  {p.label}
                </a>
              ))}
              <a href={`mailto:${email}`} className={`${link} break-all`}>
                {email}
              </a>
            </div>
          </div>
        </div>

        {/* Column 3: company links */}
        <div>
          <div className={heading}>{t("companyTitle")}</div>
          {companyLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`${link} block py-0.75 text-[15px] leading-[1.6] max-[820px]:text-sm`}>
              {l.ns === "Nav" ? tNav(l.key) : tSupport(l.key)}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-360 px-20 max-[1100px]:px-10 max-[820px]:px-4">
        <div className="border-t border-white/12 pt-4 pb-6 text-[13px] max-[820px]:pb-5 max-[820px]:text-xs">
          {t("copyright")} · {t("madeBy")}{" "}
          <a href="https://aostudio.art" target="_blank" rel="noopener" className={`${link} font-bold`}>
            AO Studio
          </a>
        </div>
      </div>
    </footer>
  );
}
