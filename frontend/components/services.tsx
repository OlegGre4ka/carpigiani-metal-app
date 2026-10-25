import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

// Three service cards under the slider. Icons follow the old site:
// a pen (design), a truck (delivery), a wrench with a screwdriver (service).
const icon = (children: ReactNode) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const services = [
  {
    key: "project",
    // Pen: body, cap and nib
    icon: icon(
      <>
        <path d="M5.5 15.5 15 6l3 3-9.5 9.5L4 20z" />
        <path d="m13 8 3 3" />
        <path d="m15 6 1.8-1.8a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L18 9" />
        <path d="m4 20 3-3" />
      </>,
    ),
  },
  {
    key: "delivery",
    // Truck
    icon: icon(
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>,
    ),
  },
  {
    key: "service",
    // Wrench and screwdriver crossed
    icon: icon(
      <>
        <path d="M3.5 3.5 10 10" />
        <path d="m3 3 2 .6.6 2" />
        <path d="m13.2 14.6 1.4-1.4 5.7 5.7a1 1 0 0 1 0 1.4 1 1 0 0 1-1.4 0z" />
        <path d="M17.6 3.4a4 4 0 0 0-4.9 5.2L4 17.3a1.6 1.6 0 0 0 2.3 2.3L15 10.9a4 4 0 0 0 5.2-4.9l-2.3 2.3-2.1-.5-.5-2.1z" />
      </>,
    ),
  },
] as const;

export function Services() {
  const t = useTranslations("Services");

  return (
    // White band on the full width (the home page changes backgrounds: dark, white, dark...)
    <section className="bg-white">
      <div className="mx-auto w-full max-w-360 px-20 py-24 max-[1100px]:px-10 max-[820px]:px-4 max-[820px]:py-14">
        <h2 className="text-[46px] leading-[1.05] max-[820px]:text-[32px]">
          <span className="blue-text">{t("title")}</span>
        </h2>
        <p className="mt-3 mb-10 max-w-155 text-[17px] leading-relaxed text-ink-soft max-[820px]:mb-7 max-[820px]:text-base">{t("text")}</p>
        <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-1 max-[820px]:gap-4">
          {services.map((s, index) => (
            <div
              key={s.key}
              style={{ animationDelay: `${index * 110}ms` }}
              className="steel-card rounded-[30px] [--card-fill:var(--mist)] p-8.5 transition duration-300 motion-safe:animate-fade-up hover:-translate-y-1 max-[820px]:p-6.5"
            >
              <div className="mb-5.5 flex size-14 items-center justify-center rounded-[18px] bg-[image:var(--grad-btn)] text-white shadow-[0_10px_30px_var(--glow)]">
                {s.icon}
              </div>
              <h3 className="mb-2.5 text-2xl font-extrabold tracking-[-0.01em] text-ink max-[820px]:text-xl">{t(`${s.key}.title`)}</h3>
              <p className="text-[15.5px] leading-relaxed text-ink-soft">{t(`${s.key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
