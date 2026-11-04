"use client";

import { useEffect, useSyncExternalStore } from "react";

// Which item of the site menu is lit when the address alone does not tell it (4.11): an article
// opened from "Support" is also one of the news (/210306-abc-gelato), but the visitor is in
// "Support". The page puts <SectionMark section="support" />, the header reads useMarkedSection().
// The mark goes as soon as the page is left.

const EVENT = "section-mark";

export function SectionMark({ section }: { section: string }) {
  useEffect(() => {
    document.documentElement.dataset.section = section;
    window.dispatchEvent(new Event(EVENT));
    return () => {
      delete document.documentElement.dataset.section;
      window.dispatchEvent(new Event(EVENT));
    };
  }, [section]);
  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** The section the open page marked, or null */
export function useMarkedSection(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.section ?? null,
    () => null,
  );
}
