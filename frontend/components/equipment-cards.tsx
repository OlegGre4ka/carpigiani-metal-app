"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cardLift, moreButton, scoopArrow } from "@/components/card-styles";
import { ContactForm } from "@/components/contact-form";
import { Link } from "@/i18n/navigation";
import type { EquipmentCard } from "@/lib/site-pages";

// Cards of equipment / showcases of a subcategory (category pages; later the IFI chips and the
// showcases block on the home page). All cards are the same height: the description is cut to
// 3 lines. A click on a card opens a quick view: a big photo, the whole description, "More"
// (the page of the equipment) and "Ask for a price" (the contact form of the site, already
// saying which equipment it is about). On phones the quick view slides up from the bottom.
// Arrows in the quick view show the previous / next card of the same list (only the cards of
// the chosen chip, if one is chosen).

const noop = () => () => {};

export function EquipmentCards({ items }: { items: EquipmentCard[] }) {
  const t = useTranslations("Equipment");
  // Which card is open in the quick view (its place in the list)
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <ul data-reveal-kids className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[820px]:gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-haspopup="dialog"
              className={`group flex h-full w-full flex-col rounded-[30px] steel-card p-4 text-left shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[820px]:rounded-[22px] max-[820px]:p-2.5 ${cardLift}`}
            >
              <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[20px] bg-white">
                {item.image && (
                  <Image
                    src={item.image}
                    alt=""
                    width={600}
                    height={450}
                    sizes="(max-width: 1100px) 50vw, 300px"
                    className="max-h-[92%] w-auto max-w-[88%] object-contain transition-transform duration-400 group-hover:scale-105"
                  />
                )}
                <span className={`absolute right-3 bottom-3 max-[820px]:right-2 max-[820px]:bottom-2 max-[820px]:px-3.5 max-[820px]:py-1.5 max-[820px]:text-xs ${moreButton}`}>
                  {t("view")}
                </span>
              </span>
              {item.label && (
                <span className="mx-1.5 mt-4 self-start rounded-full bg-tag px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] text-tag-ink max-[820px]:mt-3 max-[820px]:text-[10px]">
                  {item.label}
                </span>
              )}
              <span className="mx-1.5 mt-2.5 mb-1.5 line-clamp-2 text-xl font-extrabold text-ink max-[820px]:text-base">{item.title}</span>
              {item.text && (
                <span className="mx-1.5 mb-1.5 line-clamp-3 text-sm leading-normal text-ink-soft max-[820px]:text-[13px]">{item.text}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && items[open] && <QuickView items={items} index={open} onMove={setOpen} onClose={close} />}
    </>
  );
}

// Arrow buttons: the same "ice cream scoop" as the slider arrows and the "up" button
const arrow = scoopArrow;

function ArrowIcon({ back }: { back?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-5.5">
      <path d={back ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/** Quick view of the cards: a window in the middle (large screens) or a panel from the bottom
 *  (phones). Arrows (and the keys ← →, and a swipe on phones) show the previous / next card of
 *  the same list without closing it; on the first and the last card the arrow is pale.
 *  Esc, the cross or a click on the dark page closes it. */
function QuickView({
  items,
  index,
  onMove,
  onClose,
}: {
  items: EquipmentCard[];
  index: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Equipment");
  const tc = useTranslations("Contact");
  const item = items[index];
  const [asking, setAsking] = useState(false);
  // Which way the last move went: the new card slides in from that side
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);

  const many = items.length > 1;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const move = useCallback(
    (step: 1 | -1) => {
      const to = index + step;
      if (to < 0 || to >= items.length) return;
      setDirection(step === 1 ? "next" : "prev");
      setAsking(false);
      onMove(to);
      dialogRef.current?.scrollTo({ top: 0 });
    },
    [index, items.length, onMove],
  );

  // Esc closes; ← → move (not while typing in the form); the page underneath does not scroll
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea, select");
      if (typing) return;
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, move]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (asking) nameRef.current?.focus({ preventScroll: true });
  }, [asking]);

  // Swipe left / right on phones (not while the form is open)
  function onTouchStart(event: React.TouchEvent) {
    const first = event.touches[0];
    touch.current = asking || !first ? null : { x: first.clientX, y: first.clientY };
  }
  function onTouchEnd(event: React.TouchEvent) {
    const start = touch.current;
    const last = event.changedTouches[0];
    touch.current = null;
    if (!start || !last) return;
    const dx = last.clientX - start.x;
    const dy = last.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  }

  const arrowButton = (step: 1 | -1, className = "") => {
    const off = step === 1 ? !hasNext : !hasPrev;
    return (
      <button
        type="button"
        onClick={() => move(step)}
        aria-label={t(step === 1 ? "next" : "prev")}
        aria-disabled={off || undefined}
        className={`${arrow} ${className}`}
      >
        <ArrowIcon back={step === -1} />
      </button>
    );
  };

  const counter = `${index + 1} / ${items.length}`;
  const slide = direction === "next" ? "qv-from-right" : direction === "prev" ? "qv-from-left" : "";

  if (!inBrowser) return null;
  return createPortal(
    <>
      <div aria-hidden="true" onClick={onClose} className="scrim-in fixed inset-0 z-70 bg-[rgb(var(--ink-rgb)/0.45)] backdrop-blur-[2px]" />
      {/* Arrows stand outside the window on large screens; clicks between them reach the dark page */}
      <div className="pointer-events-none fixed inset-0 z-71 flex items-center justify-center gap-5 px-6 max-[820px]:items-end max-[820px]:px-0">
        {many && <div className="pointer-events-auto max-[820px]:hidden">{arrowButton(-1)}</div>}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="quick-view pointer-events-auto relative max-h-[calc(100dvh-48px)] w-[min(920px,100%)] overflow-x-hidden overflow-y-auto rounded-[34px] border border-white/80 bg-paper p-7 shadow-[0_30px_80px_rgb(var(--ink-rgb)/0.35)] max-[820px]:max-h-[92dvh] max-[820px]:w-full max-[820px]:rounded-b-none max-[820px]:px-4 max-[820px]:pt-2.5 max-[820px]:pb-5"
        >
          <span aria-hidden="true" className="mx-auto mb-3 hidden h-1.25 w-11 rounded-full bg-ink/20 max-[820px]:block" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={tc("close")}
            className="absolute top-5 right-5 z-1 flex size-10 items-center justify-center rounded-full bg-mist text-ink transition-colors hover:bg-mist-strong max-[820px]:top-5 max-[820px]:right-4"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-4.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div key={item.id} className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-8 max-[820px]:grid-cols-1 max-[820px]:gap-4 ${slide}`}>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] bg-white max-[820px]:mt-1">
              {item.image && (
                <Image src={item.image} alt={item.title} width={900} height={675} sizes="(max-width: 820px) 100vw, 480px" className="max-h-[92%] w-auto max-w-[90%] object-contain" />
              )}
              {many && (
                <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-extrabold tracking-[0.5px] text-white max-[820px]:hidden">
                  {counter}
                </span>
              )}
            </div>

            <div className="min-w-0 pt-2 max-[820px]:pt-0">
              {asking ? (
                <div className="cf-fade">
                  <button
                    type="button"
                    onClick={() => setAsking(false)}
                    className="mb-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand hover:underline"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                    {t("back")}
                  </button>
                  <ContactForm variant="popup" subject={item.title} page={item.href || window.location.pathname} firstFieldRef={nameRef} />
                </div>
              ) : (
                <div className="cf-fade">
                  {item.label && (
                    <span className="inline-block rounded-full bg-tag px-3 py-1.25 text-[11px] font-extrabold tracking-[0.4px] text-tag-ink">{item.label}</span>
                  )}
                  <h2 className="mt-3 mb-3 pr-10 font-heading tracking-[-0.02em] text-[28px] leading-[1.05] font-extrabold text-ink max-[820px]:text-[23px]">{item.title}</h2>
                  {item.text && <p className="text-[15.5px] leading-relaxed whitespace-pre-line text-ink-soft">{item.text}</p>}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {item.href && (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="btn-shine rounded-full bg-[image:var(--grad-btn)] px-6 py-3 font-extrabold text-white shadow-[0_12px_26px_rgb(var(--brand-rgb)/0.35)] transition hover:-translate-y-0.5 hover:brightness-108"
                      >
                        {t("more")}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setAsking(true)}
                      className="btn-shine rounded-full border-2 border-white/90 bg-[image:var(--grad-round)] px-6 py-2.75 font-extrabold text-brand shadow-[inset_0_-3px_6px_rgb(var(--brand-rgb)/0.14),0_8px_18px_rgb(var(--ink-rgb)/0.16)] transition-all duration-300 hover:border-white hover:bg-[image:var(--grad-btn)] hover:text-white"
                    >
                      {t("askPrice")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phones: arrows and the counter under the description */}
          {many && (
            <div className="mt-5 hidden items-center justify-between border-t border-ink/10 pt-4 max-[820px]:flex">
              {arrowButton(-1)}
              <span className="text-sm font-extrabold tracking-[0.5px] text-ink-soft">{counter}</span>
              {arrowButton(1)}
            </div>
          )}
        </div>
        {many && <div className="pointer-events-auto max-[820px]:hidden">{arrowButton(1)}</div>}
      </div>
    </>,
    document.body,
  );
}
