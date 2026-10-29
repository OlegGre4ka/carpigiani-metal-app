"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";

import { AnimatedBrandMark, SPARK_END } from "@/components/brand-logo";

// Splash screen of the site: when the site is opened or reloaded, the brand mark and the name
// rise on a dark screen with a blue glow, a blue spark runs along the thread of the mark and
// flashes in the tip of the cone (about 3.9 s, 29.10), then the screen fades away and the page
// is already there behind it.
// Moving between pages of the site does not show it again (the layout stays). A click or a tap
// skips it. Not in the admin panel. After a reload the page starts from the top. The fading is plain CSS (.site-splash in globals.css), so it
// goes away even before the page scripts are loaded.
export function SiteSplash() {
  // The picture of the mark is the first thing the browser fetches (before the slider photos)
  preload("/images/logo-mark.webp", { as: "image", fetchPriority: "high" });
  const [state, setState] = useState<"shown" | "leaving" | "gone">("shown");
  // After a reload the page starts from the top (with the splash), not where it was scrolled to:
  // the browser is told not to bring the old place back. Moving between pages of the site is
  // not affected (Next.js takes care of the place on "back" itself).
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // The spark starts only when the picture of the mark is on the screen (it may come a moment
  // after the page), and the screen goes away when the spark has flashed in the tip of the cone
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const svg = box.current?.querySelector<SVGSVGElement>(".logo-spark");
    const img = box.current?.querySelector("img");
    if (!svg || !img) return;
    svg.pauseAnimations();
    svg.setCurrentTime(0);
    let leave = 0;
    const start = (late: boolean) => {
      // the mark rises for 0.9 s (.splash-logo); the spark starts its run 0.75 s after this
      // moment, or at once when the picture came late (the mark has already risen)
      svg.setCurrentTime(late ? 0.6 : 0);
      svg.unpauseAnimations();
      leave = window.setTimeout(() => setState("leaving"), (SPARK_END + 0.9) * 1000);
    };
    const onLoad = () => start(true);
    if (img.complete) start(false);
    else img.addEventListener("load", onLoad, { once: true });
    return () => {
      img.removeEventListener("load", onLoad);
      clearTimeout(leave);
    };
  }, []);

  // Safety net: even if the styles of the site did not load, the screen goes away by itself
  useEffect(() => {
    const timer = setTimeout(() => setState("gone"), 7000);
    return () => clearTimeout(timer);
  }, []);
  if (state === "gone") return null;

  return (
    <div
      ref={box}
      aria-hidden="true"
      onClick={() => setState("leaving")}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setState("gone");
      }}
      className={`site-splash fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-[#061633] bg-[image:radial-gradient(circle_at_50%_42%,rgb(20_110_255/0.32),transparent_60%)] ${
        state === "leaving" ? "leaving" : ""
      }`}
    >
      <div className="splash-logo flex flex-col items-center text-white">
        <AnimatedBrandMark className="h-[min(38vh,260px)] drop-shadow-[0_20px_50px_rgb(20_110_255/0.45)]" />
        <b className="mt-6 text-[clamp(22px,4vw,34px)] font-extrabold tracking-[0.3em]">CARPIGIANI</b>
        <small className="mt-2 text-[11px] font-bold tracking-[0.35em] text-on-dark-soft">OFFICIAL UKRAINE DEALER</small>
      </div>
    </div>
  );
}
