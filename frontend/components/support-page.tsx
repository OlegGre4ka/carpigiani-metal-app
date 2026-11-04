import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { EquipmentPageMark } from "@/components/contact-widget";
import { NewsGrid } from "@/components/news-cards";
import { Reveal } from "@/components/reveal";
import { Block } from "@/components/site-page";
import { Link } from "@/i18n/navigation";
import type { SitePageData } from "@/lib/site-pages";

// A page of the "Support" menu (4.11): Carpigiani Gelato University, Technologies and any other
// the client adds in the admin panel → "Підтримка". Left: the blocks of the page (text, photos,
// video...). Right: the articles of its topic of news as a menu, and the "contact us" card with
// its own title and text, the contact form and a link to the Contacts page. At the bottom: all
// the articles of the topic as news cards.
export async function SupportPage({ page, href }: { page: SitePageData; href: string }) {
  const t = await getTranslations();
  const articles = page.articles ?? [];

  return (
    <main className="mx-auto w-full max-w-360 flex-1 px-20 pb-18 max-[820px]:px-4 max-[820px]:pb-12">
      {/* The form is on the right: the floating "Contact us" button hides on large screens */}
      <EquipmentPageMark name="" />
      <Breadcrumbs items={[{ title: t("Nav.support") }, { title: page.title }]} />

      <h1 className="mb-5.5 w-fit max-w-full font-heading text-[33px] leading-[1.08] font-extrabold tracking-[-0.02em] metal-text-dark motion-safe:animate-fade-up motion-safe:[animation-delay:60ms] max-[820px]:text-[25px]">
        {page.title}
      </h1>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-10 max-[1100px]:grid-cols-[minmax(0,1fr)_300px] max-[1100px]:gap-7 max-[820px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-8 max-[820px]:gap-5.5">
          {page.blocks.map((block, index) => (
            <Reveal key={block.id} delay={Math.min(index, 4) * 90} radius={30} className="min-w-0">
              <Block block={block} compact title={page.title} />
            </Reveal>
          ))}
        </div>

        {/* Right column: as tall as the left one, nothing with a transform around the sticky card */}
        <aside className="flex min-w-0 flex-col gap-6">
          {articles.length > 0 && (
            <Reveal delay={150} radius={30} className="reveal-side">
              <nav
                aria-label={t("SupportPage.articles")}
                className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.94)] px-4.5 pt-5 pb-3.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.09)]"
              >
                <p className="mb-2 px-1.5 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">
                  {page.topic_title ? t("SupportPage.articlesOf", { topic: page.topic_title }) : t("SupportPage.articles")}
                </p>
                <ul className="flex flex-col">
                  {articles.map((article) => (
                    <li key={article.href}>
                      <Link
                        href={article.href}
                        className="group flex items-start gap-2 rounded-[14px] px-1.5 py-2 text-[14px] leading-snug font-bold text-navbar transition-colors hover:bg-mist"
                      >
                        <ArrowRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        <span className="min-w-0">{article.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>
          )}
          <div className="sticky top-6">
            <Reveal delay={350} radius={30}>
              <div className="rounded-[30px] border border-white/90 bg-[rgb(var(--paper-rgb)/0.96)] px-5 pt-5.5 pb-4.5 shadow-[0_22px_50px_rgb(var(--shadow-rgb)/0.16)]">
                <ContactForm
                  variant="page"
                  heading="contact"
                  page={href}
                  subject={page.title}
                  customTitle={page.contact_title || undefined}
                  customText={page.contact_text || undefined}
                />
                <Link
                  href="/contacts"
                  className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-extrabold text-navbar hover:underline"
                >
                  {t("SupportPage.toContacts")}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </aside>
      </div>

      {/* All the articles of the topic, as news cards */}
      {articles.length > 0 && (
        <section className="mt-16 max-[820px]:mt-10">
          <h2 className="mb-6 w-fit max-w-full font-heading text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em] metal-text-dark max-[820px]:text-[24px]">
            {page.topic_title || t("SupportPage.articles")}
          </h2>
          <NewsGrid items={articles} />
        </section>
      )}
    </main>
  );
}
