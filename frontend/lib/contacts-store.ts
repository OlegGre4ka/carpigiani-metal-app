"use client";

import { useSyncExternalStore } from "react";

// Phones of the company for the client parts of the site (under the contact form): they come
// from the admin panel with the footer (components/contacts-sync.tsx); until then the ones the
// site always had.

export type Phone = { label: string; href: string };

// What the server puts into the page; hydration always starts from it (the phones from the
// admin panel may arrive earlier than a form on the page wakes up)
const defaults: Phone[] = [
  { label: "+38 044 465 5543", href: "tel:+380444655543" },
  { label: "+38 067 244 1109", href: "tel:+380672441109" },
];
let phones = defaults;
const listeners = new Set<() => void>();

export function setPhones(next: Phone[]) {
  if (next.length === 0 || JSON.stringify(next) === JSON.stringify(phones)) return;
  phones = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePhones() {
  return useSyncExternalStore(
    subscribe,
    () => phones,
    () => defaults,
  );
}
