"use client";

import { useEffect } from "react";

// The home page marks itself on <html> while it is on the screen (data-home), so its navy
// background and see-through header never stay on other pages (30.10: after switching the
// language Next.js keeps the hidden home page in a way the old CSS check did not notice).
// data-ready: the page is running, from now on only data-home decides (globals.css).
export function HomeFlag() {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.ready = "1";
    html.dataset.home = "1";
    return () => {
      delete html.dataset.home;
    };
  }, []);
  return null;
}

/** On every page: the page is running (data-ready), see HomeFlag */
export function ReadyFlag() {
  useEffect(() => {
    document.documentElement.dataset.ready = "1";
  }, []);
  return null;
}
