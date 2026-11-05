import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-logo";
import { SocialIcon, networkLabel } from "@/components/social-icons";
import { Link } from "@/i18n/navigation";
import type { FooterPiece, SiteContacts, SiteFooterData } from "@/lib/site-pages";

// The footer of every page. Contacts come from the admin panel ("Contacts"); the texts, the
// logo, the socials, the links and where each part stands (which of the 4 columns, in which
// order) — from "Загальні налаштування → Футер" (5.11). Until they come (or if the server does
// not answer): what the site always had. The last line "© company · made by AO Studio" is
// always there.
const defaultPhones = [
  { label: "+38 044 465 5543", href: "tel:+380444655543" },
  { label: "+38 067 244 1109", href: "tel:+380672441109" },
];
const defaultEmail = "info@carpigiani.com.ua";
const defaultFooter: Omit<SiteFooterData, "about"> = {
  title: "",
  about2: "",
  logo: "",
  show_logo: true,
  socials: [
    { network: "facebook", url: "https://www.facebook.com/gelato.in.ukraine" },
    { network: "youtube", url: "https://www.youtube.com/channel/UCv5TBtOrqlGHZxeSFxvvNSQ" },
    { network: "instagram", url: "https://www.instagram.com/carpigiani_ukraine/" },
  ],
  columns: [["brand", "about"], ["address", "socials"], ["contacts"]],
  links_title: "",
  links: [],
};

const link = "text-on-navy transition-colors hover:text-white";
// Long words (an e-mail, an address) wrap instead of pushing the footer wider
const wrap = "min-w-0 [overflow-wrap:anywhere]";
const textSize = "text-[15px] leading-[1.6] max-[820px]:text-[13px]";
// A column with a text is as wide as the text allows (up to 360 px), the others as their content
const hasText = (column: FooterPiece[]) => column.includes("about") || column.includes("about2");

export function SiteFooter({ contacts, footer }: { contacts?: SiteContacts | null; footer?: SiteFooterData | null }) {
  const t = useTranslations("Footer");
  const phones = contacts?.phones.length ? contacts.phones : defaultPhones;
  const email = contacts?.email || defaultEmail;
  const company = contacts ? contacts.company : t("company");
  const data = footer ?? { ...defaultFooter, about: t("about") };

  const about = (text: string) => <p className={`${wrap} text-sm leading-normal whitespace-pre-line text-on-navy-soft`}>{text}</p>;

  const pieces: Record<FooterPiece, ReactNode> = {
    // The logo (can be switched off) and the title (its own, or the name of the company)
    brand: (
      <div className="flex min-w-0 items-center gap-3">
        {data.show_logo &&
          (data.logo ? (
            <Image src={data.logo} alt="" width={240} height={96} className="h-12 w-auto max-w-40 shrink-0 object-contain" />
          ) : (
            <BrandMark className="h-12 w-auto shrink-0" />
          ))}
        <div className={`${wrap} metal-text pb-1 text-[28px] leading-[1.1] font-extrabold tracking-[-0.5px] max-[820px]:text-[24px]`}>
          {data.title || company}
        </div>
      </div>
    ),
    about: about(data.about),
    about2: about(data.about2),
    address: (
      <address className={`${wrap} ${textSize} text-on-navy-soft not-italic`}>
        {contacts ? contacts.street : t("street")}
        <br />
        {contacts ? contacts.city : t("city")}
      </address>
    ),
    socials: (
      <div className="flex flex-wrap gap-2.5 max-[820px]:gap-2">
        {data.socials.map((s) => (
          <a
            key={`${s.network}-${s.url}`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={networkLabel(s.network)}
            className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 max-[820px]:size-9"
          >
            <SocialIcon network={s.network} />
          </a>
        ))}
      </div>
    ),
    // The phones and the e-mail
    contacts: (
      <div className={`${wrap} ${textSize} flex flex-col`}>
        {phones.map((p) => (
          <a key={p.href} href={p.href} className={`${link} whitespace-nowrap`}>
            {p.label}
          </a>
        ))}
        <a href={`mailto:${email}`} className={link}>
          {email}
        </a>
      </div>
    ),
    // Links: pages of the site or other sites (hidden until the client shows it)
    links: (
      <nav aria-label={data.links_title || undefined} className={`${wrap} ${textSize}`}>
        {data.links_title && <p className="mb-1 text-xs font-extrabold tracking-[1.5px] text-on-dark-soft uppercase">{data.links_title}</p>}
        <ul className="flex flex-col">
          {data.links.map((item) => (
            <li key={`${item.href}-${item.title}`}>
              {item.href.startsWith("/") ? (
                <Link href={item.href} className={link}>
                  {item.title}
                </Link>
              ) : (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {item.title}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    ),
  };

  // Large screens: the columns in one row spread evenly. Tablets and phones: the column with the
  // name of the company on its own row, the others side by side, as many as fit.
  const columns = data.columns.map((column) => (hasText(column) ? "minmax(0,22.5rem)" : "auto")).join(" ");

  return (
    <div className="mx-auto w-full max-w-360 px-20 pb-10 max-[820px]:px-4 max-[820px]:pb-24">
      {/* The brand trail line above the footer */}
      <div aria-hidden="true" className="brand-line mb-8 max-[820px]:mb-6" />
      {/* Thin metal rim around the light graphite footer card */}
      <div className="rounded-[41px] bg-[image:var(--navy-panel-rim)] p-px shadow-[0_24px_60px_rgb(0_10_50/0.35)] max-[820px]:rounded-[29px]">
        <footer className="relative isolate overflow-hidden rounded-[40px] bg-[image:var(--grad-footer-graphite)] text-on-navy max-[820px]:rounded-[28px]">
          {data.columns.length > 0 && (
            <div
              style={{ "--footer-cols": columns } as CSSProperties}
              className="relative z-1 grid grid-cols-(--footer-cols) items-start justify-between gap-10 px-12 pt-7 pb-5 max-[1100px]:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] max-[1100px]:justify-normal max-[1100px]:gap-x-10 max-[1100px]:gap-y-5 max-[820px]:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] max-[820px]:gap-x-4 max-[820px]:gap-y-4 max-[820px]:px-6 max-[820px]:pt-6 max-[820px]:pb-6"
            >
              {data.columns.map((column) => (
                <div key={column.join("-")} className={`flex min-w-0 flex-col gap-3 ${column.includes("brand") ? "max-[1100px]:col-span-full" : ""} max-[1100px]:max-w-none`}>
                  {column.map((key) => (
                    <div key={key} className="min-w-0">
                      {pieces[key]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {/* Always the last line of the footer, under a thin light line, on the left */}
          <div
            className={`relative z-1 mx-12 pt-3 pb-4 text-[13px] leading-normal text-on-dark-soft max-[820px]:mx-6 max-[820px]:text-xs ${
              data.columns.length > 0 ? "border-t border-white/14" : "pt-5"
            }`}
          >
            © {company} · {t("madeBy")}{" "}
            <a href="https://aostudio.art" target="_blank" rel="noopener" className={link}>
              AO Studio
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
