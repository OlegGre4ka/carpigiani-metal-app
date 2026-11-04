"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Chevron, scoopButton } from "@/components/slider-controls";
import type { Partner } from "@/lib/site-pages";

// The strip of partner logos on the home page (4.11): white cards in a row; it moves by one card
// every 3 seconds and stops under the mouse; metal round arrows on the sides (large screens);
// a finger swipes it on phones. When all the logos fit, they stand in the middle, no arrows.
// A click opens the site of the partner in a new tab.

const STEP_MS = 3000;

export function PartnersStrip({ partners, prevLabel, nextLabel }: { partners: Partner[]; prevLabel: string; nextLabel: string }) {
  const row = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [paused, setPaused] = useState(false);

  // Do all the logos fit? (again when the window changes)
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 4);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [partners]);

  /** One card to the left or to the right; from the end back to the start */
  const move = useCallback((dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : 240;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!overflows || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => move(1), STEP_MS);
    return () => window.clearInterval(timer);
  }, [overflows, paused, move]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul
        ref={row}
        className={`flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[820px]:gap-3 ${
          overflows ? "" : "justify-center"
        }`}
      >
        {partners.map((partner) => {
          const logo = (
            <span className="relative block h-full w-full">
              <Image src={partner.logo} alt={partner.title} fill sizes="200px" className="object-contain" />
            </span>
          );
          const card =
            "flex h-28 w-55 items-center justify-center rounded-[22px] border border-white/90 bg-white px-7 py-5 shadow-[0_12px_30px_rgb(var(--shadow-rgb)/0.1)] max-[820px]:h-22 max-[820px]:w-40 max-[820px]:px-5 max-[820px]:py-4";
          return (
            <li key={`${partner.title}-${partner.logo}`} className="shrink-0 snap-start">
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener"
                  title={partner.title}
                  className={`${card} transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(var(--shadow-rgb)/0.18)]`}
                >
                  {logo}
                </a>
              ) : (
                <span title={partner.title} className={card}>
                  {logo}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {overflows && (
        <>
          <button type="button" onClick={() => move(-1)} aria-label={prevLabel} className={`${scoopButton} top-1/2 -left-17 max-[1100px]:-left-5`}>
            <Chevron dir="left" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={nextLabel} className={`${scoopButton} top-1/2 -right-17 max-[1100px]:-right-5`}>
            <Chevron dir="right" />
          </button>
        </>
      )}
    </div>
  );
}
