"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type TouchEvent } from "react";

// What every slider of the site shares (the home slider and the slider of category pages):
// - useSlider: which slide is shown, autoplay with pause, swipe on phones;
// - the round metal arrows and the blue ring timer around the "next" arrow.
// Each slider only draws its own slides and dots.

export const AUTOPLAY_MS = 4000;

type Options = {
  count: number;
  /** false: photos change only by arrows, dots and swipe */
  autoplay?: boolean;
  /** Time between the switches (4 seconds if not given) */
  interval?: number;
};

export function useSlider({ count, autoplay = true, interval = AUTOPLAY_MS }: Options) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((index: number) => setActive((index + count) % count), [count]);
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);

  // Auto-scroll every 4 seconds (or every `interval`). Stops while the mouse is over the slider and for people who
  // turned off animations in their system settings. Any manual switch restarts the 4 seconds.
  const running = autoplay && count > 1 && !paused;
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => go(active + 1), interval);
    return () => window.clearTimeout(timer);
  }, [active, running, go, interval]);

  // Put on the block that holds the slides: pause under the mouse and for keyboard users (Tab),
  // swipe left/right with a finger. A mouse click on a dot keeps autoplay going.
  const handlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) setPaused(true);
    },
    onBlurCapture: () => setPaused(false),
    onTouchStart: (e: TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: TouchEvent) => {
      if (touchX.current === null || count < 2) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
    },
  };

  return { active, paused, go, next, prev, handlers, ringKey: `${active}-${paused}` };
}

// Side arrows: round metal (chrome) buttons with volume. On hover deep navy with a fine texture
// (.metal-round in globals.css, the same as the "Up" button).
// Hidden on phones (photos are swiped there). Each slider adds its own top/left/right.
export const scoopButton =
  "metal-round group/arrow absolute z-2 flex size-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/90 bg-[image:var(--metal)] text-ink shadow-[inset_0_-4px_8px_rgb(var(--ink-rgb)/0.18),0_12px_26px_rgb(var(--ink-rgb)/0.25)] transition-all duration-300 hover:scale-112 hover:text-white max-[820px]:hidden";

export function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`relative size-5.5 transition-transform duration-300 ${
        dir === "left" ? "group-hover/arrow:-translate-x-0.5" : "group-hover/arrow:translate-x-0.5"
      }`}
    >
      <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

// Ring timer around the "next" scoop: fills up during the 4 seconds before the slide switches,
// stops while the slider is paused. Give it key={ringKey} from useSlider, so it restarts.
// dark: on a dark background (home hero) — a faint light track under the ring.
export function TimerRing({ paused, dark = false }: { paused: boolean; dark?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className="pointer-events-none absolute -inset-1.5 size-[calc(100%+12px)] -rotate-90">
      <circle cx="30" cy="30" r="27" fill="none" className={dark ? "stroke-white/15" : "stroke-paper/80"} strokeWidth={dark ? 2 : 3.5} />
      <circle
        cx="30"
        cy="30"
        r="27"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="170"
        className={`${dark ? "stroke-brand-light" : "stroke-brand"} motion-safe:animate-ring-fill motion-reduce:hidden ${paused ? "paused" : ""}`}
      />
    </svg>
  );
}
