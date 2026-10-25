"use client";

import { useEffect, useSyncExternalStore } from "react";

// TEMPORARY (only on the local site): buttons in the lower left corner to compare stricter fonts.
// The choice is remembered in this browser. Remove this file when the font is chosen.
const fonts = [
  { key: "", label: "Manrope" },
  { key: "inter-tight", label: "Inter Tight" },
  { key: "montserrat", label: "Montserrat" },
  { key: "golos", label: "Golos Text" },
] as const;

// The chosen font lives in localStorage; the page is told about changes with an event
function read() {
  try {
    return localStorage.getItem("font-choice") ?? "";
  } catch {
    return "";
  }
}
function subscribe(onChange: () => void) {
  window.addEventListener("font-choice", onChange);
  return () => window.removeEventListener("font-choice", onChange);
}
function choose(font: string) {
  try {
    localStorage.setItem("font-choice", font);
  } catch {}
  window.dispatchEvent(new Event("font-choice"));
}

export function FontPicker() {
  const font = useSyncExternalStore(subscribe, read, () => "");

  // The font of the whole site follows the choice
  useEffect(() => {
    if (font) document.documentElement.dataset.font = font;
    else delete document.documentElement.dataset.font;
  }, [font]);

  return (
    <div className="fixed bottom-4 left-20 z-80 flex gap-1 rounded-full border border-white/20 bg-[#0a1b42]/90 p-1 text-xs font-bold text-white shadow-lg backdrop-blur max-[820px]:bottom-20 max-[820px]:left-2">
      {fonts.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => choose(f.key)}
          className={`rounded-full px-3 py-1.5 ${font === f.key ? "bg-white text-[#0a1b42]" : "hover:bg-white/15"}`}
          style={{ fontFamily: f.key ? `var(--font-${f.key}), Arial` : "var(--font-manrope), Arial" }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
