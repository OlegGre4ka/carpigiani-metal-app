import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { CopyButton } from "@/components/copy-button";
import { EquipmentPageMark } from "@/components/contact-widget";
import { Reveal } from "@/components/reveal";
import { SiteMap } from "@/components/site-map";
import { routeHref } from "@/lib/route";
import { loadContacts, type SiteContacts } from "@/lib/site-pages";

// The "Contacts" page, in the same two columns as equipment and news pages: on the left the map
// of the office (OpenStreetMap a little muted, the brand mark as the marker); on the right
// the card with phones, email, address and hours, "Get directions", and the contact form under
// it. On phones: the card, the map, the form. Everything from the admin panel ("Contacts").

// Until the contacts are saved in the admin panel (or the server does not answer)
const fallback: SiteContacts = {
  phones: [
    { label: "+38 044 465 5543", href: "tel:+380444655543" },
    { label: "+38 067 244 1109", href: "tel:+380672441109" },
  ],
  email: "info@carpigiani.com.ua",
  company: "ТОВ «ХОЛОД»",
  street: "вул. Шумського, 1, оф. 317",
  city: "Київ, 02098",
  hours: "",
  lat: 50.4296,
  lng: 30.6189,
};

function Row({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3.5 border-b border-ink/8 py-4 first:pt-1 last:border-b-0 last:pb-1">
      {/* Navbar blue icons (as the icons of "What we do" on the home page) */}
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--grad-btn)] text-white shadow-[0_8px_18px_rgb(var(--navbar-rgb)/0.3)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">{title}</p>
        <div className="text-[15.5px] leading-relaxed text-ink">{children}</div>
      </div>
    </li>
  );
}

export async function ContactsPage() {
  const locale = await getLocale();
  const t = await getTranslations("ContactsPage");
  const tNav = await getTranslations("Nav");
  const contacts = (await loadContacts(locale)) ?? fallback;
  const address = [contacts.street, contacts.city].filter(Boolean).join(", ");
  const link = "font-extrabold text-brand transition-colors hover:text-ink";

  const card = (
    <div className="h-full rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] px-5.5 pt-5 pb-5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.09)]">
      <ul data-reveal-kids>
        <Row icon={<Phone size={18} strokeWidth={2.2} />} title={t("phones")}>
          {contacts.phones.map((phone) => (
            <div key={phone.href} className="flex items-center gap-2.5 py-0.5">
              <a href={phone.href} className={`${link} text-[17px]`}>
                {phone.label}
              </a>
              <CopyButton text={phone.label} label={phone.label} />
            </div>
          ))}
        </Row>
        <Row icon={<Mail size={18} strokeWidth={2.2} />} title={t("email")}>
          <div className="flex items-center gap-2.5">
            <a href={`mailto:${contacts.email}`} className={`${link} min-w-0 break-all`}>
              {contacts.email}
            </a>
            <CopyButton text={contacts.email} label={contacts.email} />
          </div>
        </Row>
        <Row icon={<MapPin size={18} strokeWidth={2.2} />} title={t("address")}>
          <address className="not-italic">
            {contacts.company && (
              <>
                {contacts.company}
                <br />
              </>
            )}
            {contacts.street}
            {contacts.city && (
              <>
                <br />
                {contacts.city}
              </>
            )}
          </address>
        </Row>
        {contacts.hours && (
          <Row icon={<Clock size={18} strokeWidth={2.2} />} title={t("hours")}>
            {contacts.hours}
          </Row>
        )}
      </ul>
      <a
        href={routeHref(contacts.lat, contacts.lng)}
        target="_blank"
        rel="noopener"
        className="btn-shine mt-3 flex items-center justify-center gap-2 rounded-full bg-[image:var(--grad-btn)] px-6 py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.28)] transition hover:-translate-y-0.5 hover:brightness-108"
      >
        <Navigation size={17} strokeWidth={2.4} aria-hidden="true" />
        {t("route")}
      </a>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      {/* The floating "Contact us" button hides on large screens: the form is on the page */}
      <EquipmentPageMark name="" />
      <Breadcrumbs items={[{ title: tNav("contacts") }]} />
      <h1 className="w-fit max-w-full mb-5.5 font-heading text-[33px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[25px]">
        {tNav("contacts")}
      </h1>

      {/* 29.10: one row, no empty space — the contacts on the left, the map in the middle, the
          form on the right; the map is as high as the row. Tablets: the map on top, the
          contacts and the form side by side under it. Phones: one under another. */}
      <div className="grid grid-cols-[330px_minmax(0,1fr)_360px] items-stretch gap-6 max-[1280px]:grid-cols-[300px_minmax(0,1fr)_330px] max-[1100px]:grid-cols-2 max-[820px]:grid-cols-1 max-[820px]:gap-5">
        <Reveal delay={100} radius={30} className="min-w-0 max-[1100px]:order-2 max-[820px]:order-1">
          {card}
        </Reveal>
        <Reveal delay={150} radius={36} className="min-w-0 max-[1100px]:order-1 max-[1100px]:col-span-2 max-[820px]:order-2 max-[820px]:col-span-1">
          <section aria-label={t("map")} className="h-full">
            <SiteMap
              lat={contacts.lat}
              lng={contacts.lng}
              label={contacts.street || address}
              className="h-full min-h-115 rounded-[36px] shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.2)] max-[1100px]:h-100 max-[1100px]:min-h-0 max-[820px]:h-80 max-[820px]:rounded-[26px]"
            />
          </section>
        </Reveal>
        <Reveal delay={200} radius={30} className="min-w-0 max-[1100px]:order-3">
          <div className="h-full rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.16)]">
            <ContactForm variant="page" heading="contact" page="/contacts" />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
