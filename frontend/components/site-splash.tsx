"use client";

import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-logo";

// Splash screen of the site: when the site is opened or reloaded, the brand mark and the name
// rise on a dark screen with a blue glow (about 1.8 s), then the screen fades away and the page is already there behind it.
// Moving between pages of the site does not show it again (the layout stays). A click or a tap
// skips it. Not in the admin panel. After a reload the page starts from the top. The fading is plain CSS (.site-splash in globals.css), so it
// goes away even before the page scripts are loaded.
export function SiteSplash() {
  const [state, setState] = useState<"shown" | "leaving" | "gone">("shown");
  // After a reload the page starts from the top (with the splash), not where it was scrolled to:
  // the browser is told not to bring the old place back. Moving between pages of the site is
  // not affected (Next.js takes care of the place on "back" itself).
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // Safety net: even if the styles of the site did not load, the screen goes away by itself
  useEffect(() => {
    const timer = setTimeout(() => setState("gone"), 2800);
    return () => clearTimeout(timer);
  }, []);
  if (state === "gone") return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => setState("leaving")}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setState("gone");
      }}
      className={`site-splash fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-[radial-gradient(circle_at_70%_40%,rgb(20_110_255/0.3),transparent_60%),var(--dark)] ${
        state === "leaving" ? "leaving" : ""
      }`}
    >
      <div className="splash-logo flex flex-col items-center text-white">
        <BrandMark className="h-[min(30vh,190px)] w-auto drop-shadow-[0_20px_50px_rgb(20_110_255/0.45)]" />
        <b className="mt-6 text-[clamp(22px,4vw,34px)] font-extrabold tracking-[0.3em]">CARPIGIANI</b>
        <small className="mt-2 text-[11px] font-bold tracking-[0.35em] text-on-dark-soft">OFFICIAL UKRAINE DEALER</small>
      </div>
    </div>
  );
}
