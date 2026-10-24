"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

// YouTube video: first only its picture with a big caramel "play" button (fast, nothing from
// YouTube runs yet). A click puts the real player in its place and starts the video.

export function CategoryVideo({
  videoId,
  caption,
  compact = false,
}: {
  videoId: string;
  caption: string;
  /** Equipment pages: a bit lower and less rounded (the column is narrower) */
  compact?: boolean;
}) {
  const t = useTranslations("CategoryPage");
  const [playing, setPlaying] = useState(false);

  return (
    <section className="mx-auto w-full max-w-245">
      <div
        className={`relative overflow-hidden bg-cocoa shadow-[0_24px_54px_rgba(90,60,40,0.18)] max-[820px]:aspect-[16/10] max-[820px]:rounded-3xl ${
          compact ? "aspect-[16/8] rounded-[32px]" : "aspect-[16/7] rounded-[36px]"
        }`}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={caption || t("video")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={caption ? `${t("play")}: ${caption}` : t("play")}
            className="group absolute inset-0 size-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- picture of the video straight from YouTube */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              // No picture from YouTube: just the brown background with the button
              onError={(event) => (event.currentTarget.style.visibility = "hidden")}
              className="size-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span data-reveal-pulse className="absolute top-1/2 left-1/2 flex size-22 -translate-1/2 items-center justify-center rounded-full bg-[linear-gradient(180deg,#b88a5e,#7a5232)] shadow-[0_14px_34px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-108 max-[820px]:size-16">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="#fff" className="ml-1 size-8.5 max-[820px]:size-6.5">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {caption && <p className="mt-3 text-center text-sm text-cocoa-soft">{caption}</p>}
    </section>
  );
}
