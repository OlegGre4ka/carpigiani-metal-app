import { useId } from "react";

// The modernised logo of the dealer (claude/theme-blue-design-system.md): a blue "cloud" of
// ice cream on a metal waffle cone with a blue "v". Drawn in code, so it is sharp at any size.
// If the client gives the original logo as a vector, redraw it here.
export function BrandMark({ className = "" }: { className?: string }) {
  // Each logo on the page needs its own ids for gradients and the clip
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 80 100" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FB1FF" />
          <stop offset="1" stopColor="#0B50D8" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7F9FB" />
          <stop offset=".5" stopColor="#C9D1D9" />
          <stop offset="1" stopColor="#7F8A96" />
        </linearGradient>
        <clipPath id={`${id}k`}>
          <path d="M15 52h50L40 98z" />
        </clipPath>
      </defs>
      <g fill={`url(#${id}b)`}>
        <circle cx="27" cy="31" r="14" />
        <circle cx="42" cy="23" r="17" />
        <circle cx="57" cy="32" r="13" />
        <rect x="13" y="30" width="58" height="15" rx="7.5" />
      </g>
      <path d="M15 52h50L40 98z" fill={`url(#${id}c)`} />
      <g clipPath={`url(#${id}k)`} stroke="#050A14" strokeOpacity=".28" strokeWidth="2">
        <path d="M8 58l40 40M24 52l40 40M-8 66l40 40M40 52l30 30M56 52l14 14" />
      </g>
      <path d="M30 52l10 18 10-18" stroke="#0B50D8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + CARPIGIANI + OFFICIAL UKRAINE DEALER. size "lg" in the header, "sm" in the footer;
 *  hideWordOnPhone: on phones only the mark (the header has no room there). */
export function BrandLogo({ size = "lg", hideWordOnPhone = false }: { size?: "lg" | "sm"; hideWordOnPhone?: boolean }) {
  return (
    <span className="inline-flex items-center">
      <BrandMark className={size === "lg" ? "h-12 w-auto max-[820px]:h-10" : "h-9 w-auto"} />
      <span className={`ml-3 flex flex-col leading-none ${hideWordOnPhone ? "max-[820px]:hidden" : ""}`}>
        <b className={`font-extrabold tracking-[3px] ${size === "lg" ? "text-lg" : "text-sm"}`}>CARPIGIANI</b>
        <small className="mt-1.5 text-[8px] font-bold tracking-[2.4px] opacity-60">OFFICIAL UKRAINE DEALER</small>
      </span>
    </span>
  );
}
