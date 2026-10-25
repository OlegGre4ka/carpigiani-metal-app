"use client";

import Image, { getImageProps } from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Chevron, scoopButton, TimerRing, useSlider } from "@/components/slider-controls";

// Slides for the demo. Later this list will come from the admin panel.
type Background =
  | { kind: "photo"; desktop: string; phone: string; size: [number, number]; phoneSize: [number, number]; phoneClass?: string }
  | { kind: "fade"; src: string; size: [number, number]; phoneClass: string }
  | { kind: "sketch"; src: string; size: [number, number] };

type Slide = {
  key: "maestro" | "lunette" | "university" | "ready";
  href: string;
  button: "about" | "more";
  background: Background;
  // The inner photo of the slide (machine photo on a tilted paper sheet)
  sheet: { src: string; size: [number, number]; alt: string };
  variant: 1 | 2 | 3 | 4;
};

// Navy glow behind each slide (mockup «Головна (синя тема)»), values in app/theme.css
const glows = {
  1: "bg-[image:var(--hero-glow-1)]",
  2: "bg-[image:var(--hero-glow-2)]",
  3: "bg-[image:var(--hero-glow-3)]",
  4: "bg-[image:var(--hero-glow-4)]",
} as const;

const slides: Slide[] = [
  {
    key: "maestro",
    href: "/maestro",
    button: "about",
    background: {
      kind: "photo",
      desktop: "/images/slides/maestro-bg.webp",
      phone: "/images/slides/maestro-bg-phone.webp",
      size: [1080, 602],
      phoneSize: [900, 1602],
    },
    sheet: { src: "/images/slides/maestro.webp", size: [510, 747], alt: "Carpigiani Maestro" },
    variant: 1,
  },
  {
    key: "lunette",
    href: "/ifi-lunette",
    button: "about",
    background: {
      kind: "fade",
      src: "/images/slides/lunette-bg.webp",
      size: [1500, 698],
      phoneClass: "max-[820px]:object-[30%_center]",
    },
    sheet: { src: "/images/slides/lunette.webp", size: [800, 608], alt: "IFI Lunette" },
    variant: 2,
  },
  {
    key: "university",
    href: "/carpigiani-gelato-university",
    button: "more",
    // Watercolor sketch of Bologna with its two towers (home of Carpigiani Gelato University)
    background: { kind: "sketch", src: "/images/slides/bologna-sketch.webp", size: [1376, 768] },
    // 3:2 crop of the group photo: fills the free space better than the wide original
    sheet: { src: "/images/slides/gelato-university-3x2.webp", size: [765, 510], alt: "Carpigiani Gelato University" },
    variant: 3,
  },
  {
    key: "ready",
    href: "/ready",
    button: "about",
    background: {
      kind: "fade",
      src: "/images/slides/ready-bg.webp",
      size: [1446, 736],
      phoneClass: "max-[820px]:object-[55%_center]",
    },
    sheet: { src: "/images/slides/ready.webp", size: [430, 680], alt: "Carpigiani Ready" },
    variant: 4,
  },
];

// Position and tilt of the inner photo, per slide.
const sheetStyles = {
  1: {
    box: "max-[820px]:bottom-3.5 left-[41%] w-62.5 -rotate-5 hover:rotate-0 max-[820px]:left-auto max-[820px]:right-2.5 max-[820px]:w-28",
    img: "h-[min(335px,calc(100svh-460px))] min-h-55 max-[820px]:h-37.5 max-[820px]:min-h-0",
  },
  2: {
    box: "max-[820px]:bottom-3.5 right-24 w-77.5 rotate-4 hover:rotate-0 max-[820px]:right-2.5 max-[820px]:w-39.5",
    img: "h-53.75 max-[820px]:h-27.5",
  },
  3: {
    box: "left-[max(41%,304px)] min-[821px]:bottom-6 w-max -rotate-4 hover:rotate-0 max-[820px]:relative max-[820px]:inset-auto max-[820px]:mx-auto max-[820px]:mt-1 max-[820px]:w-[calc(100%-48px)] max-[820px]:max-w-82.5",
    img: "h-[min(400px,calc(clamp(520px,100svh_-_150px,720px)_-_310px),calc((min(80cqw,100cqw_-_262px)_+_59px_-_0.985_*_min(clamp(520px,100svh_-_150px,720px),580px))_/_1.5))] w-auto! max-[820px]:h-44 max-[820px]:min-h-0 max-[820px]:w-full! max-[820px]:object-cover max-[820px]:object-[center_25%]",
  },
  4: {
    box: "max-[820px]:bottom-3.5 right-30 w-67.5 rotate-4 hover:rotate-0 max-[820px]:right-3 max-[820px]:w-30",
    img: "h-[min(380px,calc(100svh-360px))] min-h-60 max-[820px]:h-41.25 max-[820px]:min-h-0",
  },
} as const;

function SlideBackground({ background, first }: { background: Background; first: boolean }) {
  if (background.kind === "sketch") {
    // Cream background with the sketch on the right. Desktop: slide height (max 580px),
    // shifted right so both towers stand right of the group photo.
    // Phone: full width at the bottom, so the towers show under the group photo.
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <Image
          src={background.src}
          alt=""
          width={background.size[0]}
          height={background.size[1]}
          sizes="(max-width: 820px) 100vw, 1300px"
          loading={first ? "eager" : "lazy"}
          className="absolute -right-27.5 bottom-0 h-[min(100%,580px)] w-auto max-w-none opacity-30 mix-blend-screen invert hue-rotate-180 saturate-60 mask-[linear-gradient(90deg,transparent_10%,#000_45%)] max-[820px]:right-0 max-[820px]:h-auto max-[820px]:w-[min(100%,330px)] max-[820px]:mask-[linear-gradient(180deg,transparent_0%,#000_40%)]"
        />
      </div>
    );
  }

  if (background.kind === "fade") {
    // Photo fades in from the left, so the text sits on clean cream.
    return (
      <div className="absolute inset-0 opacity-50 mask-[linear-gradient(90deg,transparent_28%,#000_70%)] max-[820px]:top-auto max-[820px]:h-[56%] max-[820px]:mask-[linear-gradient(180deg,transparent_0%,#000_36%)]">
        <Image
          src={background.src}
          alt=""
          fill
          sizes="(max-width: 820px) 100vw, 1280px"
          loading={first ? "eager" : "lazy"}
          className={`object-cover object-right ${background.phoneClass}`}
        />
      </div>
    );
  }

  // Different photos for desktop and phone: the browser loads only the one it needs.
  const common = { alt: "", sizes: "100vw", loading: first ? ("eager" as const) : ("lazy" as const) };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: background.desktop, width: background.size[0], height: background.size[1] });
  const {
    props: { srcSet: phone, ...rest },
  } = getImageProps({ ...common, src: background.phone, width: background.phoneSize[0], height: background.phoneSize[1] });

  return (
    <picture>
      <source media="(max-width: 820px)" srcSet={phone} />
      <source media="(min-width: 821px)" srcSet={desktop} />
      <img
        {...rest}
        alt=""
        fetchPriority={first ? "high" : undefined}
        className={`absolute inset-0 size-full object-cover object-right opacity-50 mask-[linear-gradient(90deg,transparent_28%,#000_70%)] max-[820px]:mask-[linear-gradient(180deg,transparent_25%,#000_65%)] ${background.phoneClass ?? ""}`}
      />
    </picture>
  );
}

export function HeroSlider() {
  const t = useTranslations("Slider");
  // Switching, autoplay every 4 seconds, pause and swipe: shared with the category slider
  const { active, paused, go, next, prev, handlers, ringKey } = useSlider({ count: slides.length });

  const bold = (chunks: ReactNode) => <b className="text-white">{chunks}</b>;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("label")}
      className="mx-auto w-full max-w-360 px-20 pt-3 max-[820px]:px-4"
    >
      {/* Thin metal-to-blue rim around the slider, blue glow under it */}
      <div className="rounded-[56px] bg-[image:var(--hero-rim)] p-px shadow-[0_40px_100px_rgb(0_60_255/0.28)] max-[820px]:rounded-[32px]">
      <div
        className="relative overflow-hidden rounded-[55px] bg-navy text-white max-[820px]:rounded-[31px]"
        {...handlers}
      >
        {/* On desktop the slider fits the first screen: page height minus the header */}
        <div className="@container grid h-[clamp(520px,calc(100svh-150px),720px)] max-[820px]:h-auto">
          {slides.map((slide, i) => {
            const on = i === active;
            const s = sheetStyles[slide.variant];
            return (
              <div
                key={slide.key}
                role="group"
                aria-roledescription="slide"
                aria-label={t("slideOf", { n: i + 1, total: slides.length })}
                aria-hidden={!on}
                inert={!on}
                className={`relative col-start-1 row-start-1 flex items-start transition-opacity duration-700 max-[820px]:min-h-150 max-[820px]:flex-col ${
                  on ? "z-1 opacity-100" : "opacity-0"
                }`}
              >
                <div aria-hidden="true" className={`absolute inset-0 ${glows[slide.variant]}`} />
                <SlideBackground background={slide.background} first={i === 0} />

                {/* The text block lets clicks through to the photo; only the button catches them */}
                <div className="pointer-events-none relative z-2 px-18 py-16 max-[820px]:px-5 max-[820px]:py-5.5">
                  <h2
                    className={`mt-1.5 mb-4.5 max-w-108 bg-[image:var(--grad-title)] bg-clip-text pb-1.5 leading-none tracking-[-2px] text-transparent max-[820px]:mt-0.5 max-[820px]:mb-3 max-[820px]:max-w-none ${
                      slide.key === "university"
                        ? "text-[56px] max-[820px]:text-[min(34px,7.6vw)]"
                        : "text-[68px] max-[820px]:text-[min(42px,10vw)]"
                    } ${on ? "motion-safe:animate-title-in" : ""}`}
                  >
                    {t(`${slide.key}.title`)}
                  </h2>
                  <p
                    className={`mb-9 max-w-85 text-[21px] leading-normal text-on-navy-soft max-[820px]:max-w-none max-[820px]:mb-4.5 max-[820px]:text-base ${
                      on ? "motion-safe:animate-in-left [animation-delay:250ms]" : ""
                    }`}
                  >
                    {t.rich(`${slide.key}.text`, { b: bold })}
                  </p>
                  <div
                    className={`pointer-events-auto w-max ${on ? "motion-safe:animate-in-left [animation-delay:450ms]" : ""}`}
                  >
                    {/* Hover: lifts, a light glare runs across, the arrow moves right */}
                    <Link
                      href={slide.href}
                      className="btn-shine group/btn inline-flex items-center gap-2.5 rounded-full bg-[image:var(--metal)] px-8.5 py-4.25 font-extrabold text-ink shadow-[0_12px_34px_rgb(160_180_215/0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgb(160_180_215/0.4)] max-[820px]:px-4.5 max-[820px]:py-3 max-[820px]:text-sm"
                    >
                      {t(slide.button)}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4.5 transition-transform duration-300 group-hover/btn:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>

                {/* Inner photo of the slide: tilted card in a metal-blue frame.
                    A click opens the same page as the button (the button stays the main link for keyboard and screen readers) */}
                <Link
                  href={slide.href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className={`absolute bottom-10 z-1 block cursor-pointer transition-transform duration-400 hover:-translate-y-2 ${s.box} ${
                    on ? "motion-safe:animate-sheet-in [animation-delay:300ms]" : ""
                  }`}
                >
                  <div className="rounded-[30px] bg-[image:var(--sheet-rim)] p-0.5 shadow-[0_30px_80px_rgb(0_70_255/0.45),0_0_0_8px_rgb(47_130_255/0.1)] max-[820px]:rounded-[20px]">
                  <div className="relative rounded-[28px] bg-[image:var(--sheet-bg)] p-3.5 max-[820px]:rounded-[18px] max-[820px]:p-1.75">
                    <Image
                      src={slide.sheet.src}
                      alt={slide.sheet.alt}
                      width={slide.sheet.size[0]}
                      height={slide.sheet.size[1]}
                      sizes="(max-width: 820px) 270px, 310px"
                      className={`block w-full object-contain ${s.img}`}
                    />
                  </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Side arrows (desktop) */}
        <button type="button" onClick={prev} aria-label={t("prev")} className={`${scoopButton} top-[62%] left-5`}>
          <Chevron dir="left" />
        </button>
        <button type="button" onClick={next} aria-label={t("next")} className={`${scoopButton} top-[62%] right-5`}>
          <TimerRing key={ringKey} paused={paused} dark />
          <Chevron dir="right" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-7 left-15.5 z-2 flex max-[820px]:bottom-3 max-[820px]:left-2.5">
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
                className={`block h-2 rounded-full transition-all duration-250 ${
                  i === active ? "w-9 bg-[image:var(--metal)]" : "w-2 bg-white/35"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
