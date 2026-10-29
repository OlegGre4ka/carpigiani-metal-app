"use client";

import Image, { getImageProps } from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Chevron, scoopButton, TimerRing, useSlider } from "@/components/slider-controls";

// Home slider (approved prototype «Carpigiani — нова головна», 26.10): full width under the
// see-through header. Each slide: background → fog under the text → text + machine.
// The text and the machine are in ONE grid (29.10): the text on the left, the machine fills all
// the room that is left (right of the text, or under it on narrow screens), so on any screen and
// with any font it is as big as the room allows and never stands under the text, the buttons or
// the arrows. Phones (as on the old site): text, button, then the machine, one under another.
// The look lives in globals.css (.hero-*).
// Later this list will come from the admin panel.

type Slide = {
  key: "maestro" | "sam80" | "university" | "ready";
  href: string;
  button: "about" | "more";
  /** The machine of the slide (picture with a transparent background) */
  prod?: { src: string; alt: string; width: number; height: number };
};

const slides: Slide[] = [
  { key: "maestro", href: "/maestro", button: "about", prod: { src: "maestro-tech3.webp", alt: "Carpigiani Maestro", width: 700, height: 1409 } },
  { key: "sam80", href: "/ifi-sam80", button: "about", prod: { src: "ifi-sam80.webp", alt: "IFI Sam80", width: 1400, height: 788 } },
  { key: "university", href: "/carpigiani-gelato-university", button: "more" },
  { key: "ready", href: "/ready", button: "about", prod: { src: "ready-cut.webp", alt: "Carpigiani Ready", width: 300, height: 607 } },
];

const img = "/images/slides/";

/** Background of a slide: its own picture for phones (tall) and for large screens (wide).
 *  The browser downloads only the one that fits the screen. */
function HeroBg({ desk, phone, first }: { desk: string; phone?: string; first: boolean }) {
  if (!phone) {
    return <Image src={`${img}${desk}`} alt="" fill sizes="100vw" priority={first} loading={first ? undefined : "lazy"} className="hero-cover" />;
  }
  const common = { alt: "", fill: true, sizes: "100vw" } as const;
  const { props: deskProps } = getImageProps({ ...common, src: `${img}${desk}`, priority: first });
  const {
    props: { srcSet: phoneSet },
  } = getImageProps({ ...common, src: `${img}${phone}` });
  return (
    <picture>
      <source media="(max-width: 820px)" srcSet={phoneSet} />
      <img {...deskProps} alt="" loading={first ? undefined : "lazy"} className="hero-cover" />
    </picture>
  );
}

/** Background of each slide and the blue fog under the text */
function SlideArt({ slideKey, first }: { slideKey: Slide["key"]; first: boolean }) {
  switch (slideKey) {
    case "maestro":
      return <HeroBg desk="hero-gelato-tray.webp" phone="hero-gelato-tray-phone.webp" first={first} />;
    case "sam80":
      // Gelato lab photo (client's choice, 26.10)
      return <HeroBg desk="sam80-bg.webp" phone="sam80-bg-phone.webp" first={first} />;
    case "university":
      // Bologna drawn in lines on blue (client's pictures, 27.10)
      return <HeroBg desk="bologna-day.webp" phone="bologna-day-phone.webp" first={first} />;
    case "ready":
      return <HeroBg desk="ready-bg.webp" first={first} />;
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
            <div aria-hidden="true" className="hero-layer hero-fog" />
            <div className="hero-text">
              <div className="hero-wrap">
                <div className="hero-copy">
                  <Heading className="metal-text">{t(`${slide.key}.title`)}</Heading>
                  <p>{t.rich(`${slide.key}.text`, { b: bold })}</p>
                  {/* As on the old site: only the words; on hover the button widens and an
                      arrow slides in on the right */}
                  <div className="hero-actions">
                    <Link href={slide.href} className="btn-shine hero-btn">
                      <span>{t(slide.button)}</span>
                      <span aria-hidden="true" className="hero-btn-arrow">
                        <ArrowRight className="size-4.5" />
                      </span>
                    </Link>
                    {/* The group photo stands right of the button (phones: under it), in the same
                        block as the text, so a bigger font only pushes it down and it never
                        covers the text */}
                    {slide.key === "university" && (
                      <div className="hero-photo hero-photo-uni">
                        <Image src={`${img}gelato-university-3x2.webp`} alt="Carpigiani Gelato University" width={765} height={510} sizes="(max-width: 820px) 330px, 560px" loading="lazy" />
                      </div>
                    )}
                  </div>
                </div>
                {/* The machine: takes all the room left by the text (globals.css .hero-prodbox) */}
                {slide.prod && (
                  <div className="hero-prodbox">
                    <Image
                      src={`${img}${slide.prod.src}`}
                      alt={slide.prod.alt}
                      width={slide.prod.width}
                      height={slide.prod.height}
                      sizes="(max-width: 820px) 90vw, 50vw"
                      priority={i === 0}
                      loading={i === 0 ? undefined : "lazy"}
                      className="hero-prod"
                    />
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
