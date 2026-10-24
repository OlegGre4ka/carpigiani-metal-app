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
    bg: "bg-[#cde9d2]",
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
    bg: "bg-[#f2d7cf]",
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
    bg: "bg-[#ffe7a6]",
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
    <section className="mx-auto flex w-full max-w-360 flex-wrap gap-7 px-20 pt-16 max-[820px]:gap-4 max-[820px]:px-4 max-[820px]:pt-10">
      {services.map((s) => (
        <div
          key={s.key}
          className="flex min-w-65 flex-1 gap-5 rounded-[32px] border border-white/90 bg-white/75 px-7.5 py-9 shadow-[0_14px_40px_rgba(90,60,40,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_54px_rgba(90,60,40,0.15)] max-[820px]:py-7"
        >
          <div className={`flex size-14 flex-none items-center justify-center rounded-full text-cocoa ${s.bg}`}>
            {s.icon}
          </div>
          <div>
            <h3 className="mb-2 text-[21px] font-bold">{t(`${s.key}.title`)}</h3>
            <p className="text-[15px] leading-[1.55] text-[#7a6656]">{t(`${s.key}.text`)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
