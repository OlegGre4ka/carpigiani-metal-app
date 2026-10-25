"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Chevron, TimerRing, useSlider } from "@/components/slider-controls";

// Slides for the demo. Later this list will come from the admin panel.
type Slide = {
  key: "maestro" | "lunette" | "university" | "ready";
  href: string;
  button: "about" | "more";
  // Big photo in the metal frame on the right
  photo: { src: string; size: [number, number]; position?: string };
  // The machine on white, in a small card over the corner of the frame (none: only the photo)
  product?: { src: string; size: [number, number]; alt: string };
};

const slides: Slide[] = [
  {
    key: "maestro",
    href: "/maestro",
    button: "about",
    photo: { src: "/images/slides/maestro-bg.webp", size: [1080, 602], position: "object-[70%_center]" },
    product: { src: "/images/slides/maestro.webp", size: [510, 747], alt: "Carpigiani Maestro" },
  },
  {
    key: "lunette",
    href: "/ifi-lunette",
    button: "about",
    photo: { src: "/images/slides/lunette-bg.webp", size: [1500, 698], position: "object-[60%_center]" },
    product: { src: "/images/slides/lunette.webp", size: [800, 608], alt: "IFI Lunette" },
  },
  {
    key: "university",
    href: "/carpigiani-gelato-university",
    button: "more",
    photo: { src: "/images/slides/gelato-university-3x2.webp", size: [765, 510], position: "object-[center_25%]" },
  },
  {
    key: "ready",
    href: "/ready",
    button: "about",
    photo: { src: "/images/slides/ready-bg.webp", size: [1446, 736], position: "object-[40%_center]" },
    product: { src: "/images/slides/ready.webp", size: [430, 680], alt: "Carpigiani Ready" },
  },
];

// Round arrows on the dark hero: glass with a thin light rim, blue on hover
const arrow =
  "group/arrow relative flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur-sm transition-all duration-300 hover:scale-108 hover:border-transparent hover:bg-[image:var(--grad-btn)] hover:shadow-[0_12px_30px_var(--glow)] max-[820px]:size-11";

export function HeroSlider() {
  const t = useTranslations("Slider");
  // Switching, autoplay every 4 seconds, pause and swipe: shared with the category slider
  const { active, paused, go, next, prev, handlers, ringKey } = useSlider({ count: slides.length });

  const bold = (chunks: ReactNode) => <b className="font-extrabold text-white">{chunks}</b>;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("label")}
      className="relative isolate overflow-hidden bg-dark text-on-dark"
      {...handlers}
    >
      {/* Blue glow behind the photo and in the lower left corner */}
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-0 -z-1 bg-[radial-gradient(700px_520px_at_74%_48%,rgb(20_110_255/0.38),transparent_65%),radial-gradient(500px_400px_at_0%_100%,rgb(20_110_255/0.18),transparent_70%)]"
      />

      <div className="mx-auto grid w-full max-w-360 px-20 pt-10 pb-22 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:pt-6 max-[820px]:pb-20">
        {slides.map((slide, i) => {
          const on = i === active;
          return (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideOf", { n: i + 1, total: slides.length })}
              aria-hidden={!on}
              inert={!on}
              className={`col-start-1 row-start-1 grid grid-cols-[minmax(0,1fr)_minmax(0,540px)] items-center gap-14 transition-opacity duration-700 max-[1100px]:gap-10 max-[820px]:grid-cols-1 max-[820px]:gap-7 ${
                on ? "z-1 opacity-100" : "opacity-0"
              }`}
            >
              <div className="min-w-0">
                <h2
                  className={`metal-text mb-5 text-[clamp(44px,5.4vw,76px)] leading-[0.98] tracking-[-0.03em] text-white max-[820px]:mb-3.5 max-[820px]:text-[min(42px,10.5vw)] ${
                    on ? "motion-safe:animate-title-in" : ""
                  }`}
                >
                  {t(`${slide.key}.title`)}
                </h2>
                <p
                  className={`mb-9 max-w-120 text-[19px] leading-[1.55] text-on-dark-soft max-[820px]:mb-6 max-[820px]:text-base ${
                    on ? "motion-safe:animate-in-left [animation-delay:250ms]" : ""
                  }`}
                >
                  {t.rich(`${slide.key}.text`, { b: bold })}
                </p>
                <div className={`w-max ${on ? "motion-safe:animate-in-left [animation-delay:450ms]" : ""}`}>
                  {/* Hover: lifts, a light glare runs across, an arrow slides in */}
                  <Link
                    href={slide.href}
                    className="btn-shine group/btn inline-flex h-14 items-center rounded-full bg-[image:var(--grad-btn)] px-8.5 font-extrabold text-white shadow-[0_14px_40px_var(--glow)] transition duration-300 hover:-translate-y-1 max-[820px]:h-12 max-[820px]:px-6 max-[820px]:text-[15px]"
                  >
                    {t(slide.button)}
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-0 size-5 w-0 opacity-0 transition-all duration-300 group-hover/btn:ml-2 group-hover/btn:w-5 group-hover/btn:opacity-100"
                    />
                  </Link>
                </div>
              </div>

              {/* Photo in the metal frame. A click opens the same page as the button
                  (the button stays the main link for keyboard and screen readers) */}
              <Link
                href={slide.href}
                tabIndex={-1}
                aria-hidden="true"
                className={`group/photo relative block ${on ? "motion-safe:animate-sheet-in [animation-delay:200ms]" : ""}`}
              >
                <div className="rounded-[46px] bg-[image:var(--metal)] p-0.75 shadow-[0_40px_90px_rgb(0_60_255/0.35),0_0_0_10px_rgb(20_110_255/0.08)] max-[820px]:rounded-[30px]">
                  <div className="relative aspect-[540/500] overflow-hidden rounded-[43px] bg-dark-card max-[820px]:aspect-[4/3] max-[820px]:rounded-[27px]">
                    <Image
                      src={slide.photo.src}
                      alt=""
                      fill
                      sizes="(max-width: 820px) 100vw, 540px"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      className={`object-cover transition-transform duration-700 group-hover/photo:scale-104 ${slide.photo.position ?? ""}`}
                    />
                  </div>
                </div>
                {slide.product && (
                  <div className="absolute -bottom-7 -left-12 w-46 rounded-[26px] bg-[image:var(--metal)] p-0.5 shadow-[0_24px_50px_rgb(0_0_0/0.5)] transition-transform duration-500 group-hover/photo:-translate-y-2 max-[1100px]:-left-6 max-[1100px]:w-38 max-[820px]:-bottom-5 max-[820px]:left-3 max-[820px]:w-27 max-[820px]:rounded-[18px]">
                    <div className="rounded-[24px] bg-white p-3 max-[820px]:rounded-[16px] max-[820px]:p-1.5">
                      <Image
                        src={slide.product.src}
                        alt={slide.product.alt}
                        width={slide.product.size[0]}
                        height={slide.product.size[1]}
                        sizes="(max-width: 820px) 110px, 190px"
                        className="mx-auto block h-40 w-full object-contain max-[1100px]:h-32 max-[820px]:h-22"
                      />
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Dots and arrows under the text */}
      <div className="absolute inset-x-0 bottom-7 z-2 mx-auto flex w-full max-w-360 items-center gap-4 px-20 max-[1100px]:px-10 max-[820px]:bottom-5 max-[820px]:px-4">
        <div className="flex">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={t("goTo", { n: i + 1 })}
              aria-current={i === active ? "true" : undefined}
              className="flex size-6.5 items-center justify-center"
            >
              <i
                className={`block h-1.5 rounded-full transition-all duration-250 ${
                  i === active ? "w-9 bg-brand-light" : "w-1.5 bg-white/35"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-3">
          <button type="button" onClick={prev} aria-label={t("prev")} className={arrow}>
            <Chevron dir="left" />
          </button>
          <button type="button" onClick={next} aria-label={t("next")} className={arrow}>
            <TimerRing key={ringKey} paused={paused} dark />
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
