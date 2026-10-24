"use client";

import { useEffect, useState } from "react";

import { ConeDraw } from "@/components/cone-draw";

// Splash screen of the site: when the site is opened or reloaded, the brand cone draws itself on
// a cream screen (about 3 s), then the screen fades away and the page is already there behind it.
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
    const timer = setTimeout(() => setState("gone"), 4200);
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
      className={`site-splash fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-[radial-gradient(circle_at_40%_30%,#fbf3e6,#efdcc1)] ${
        state === "leaving" ? "leaving" : ""
      }`}
    >
      <ConeDraw className="h-[min(56vh,420px)] w-auto" />
    </div>
  );
}
