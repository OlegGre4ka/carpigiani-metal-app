import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { Link } from "@/i18n/navigation";

// One compact line above the title of a page ("News › Interesting"), so the content is visible
// at once; on phones it scrolls sideways. The last item is the page itself (no link); an item
// without href is plain text.
// 29.10 (Oleh): no "Home" (it is always in the menu) and no line at all on the pages of the
// menu itself (Contacts, News, Search): only deeper pages show where they are. The empty
// place keeps its height, so titles start at the same height on all pages.

export type Crumb = { title: string; href?: string };

export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = await getTranslations();
  const all = items;
  if (all.length < 2) {
    return (
      <div aria-hidden="true" className="pt-5 pb-2 text-[11px] leading-snug max-[820px]:pt-4">
        &nbsp;
      </div>
    );
  }

  return (
    <nav
      aria-label={t("CategoryPage.breadcrumbs")}
      className="flex items-center gap-1.5 overflow-x-auto pt-5 pb-2 text-[11px] max-[820px]:pt-4 leading-snug font-bold tracking-[1px] whitespace-nowrap text-steel uppercase [scrollbar-width:none] motion-safe:animate-fade-up [&::-webkit-scrollbar]:hidden"
    >
      {all.map((crumb, index) => {
        const last = index === all.length - 1;
        return (
          <Fragment key={`${index}-${crumb.title}`}>
            {index > 0 && (
              <span aria-hidden="true" className="opacity-60">
                ›
              </span>
            )}
            {last ? (
              <span aria-current="page">{crumb.title}</span>
            ) : crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-brand">
                {crumb.title}
              </Link>
            ) : (
              <span>{crumb.title}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
