"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Chevron, scoopButton, TimerRing, useSlider } from "@/components/slider-controls";

// Slider of a category page: big photos 16:6, round corners, dots, and the same cream "scoop"
// arrows as on the home page: around the "next" scoop a caramel ring fills up during the
// 4 seconds before the photo changes. Stops while the mouse is over it; on phones photos are
// swiped (the arrows are hidden, as on the home page). With one photo there are no arrows and dots.

// The arrows, the ring timer and the switching logic are shared with the home slider
const arrow = `${scoopButton} top-1/2`;

// On equipment pages the slider is lower and white: the machine on white, shown whole
// (contain), so it is visible at once next to the right column.
const frame = {
  category:
    "aspect-[16/6] rounded-[48px] bg-mist shadow-[0_30px_70px_rgb(var(--shadow-rgb)/0.16)] max-[820px]:aspect-[4/3.4] max-[820px]:rounded-[30px]",
  equipment:
    "aspect-[16/8.4] rounded-[40px] bg-white shadow-[0_26px_60px_rgb(var(--shadow-rgb)/0.16)] max-[820px]:aspect-[4/3.1] max-[820px]:rounded-[28px]",
};

export function CategorySlider({
  images,
  autoplay,
  variant = "category",
}: {
  images: string[];
  autoplay: boolean;
  variant?: "category" | "equipment";
}) {
  const t = useTranslations("CategoryPage");
  const { active, paused, go, next, prev, handlers, ringKey } = useSlider({ count: images.length, autoplay });
  const many = images.length > 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("slider")}
      className={`relative overflow-hidden ${frame[variant]}`}
      {...handlers}
    >
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={t("photo", { number: index + 1 })}
          fill
          sizes={variant === "equipment" ? "(max-width: 820px) 100vw, 900px" : "(max-width: 1440px) 100vw, 1280px"}
          priority={index === 0}
          aria-hidden={index !== active}
          // The first photo slowly settles when the block appears (components/reveal.tsx)
          data-reveal-zoom={index === 0 ? true : undefined}
          className={`${variant === "equipment" ? "object-contain p-[4%]" : "object-cover"} transition-opacity duration-500 ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      {many && (
        <>
          <button type="button" data-reveal-pop aria-label={t("previous")} onClick={prev} className={`${arrow} left-5.5 max-[820px]:left-2.5`}>
            <Chevron dir="left" />
          </button>
          <button type="button" data-reveal-pop aria-label={t("next")} onClick={next} className={`${arrow} right-5.5 max-[820px]:right-2.5`}>
            {autoplay && <TimerRing key={ringKey} paused={paused} />}
            <Chevron dir="right" />
          </button>
          <div className="absolute inset-x-0 bottom-5 z-2 flex justify-center gap-2 max-[820px]:bottom-3">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={t("photo", { number: index + 1 })}
                aria-current={index === active ? "true" : undefined}
                onClick={() => go(index)}
                className="flex h-6 items-center"
              >
                <span
                  className={`block h-2.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-300 ${
                    index === active ? "w-8.5 bg-ink" : variant === "equipment" ? "w-2.5 bg-ink/25" : "w-2.5 bg-white/75"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
