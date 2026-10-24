"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Shared "appear on scroll" for blocks of pages built in the admin panel (categories,
// equipment, later the IFI/ISA cases). Design: claude/equipment-page-animation.md.
// - A block appears once, when its top comes into view (not again when scrolling back).
// - Large screens: the card "opens from the centre" (moves up 28 px, fades in, grows from
//   0.96 and its clip-path opens to the full rounded card). Phones: only a fade-up.
// - Inside the block, parts marked data-reveal-kids (tiles, buttons, paragraphs) follow one
//   by one, table rows (data-reveal-rows) a bit faster; the first slide slowly settles,
//   the slider arrows pop in, the video button gives one soft pulse.
// - Without animations (system setting) everything is simply shown.
// Only transform / opacity / clip-path are animated; never put it on a sticky element
// (a transform would stop it sticking): wrap the card inside the sticky box instead.

export function Reveal({
  children,
  delay = 0,
  radius = 36,
  className = "",
}: {
  children: ReactNode;
  /** Extra wait before appearing (ms), for blocks that should come a bit later */
  delay?: number;
  /** Corner radius of the card, so the opening clip-path matches it */
  radius?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    // Shown when its top passes the lower ~12 % of the screen (tall blocks do not wait).
    // The huge top margin counts everything above the screen as seen too: a quick jump
    // past a block (End key, a link to the bottom) must not leave it hidden.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100000px 0px -12% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = { "--rv-delay": `${delay}ms`, "--rv-radius": `${radius}px` } as CSSProperties;
  return (
    <div ref={box} style={style} className={`reveal ${shown ? "in" : ""} ${className}`}>
      {children}
    </div>
  );
}
