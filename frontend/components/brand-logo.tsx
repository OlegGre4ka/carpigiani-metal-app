// The logo of the dealer: the mark (picture public/images/logo-mark.webp). When a vector
// version is made, it replaces the picture here and everywhere at once.
export function BrandMark({ className = "" }: { className?: string }) {
  // The new mark (26.10.2026): a chrome ribbon cloud on a cone, a thin blue thread inside and a
  // blue spark at the tip, all of one piece. A picture with a transparent background (WebP,
  // cut from Oleh's file on navy, 27.10); the size comes from the class (height, width auto).
  // eslint-disable-next-line @next/next/no-img-element -- small logo, same file everywhere
  return <img src="/images/logo-mark.webp" alt="" aria-hidden="true" width={330} height={462} className={className} />;
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
