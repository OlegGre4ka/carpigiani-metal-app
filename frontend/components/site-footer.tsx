import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-logo";
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

const link = "text-on-navy transition-colors hover:text-white";

export function SiteFooter({ contacts }: { contacts?: SiteContacts | null }) {
  const t = useTranslations("Footer");
  const phones = contacts?.phones.length ? contacts.phones : defaultPhones;
  const email = contacts?.email || defaultEmail;

  return (
    <div className="mx-auto w-full max-w-360 px-20 pb-10 max-[820px]:px-4">
      {/* The brand trail line above the footer */}
      <div aria-hidden="true" className="brand-line mb-8 max-[820px]:mb-6" />
      {/* Thin metal rim around the light graphite footer card */}
      <div className="rounded-[41px] bg-[image:var(--navy-panel-rim)] p-px shadow-[0_24px_60px_rgb(0_10_50/0.35)] max-[820px]:rounded-[29px]">
      <footer className="relative isolate overflow-hidden rounded-[40px] bg-[image:var(--grad-footer-graphite)] text-on-navy max-[820px]:rounded-[28px]">
        {/* Low footer (29.10): three columns spread evenly — the company · the address with the
            socials under it · the phones and the e-mail; "© company · made by AO Studio" under the
            first column. Tablets and phones: the company on top, the other two side by side. */}
        <div className="relative z-1 flex items-start justify-between gap-10 px-12 pt-7 pb-7 max-[1100px]:grid max-[1100px]:grid-cols-[1fr_auto] max-[1100px]:gap-x-10 max-[1100px]:gap-y-5 max-[820px]:gap-x-4 max-[820px]:gap-y-4 max-[820px]:px-6 max-[820px]:pt-6 max-[820px]:pb-6">
          {/* The company */}
          <div className="max-w-90 max-[1100px]:col-span-2 max-[1100px]:max-w-none">
            <div className="flex items-center gap-3">
              <BrandMark className="h-12 w-auto shrink-0" />
              <div className="metal-text pb-1 text-[28px] leading-[1.1] font-extrabold tracking-[-0.5px] max-[820px]:text-[24px]">
                {contacts ? contacts.company : t("company")}
              </div>
            </div>
            <p className="mt-2.5 text-sm leading-normal text-on-navy-soft">{t("about")}</p>
            {/* Bottom left, in one line under a thin light line: on the right the "Contact us"
                button always floats over the corner of the footer (29.10) */}
            <div className="mt-4 border-t border-white/14 pt-3 text-[13px] leading-normal text-on-dark-soft max-[820px]:mt-3 max-[820px]:text-xs">
              © {contacts ? contacts.company : t("company")} · {t("madeBy")}{" "}
              <a href="https://aostudio.art" target="_blank" rel="noopener" className={link}>
                AO Studio
              </a>
            </div>
          </div>

          {/* The address and the socials under it */}
          <div className="min-w-0 text-[15px] leading-[1.6] max-[820px]:text-[13px]">
            <address className="text-on-navy-soft not-italic">
              {contacts ? contacts.street : t("street")}
              <br />
              {contacts ? contacts.city : t("city")}
            </address>
            <div className="mt-3.5 flex gap-2.5 max-[820px]:mt-3 max-[820px]:gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 max-[820px]:size-9"
                >
                  <svg
                    width="18"
                    height="18"
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

          {/* The phones and the e-mail */}
          <div className="flex flex-col text-[15px] leading-[1.6] max-[820px]:text-[13px]">
            {phones.map((p) => (
              <a key={p.href} href={p.href} className={`${link} whitespace-nowrap`}>
                {p.label}
              </a>
            ))}
            <a href={`mailto:${email}`} className={`${link} whitespace-nowrap`}>
              {email}
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
