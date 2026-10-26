import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";
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

const heading = "mb-3 text-xs font-extrabold tracking-[2px] text-sky uppercase";
const link = "text-on-navy transition-colors hover:text-white";

export function SiteFooter({ contacts }: { contacts?: SiteContacts | null }) {
  const t = useTranslations("Footer");
  const phones = contacts?.phones.length ? contacts.phones : defaultPhones;
  const email = contacts?.email || defaultEmail;
  const tNav = useTranslations("Nav");
  const tSupport = useTranslations("SupportMenu");

  return (
    <div className="mx-auto w-full max-w-360 px-20 pb-10 max-[820px]:px-4">
      {/* The brand trail line above the footer */}
      <div aria-hidden="true" className="brand-line mb-8" />
      {/* Thin metal rim around the light graphite footer card */}
      <div className="rounded-[41px] bg-[image:var(--navy-panel-rim)] p-px shadow-[0_24px_60px_rgb(0_10_50/0.35)] max-[820px]:rounded-[29px]">
      <footer className="relative isolate overflow-hidden rounded-[40px] bg-[image:var(--grad-footer-graphite)] text-on-navy max-[820px]:rounded-[28px]">
        <div className="relative z-1 grid grid-cols-[1fr_1.6fr_0.8fr] gap-10 px-12 max-[1100px]:grid-cols-2 pt-8 pb-5 max-[820px]:max-w-none max-[820px]:grid-cols-[auto_1fr] max-[820px]:gap-x-7 max-[820px]:gap-y-6 max-[820px]:px-6 max-[820px]:pt-6 max-[820px]:pb-4">
          {/* Column 1: brand and socials */}
          <div className="max-[820px]:col-span-2 max-[820px]:flex max-[820px]:items-start max-[820px]:justify-between max-[820px]:gap-3">
            <div>
              {/* The mark and the name */}
              <div className="flex items-center gap-3">
                <BrandMark className="h-12 w-auto" />
                <div className="metal-text pb-1 text-[30px] leading-none font-extrabold tracking-[-0.5px]">Carpigiani</div>
              </div>
              <p className="mt-2.5 text-sm leading-normal text-on-navy-soft">{t("about")}</p>
              <div className="mt-3.5 flex gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
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
          </div>

          {/* Column 2: contacts (address and phones side by side, so the footer stays low) */}
          <div className="max-[820px]:order-2">
            <div className={heading}>{t("contactsTitle")}</div>
            <div className="grid grid-cols-2 gap-6 text-[15px] leading-[1.6] max-[1100px]:grid-cols-1 max-[1100px]:gap-2.5 max-[820px]:gap-2.5 max-[820px]:text-sm">
              <address className="text-on-navy-soft not-italic min-[1101px]:whitespace-nowrap">
                {contacts ? contacts.company : t("company")}
                <br />
                {contacts ? contacts.street : t("street")}
                <br />
                {contacts ? contacts.city : t("city")}
              </address>
              <div className="flex flex-col">
                {phones.map((p) => (
                  <a key={p.href} href={p.href} className={link}>
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
          <div className="max-[820px]:order-1">
            <div className={heading}>{t("companyTitle")}</div>
            {companyLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${link} block py-0.75 text-[15px] leading-[1.6] max-[820px]:text-sm`}
              >
                {l.ns === "Nav" ? tNav(l.key) : tSupport(l.key)}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative z-1 mx-12 border-t border-white/14 pt-3.5 pb-5 text-[13px] text-on-dark-soft max-[820px]:mx-6 max-[820px]:max-w-none max-[820px]:pb-4 max-[820px]:text-xs">
          {t("copyright")} · {t("madeBy")}{" "}
          <a href="https://aostudio.art" target="_blank" rel="noopener" className={link}>
            AO Studio
          </a>
        </div>
      </footer>
      </div>
    </div>
  );
}
