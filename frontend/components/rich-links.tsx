"use client";

import { useEffect } from "react";
import { useRouter as useNextRouter } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

// Links inside the texts of the admin panel (news, categories, equipment...) are plain <a> in
// the HTML of the text, so the browser loaded the whole site again on a click: the splash, the
// header, everything (4.11, Oleh: from a Technologies article to /maestro). Here a click on a
// link to a page of this site inside such a text opens it the way the menu does, without a
// reload, and in the language being read (/maestro on /en leads to /en/maestro).
// Files (photos, PDF), links to other sites, new tabs and Ctrl/Cmd+click stay as they are.

const FILE = /\.(pdf|jpe?g|png|webp|gif|svg|zip|docx?|xlsx?)$/i;

export function RichLinks() {
  const router = useRouter();
  const nextRouter = useNextRouter();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || !link.closest(".rich")) return;
      const href = link.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//") || link.target === "_blank" || link.hasAttribute("download")) return;
      const path = href.split(/[?#]/)[0];
      if (FILE.test(path) || path.startsWith("/uploads/") || path.startsWith("/images/")) return;
      event.preventDefault();
      // A link that already names the language goes as it is
      if (/^\/(en|uk)(\/|$)/.test(href)) nextRouter.push(href);
      else router.push(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router, nextRouter]);

  return null;
}
