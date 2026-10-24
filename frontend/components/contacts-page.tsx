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
// of the office (OpenStreetMap in the cream colours, the brand cone as the marker); on the right
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
    <li className="flex gap-3.5 border-b border-cocoa/8 py-4 first:pt-1 last:border-b-0 last:pb-1">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-caramel">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-extrabold tracking-[1.5px] text-gold uppercase">{title}</p>
        <div className="text-[15.5px] leading-relaxed text-cocoa">{children}</div>
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
  const link = "font-extrabold text-caramel transition-colors hover:text-cocoa";

  const card = (
    <div className="rounded-[30px] border border-white/90 bg-[rgba(255,253,248,0.94)] px-5.5 pt-5 pb-5 shadow-[0_14px_40px_rgba(90,60,40,0.09)]">
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
        className="btn-shine mt-3 flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,#b88a5e,#7a5232)] px-6 py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_22px_rgba(122,82,50,0.28)] transition hover:-translate-y-0.5 hover:brightness-108"
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
      <h1 className="mb-5.5 font-heading text-[40px] leading-[1.08] font-bold tracking-[-0.4px] text-caramel motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[30px]">
        {tNav("contacts")}
      </h1>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-10 max-[1100px]:grid-cols-[minmax(0,1fr)_330px] max-[1100px]:gap-7 max-[820px]:grid-cols-1 max-[820px]:gap-5.5">
        {/* Phones: the contacts first, the map under them */}
        <div className="hidden max-[820px]:block">
          <Reveal delay={100} radius={30}>
            {card}
          </Reveal>
        </div>
        <Reveal delay={120} radius={36} className="min-w-0">
          <section aria-label={t("map")} className="h-full">
            <SiteMap
              lat={contacts.lat}
              lng={contacts.lng}
              label={contacts.street || address}
              className="h-full min-h-150 rounded-[36px] shadow-[0_22px_50px_rgba(120,80,60,0.15)] max-[820px]:h-80 max-[820px]:min-h-0 max-[820px]:rounded-[26px]"
            />
          </section>
        </Reveal>
        <aside className="flex min-w-0 flex-col gap-6 max-[820px]:gap-5.5">
          <div className="max-[820px]:hidden">
            <Reveal delay={150} radius={30} className="reveal-side">
              {card}
            </Reveal>
          </div>
          <Reveal delay={300} radius={30}>
            <div className="rounded-[30px] border border-white/90 bg-[rgba(255,253,248,0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgba(120,80,60,0.16)]">
              <ContactForm variant="page" heading="contact" page="/contacts" />
            </div>
          </Reveal>
        </aside>
      </div>
    </main>
  );
}
