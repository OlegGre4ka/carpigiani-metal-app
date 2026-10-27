"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Chevron, scoopButton, TimerRing, useSlider } from "@/components/slider-controls";

// Home slider (approved prototype «Carpigiani — нова головна», 26.10): full width under the
// see-through header. Each slide: background → fog under the text → the machine / photo → text.
// Large screens: the machine stands right of the text. Phones (as on the old site): everything
// goes one under another — text, button, then the picture — so a bigger font only pushes things
// down and nothing overlaps. The look of the layers lives in globals.css (.hero-*).
// Later this list will come from the admin panel.

type Slide = {
  key: "maestro" | "sam80" | "university" | "ready";
  href: string;
  button: "about" | "more";
};

const slides: Slide[] = [
  { key: "maestro", href: "/maestro", button: "about" },
  { key: "sam80", href: "/ifi-sam80", button: "about" },
  { key: "university", href: "/carpigiani-gelato-university", button: "more" },
  { key: "ready", href: "/ready", button: "about" },
];

const img = "/images/slides/";

/** Background and picture of each slide */
function SlideArt({ slideKey, first }: { slideKey: Slide["key"]; first: boolean }) {
  const loading = first ? "eager" : "lazy";
  switch (slideKey) {
    case "maestro":
      return (
        <>
          <Image src={`${img}hero-gelato-tray.webp`} alt="" fill sizes="100vw" priority={first} loading={first ? undefined : "lazy"} className="hero-cover" />
          <div aria-hidden="true" className="hero-layer hero-fog" />
          <div aria-hidden="true" className="hero-floor" />
          <Image src={`${img}maestro-cut.webp`} alt="Carpigiani Maestro" width={416} height={1083} sizes="(max-width: 820px) 160px, 360px" loading={loading} className="hero-prod" />
        </>
      );
    case "sam80":
      return (
        <>
          {/* Gelato lab photo (client's choice, 26.10); fog under the text, the showcase stands on it */}
          <Image src={`${img}sam80-bg.webp`} alt="" fill sizes="100vw" loading="lazy" className="hero-cover" />
          <div aria-hidden="true" className="hero-layer hero-fog" />
          <div aria-hidden="true" className="hero-floor" />
          <Image src={`${img}ifi-sam80-cut.webp`} alt="IFI Sam80" width={776} height={516} sizes="(max-width: 820px) 360px, 900px" loading={loading} className="hero-prod" />
        </>
      );
    case "university":
      return (
        <>
          {/* Bologna at night, drawn in lines under the stars; blue fog only under the text */}
          <Image src={`${img}bologna-night.webp`} alt="" fill sizes="100vw" loading="lazy" className="hero-cover" />
          <div aria-hidden="true" className="hero-layer hero-fog" />
        </>
      );
    case "ready":
      return (
        <>
          <Image src={`${img}ready-bg.webp`} alt="" fill sizes="100vw" loading="lazy" className="hero-cover" />
          <div aria-hidden="true" className="hero-layer hero-fog" />
          <div aria-hidden="true" className="hero-floor" />
          <Image src={`${img}ready-cut.webp`} alt="Carpigiani Ready" width={300} height={607} sizes="(max-width: 820px) 160px, 360px" loading={loading} className="hero-prod" />
        </>
      );
  }
}

export function HeroSlider() {
  const t = useTranslations("Slider");
  // Switching, autoplay every 4 seconds, pause and swipe: shared with the category slider
  const { active, paused, go, next, prev, handlers, ringKey } = useSlider({ count: slides.length });
  const bold = (chunks: ReactNode) => <b>{chunks}</b>;

  return (
    <section aria-roledescription="carousel" aria-label={t("label")} className="hero" {...handlers}>
      {slides.map((slide, i) => {
        const on = i === active;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.key}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slideOf", { n: i + 1, total: slides.length })}
            aria-hidden={!on}
            inert={!on}
            className={`hero-slide hero-${slide.key} ${on ? "on" : ""}`}
          >
            <SlideArt slideKey={slide.key} first={i === 0} />
            <div className="hero-text">
              <div className="hero-wrap">
                <Heading className="metal-text">{t(`${slide.key}.title`)}</Heading>
                <p>{t.rich(`${slide.key}.text`, { b: bold })}</p>
                {/* Hover: lifts, a light glare runs across, the arrow moves right */}
                <Link href={slide.href} className="btn-shine hero-btn group/btn">
                  {t(slide.button)}
                  <ArrowRight aria-hidden="true" className="size-4.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
                {/* The group photo stands under the button, in the same block as the text, so a
                    bigger font only pushes it down and it never covers the text */}
                {slide.key === "university" && (
                  <div className="hero-photo hero-photo-phone">
                    <Image src={`${img}gelato-university-3x2.webp`} alt="Carpigiani Gelato University" width={765} height={510} sizes="(max-width: 820px) 330px, 520px" loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Dark shade at the top: the menu reads on any photo */}
      <div aria-hidden="true" className="hero-shade" />

      {/* Metal side arrows (large screens); the ring on "next" shows the 4 seconds */}
      <button type="button" onClick={prev} aria-label={t("prev")} className={`${scoopButton} hero-arrow !z-8 left-6`}>
        <Chevron dir="left" />
      </button>
      <button type="button" onClick={next} aria-label={t("next")} className={`${scoopButton} hero-arrow !z-8 right-6`}>
        <TimerRing key={ringKey} paused={paused} dark />
        <Chevron dir="right" />
      </button>

      {/* Dots and the counter */}
      <div className="hero-dots">
        <div className="hero-wrap">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={t("goTo", { n: i + 1 })}
              aria-current={i === active}
              className={`hero-dot ${i === active ? "on" : ""}`}
            >
              <i />
            </button>
          ))}
          <span className="hero-count">
            <b>{String(active + 1).padStart(2, "0")}</b> / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div aria-hidden="true" className="brand-line hero-bottom-line" />
    </section>
  );
}
