"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Chevron, scoopButton } from "@/components/slider-controls";
import type { GalleryBlock } from "@/lib/site-pages";

// Photos in a row (3, 4 or 6; on phones always 3). A photo with a link opens the link
// (that is how a brand logo is made); otherwise, if allowed, a click shows it big
// and the photos can be leafed through with arrows, keys or a swipe.

const columns = { 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6" } as const;

/** The "zoom" button on a photo: a cream "ice cream scoop" like the arrows of the sliders,
 *  caramel when the photo is hovered */
export function Magnifier() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-3.5 bottom-3.5 flex size-11 items-center justify-center rounded-full border-2 border-white/90 bg-[image:var(--grad-round)] text-brand shadow-[inset_0_-3px_6px_rgb(var(--brand-rgb)/0.18),0_8px_18px_rgb(var(--ink-rgb)/0.25)] transition-all duration-300 group-hover:scale-110 group-hover:border-white group-hover:bg-[image:var(--grad-btn)] group-hover:text-white group-hover:shadow-[0_12px_24px_rgb(var(--brand-rgb)/0.4)] max-[820px]:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-5">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
      </svg>
    </span>
  );
}

export function CategoryGallery({ block }: { block: GalleryBlock }) {
  const t = useTranslations("CategoryPage");
  const [open, setOpen] = useState<number | null>(null);
  // Only photos without a link take part in the big view
  const zoomable = block.zoom ? block.photos.filter((photo) => !photo.link) : [];

  const frame = `relative block overflow-hidden rounded-[28px] bg-white shadow-[0_14px_34px_rgb(var(--shadow-rgb)/0.12)] max-[820px]:rounded-2xl ${
    block.captions ? "aspect-[4/3]" : "aspect-[4/3] max-[820px]:aspect-square"
  }`;
  const picture = "object-cover transition-transform duration-500 group-hover:scale-105";
  const sizes = block.per_row === 3 ? "(max-width: 820px) 33vw, 420px" : "(max-width: 820px) 33vw, 320px";

  return (
    <section>
      <ul data-reveal-kids className={`grid gap-5 max-[820px]:grid-cols-3 max-[820px]:gap-2 ${columns[block.per_row]}`}>
        {block.photos.map((photo, index) => {
          const content = (
            <>
              <span className={frame}>
                <Image src={photo.image} alt={photo.caption} fill sizes={sizes} className={picture} />
                {!photo.link && block.zoom && <Magnifier />}
              </span>
              {block.captions && photo.caption && (
                <span className="mt-2.5 block text-center text-[15px] font-bold text-ink max-[820px]:text-xs">
                  {photo.caption}
                </span>
              )}
            </>
          );

          return (
            <li key={`${photo.image}-${index}`} className="min-w-0">
              {photo.link ? (
                photo.link.startsWith("http") ? (
                  <a href={photo.link} target="_blank" rel="noopener" className="group block">
                    {content}
                  </a>
                ) : (
                  <a href={photo.link} className="group block">
                    {content}
                  </a>
                )
              ) : block.zoom ? (
                <button
                  type="button"
                  aria-label={t("zoom", { number: index + 1 })}
                  onClick={() => setOpen(zoomable.indexOf(photo))}
                  className="group block w-full cursor-zoom-in text-left"
                >
                  {content}
                </button>
              ) : (
                <div className="group">{content}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Placed straight into <body>: the fade-in of the block would otherwise keep it inside the block */}
      {open !== null &&
        zoomable.length > 0 &&
        createPortal(<Lightbox photos={zoomable} start={open} onClose={() => setOpen(null)} />, document.body)}
    </section>
  );
}

/** Photo over the whole screen; arrows, keys ← → and swipe leaf through, Esc or a click outside closes.
 *  Also the big view of the main photo of a news item (components/news-photo.tsx). */
export function Lightbox({
  photos,
  start,
  onClose,
}: {
  photos: GalleryBlock["photos"];
  start: number;
  onClose: () => void;
}) {
  const t = useTranslations("CategoryPage");
  const [index, setIndex] = useState(start);
  // Which way the photos are leafed: the new photo comes in from that side
  const [from, setFrom] = useState<"left" | "right" | null>(null);
  const touchX = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const many = photos.length > 1;
  const go = useCallback(
    (next: number) => {
      setFrom(next < index ? "left" : "right");
      setIndex((next + photos.length) % photos.length);
    },
    [index, photos.length],
  );

  useEffect(() => {
    closeButton.current?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };
    document.addEventListener("keydown", keys);
    // The page under the photo does not scroll
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = overflow;
    };
  }, [index, go, onClose]);

  const photo = photos[index];
  // The same cream "ice cream scoops" as the arrows of the sliders and the "up" button (caramel
  // on hover); here they stay on phones too, a little smaller
  const arrow = `${scoopButton.replace(" max-[820px]:hidden", "")} max-[820px]:size-12`;
  const control = arrow.replace(" -translate-y-1/2", "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("viewer")}
      className="fixed inset-0 z-80 flex items-center justify-center bg-[rgb(var(--scrim-rgb)/0.88)] p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 max-[820px]:p-3"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || !many) return;
        const shift = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(shift) > 40) go(index + (shift < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <figure className="pointer-events-none relative m-0 flex h-full w-full max-w-300 flex-col items-center justify-center">
        {/* A new photo for every index: it comes in smoothly from the side it was leafed to */}
        <span
          key={index}
          className={`relative h-[calc(100%-48px)] w-full motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-97 motion-safe:duration-400 motion-safe:ease-out ${
            from === "right" ? "motion-safe:slide-in-from-right-12" : from === "left" ? "motion-safe:slide-in-from-left-12" : ""
          }`}
        >
          <Image src={photo.image} alt={photo.caption} fill sizes="100vw" className="object-contain" />
        </span>
        {/* The photos before and after are loaded in advance, so leafing does not wait for them */}
        {many &&
          [index - 1, index + 1].map((near) => {
            const other = photos[(near + photos.length) % photos.length];
            return (
              <span key={`near-${near}`} aria-hidden="true" className="invisible absolute inset-0">
                <Image src={other.image} alt="" fill sizes="100vw" loading="eager" className="object-contain" />
              </span>
            );
          })}
        <figcaption className="mt-3 min-h-6 text-center text-[15px] font-semibold text-white/90">
          {photo.caption}
          {many && <span className="ml-2 opacity-70">{`${index + 1} / ${photos.length}`}</span>}
        </figcaption>
      </figure>

      <button ref={closeButton} type="button" aria-label={t("close")} onClick={onClose} className={`${control} top-5 right-5`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-5 transition-transform duration-300 group-hover/arrow:rotate-90">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {many && (
        <>
          <button type="button" aria-label={t("previous")} onClick={() => go(index - 1)} className={`${arrow} top-1/2 left-5 max-[820px]:left-2`}>
            <Chevron dir="left" />
          </button>
          <button type="button" aria-label={t("next")} onClick={() => go(index + 1)} className={`${arrow} top-1/2 right-5 max-[820px]:right-2`}>
            <Chevron dir="right" />
          </button>
        </>
      )}
    </div>
  );
}
