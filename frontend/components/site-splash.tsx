"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";

import { AnimatedBrandMark } from "@/components/brand-logo";

// Splash screen of the site: when the site is opened or reloaded, the brand mark and the name
// rise on a dark screen with a blue glow, a blue spark runs along the thread of the mark and
// flashes in the tip of the cone (about 3.9 s, 29.10), then the screen fades away and the page
// is already there behind it.
// Moving between pages of the site does not show it again (the layout stays). A click or a tap
// skips it. Not in the admin panel. After a reload the page starts from the top. The fading is plain CSS (.site-splash in globals.css), so it
// goes away even before the page scripts are loaded.
// Shown once per opening of the site: switching the language builds the layout anew (30.10:
// the splash came back on every switch); a real reload starts the scripts again and shows it
let shownOnce = false;

export function SiteSplash() {
  // The picture of the mark is the first thing the browser fetches (before the slider photos)
  preload("/images/logo-mark-nospark.webp", { as: "image", fetchPriority: "high" });
  preload("/images/logo-mark.webp", { as: "image", fetchPriority: "high" });
  const [state, setState] = useState<"shown" | "leaving" | "gone">(() => (shownOnce ? "gone" : "shown"));
  useEffect(() => {
    shownOnce = true;
  }, []);
  // After a reload the page starts from the top (with the splash), not where it was scrolled to:
  // the browser is told not to bring the old place back. Moving between pages of the site is
  // not affected (Next.js takes care of the place on "back" itself).
  useEffect(() => {
    history.scrollRestoration = "manual";
    if (state !== "gone") window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the site is opened
  }, []);

  // The spark runs by itself from the very first moment the splash is on the screen (plain SVG
  // animation, it does not wait for the scripts of the page: 29.10, no pause before it); the
  // screen fades away by CSS when the spark has flashed in the tip (.site-splash in globals.css)
  // Safety net: even if the styles of the site did not load, the screen goes away by itself
  useEffect(() => {
    const timer = setTimeout(() => setState("gone"), 7000);
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
      className={`site-splash fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-[#061633] bg-[image:radial-gradient(circle_at_50%_42%,rgb(20_110_255/0.32),transparent_60%)] ${
        state === "leaving" ? "leaving" : ""
      }`}
    >
      <div className="splash-logo flex flex-col items-center text-white">
        {/* Only the mark (29.10): the client sells several brands, no brand name here */}
        <AnimatedBrandMark className="h-[min(42vh,300px)] drop-shadow-[0_20px_50px_rgb(20_110_255/0.45)]" />
      </div>
    </div>
  );
}
