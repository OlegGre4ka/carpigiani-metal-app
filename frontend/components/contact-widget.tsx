"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ContactForm } from "@/components/contact-form";

// Shows the "up" button after this much scrolling
const SHOW_UP_AFTER = 300;

/** Put on pages with the contact form in the right column: equipment (components/site-page.tsx)
 *  and news (name "", components/news-article.tsx). While the page is open, <html> gets
 *  data-equipment-page="<equipment name>": the floating button hides on large screens and
 *  its form says which equipment the request is about (nothing for news). Next keeps a page you left hidden in
 *  the background, so a mark inside the page itself would stay; this one is removed as soon
 *  as the page is left. */
export function EquipmentPageMark({ name }: { name: string }) {
  useEffect(() => {
    document.documentElement.dataset.equipmentPage = name;
    return () => {
      delete document.documentElement.dataset.equipmentPage;
    };
  }, [name]);
  return null;
}

/** On an equipment page: its name (for "Inquiry about") */
function equipmentOnPage() {
  const name = document.documentElement.dataset.equipmentPage;
  return name !== undefined ? { subject: name, page: window.location.pathname } : null;
}

// Floating "Contact us" button with the contact form, and the "up" button above it.
// On every page of the site, bottom right. The form is the same as on equipment pages
// (components/contact-form.tsx). On phones it opens as a panel from the bottom.
// On equipment pages on large screens the button is hidden: the form is always on the screen
// there (see .contact-fab in globals.css).
export function ContactWidget() {
  const t = useTranslations("Contact");
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<{ subject: string; page: string } | null>(null);
  const [showUp, setShowUp] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  // "Up" button appears only after the visitor has scrolled down
  useEffect(() => {
    const onScroll = () => setShowUp(window.scrollY > SHOW_UP_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  function show() {
    setContext(equipmentOnPage());
    setOpen(true);
  }

  // Esc closes the form; the cursor goes to the name field when the form opens
  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      {/* Up: same "ice cream scoop" as the slider arrows */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("toTop")}
        tabIndex={showUp && !open ? 0 : -1}
        aria-hidden={showUp && !open ? undefined : true}
        className={`contact-up fixed right-8 bottom-26 z-58 flex size-14 items-center justify-center rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_35%_30%,#fff8ec,#f3dcc0_70%)] text-caramel shadow-[inset_0_-4px_8px_rgba(122,82,50,0.18),0_12px_26px_rgba(74,52,38,0.25)] transition-all duration-300 hover:scale-112 hover:border-white hover:bg-[linear-gradient(180deg,#b88a5e,#7a5232)] hover:text-white hover:shadow-[0_16px_32px_rgba(122,82,50,0.4)] max-[820px]:right-5 max-[820px]:bottom-22 max-[820px]:size-12 ${
          showUp && !open ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>

      {/* Form: a card above the button; on phones a panel from the bottom over a dimmed page */}
      {open && (
        <>
          <div aria-hidden="true" onClick={close} className="scrim-in fixed inset-0 z-58 hidden bg-[rgba(74,52,38,0.45)] max-[820px]:block" />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="contact-panel fixed right-7 bottom-26 z-59 max-h-[calc(100dvh-120px)] w-90 max-w-[calc(100vw-32px)] overflow-y-auto rounded-[30px] border border-white/80 bg-[rgba(255,252,246,0.96)] px-6 pt-6 pb-5 shadow-[0_30px_70px_rgba(120,80,60,0.28)] backdrop-blur-[14px] max-[820px]:inset-x-0 max-[820px]:right-0 max-[820px]:bottom-0 max-[820px]:max-h-[92dvh] max-[820px]:w-auto max-[820px]:max-w-none max-[820px]:rounded-b-none max-[820px]:bg-[#fffcf6] max-[820px]:px-4 max-[820px]:pt-2.5 max-[820px]:pb-5"
          >
            <span aria-hidden="true" className="mx-auto mb-3 hidden h-1.25 w-11 rounded-full bg-cocoa/20 max-[820px]:block" />
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="absolute top-4 right-4 z-1 flex size-9 items-center justify-center rounded-full bg-sand text-cocoa transition-colors hover:bg-[#ecdcc6] max-[820px]:top-6"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-4.5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <ContactForm variant="popup" subject={context?.subject} page={context?.page} firstFieldRef={nameRef} />
          </div>
        </>
      )}

      {/* Main button */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : show())}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`contact-fab fixed right-7 bottom-7 z-60 flex h-15 items-center gap-2.5 rounded-full bg-[linear-gradient(180deg,#b88a5e,#7a5232)] pr-6.5 pl-5 text-[15px] font-extrabold text-white shadow-[0_14px_30px_rgba(122,82,50,0.4)] transition hover:-translate-y-0.5 hover:brightness-108 motion-reduce:animate-none max-[820px]:right-4 max-[820px]:bottom-4 max-[820px]:h-13.5 max-[820px]:pr-5 max-[820px]:pl-4 ${
          open ? "max-[820px]:hidden" : "animate-fab-pulse"
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span className="max-[820px]:hidden">{t("open")}</span>
        <span className="hidden max-[820px]:inline">{t("openShort")}</span>
      </button>
    </>
  );
}
