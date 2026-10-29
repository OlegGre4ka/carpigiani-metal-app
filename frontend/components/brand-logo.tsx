// The logo of the dealer: the mark (picture public/images/logo-mark.webp). When a vector
// version is made, it replaces the picture here and everywhere at once.
export function BrandMark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  // The new mark (26.10.2026): a chrome ribbon cloud on a cone, a thin blue thread inside and a
  // blue spark at the tip, all of one piece. A picture with a transparent background (WebP,
  // cut from Oleh's file on navy, 27.10); the size comes from the class (height, width auto).
  // eslint-disable-next-line @next/next/no-img-element -- small logo, same file everywhere
  return <img src="/images/logo-mark.webp" alt="" aria-hidden="true" width={330} height={462} fetchPriority={priority ? "high" : undefined} className={className} />;
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

// The line of blue thread inside the metal of the mark, in the picture's own pixels (575 × 805):
// the top arc of the cloud, the long S through the cloud, then the cone from its right corner
// down the left side to the tip (traced from the picture, 29.10).
const sparkPath = [
  "M165.0 101.0 L170.5 95.4 L175.7 89.5 L180.7 83.4 L186.0 77.5 L191.7 71.9 L197.7 66.9 L203.9 62.2 L210.4 57.7 L217.2 53.7 L224.4 50.0 L231.6 46.8 L239.1 44.0 L246.8 41.7 L254.5 39.6 L262.3 37.9 L270.2 36.8 L278.2 36.2 L286.1 36.0 L294.0 36.5 L301.8 37.1 L309.7 37.7 L317.3 38.9 L324.7 41.0 L332.1 43.6 L339.4 46.5 L346.6 49.7 L353.7 53.4 L360.8 56.9 L367.5 61.0 L373.7 65.9 L379.9 71.0 L385.8 76.4 L391.2 82.2 L396.4 88.3 L401.2 94.7 L405.5 101.4 L409.4 108.4 L413.2 115.4 L416.6 122.5 L419.1 130.1 L420.7 137.9 L422.2 145.7 L423.5 153.6 L424.2 161.6 L424.6 169.5 L424.5 177.5 L423.8 185.4 L422.6 193.2 L421.0 200.7 L418.8 208.2 L417.0 214.8",
  "M466.0 161.0 L472.4 165.7 L478.7 170.3 L485.0 174.9 L491.3 179.6 L497.1 185.1 L502.6 190.8 L507.7 197.0 L512.1 203.6 L515.6 210.7 L518.5 218.2 L521.3 225.7 L523.3 233.3 L524.8 241.1 L525.6 248.9 L526.0 256.9 L525.8 264.8 L525.0 272.8 L523.5 280.6 L521.2 288.2 L518.4 295.5 L515.1 302.7 L511.6 309.7 L507.1 316.3 L502.0 322.4 L496.4 328.2 L490.5 333.6 L484.3 338.5 L477.6 342.9 L470.8 347.0 L463.6 350.5 L456.1 353.0 L448.5 355.1 L440.8 356.8 L433.0 358.2 L425.1 358.6 L417.2 358.5 L409.4 358.0 L401.8 356.8 L394.1 355.6 L386.2 354.8 L378.7 353.1 L371.6 349.9 L364.6 346.1 L357.3 342.7 L350.2 339.2 L343.3 335.2 L336.8 330.6 L330.6 325.7 L324.6 320.6 L318.9 315.4 L313.4 309.6 L308.2 303.6 L303.3 297.3 L298.6 290.8 L294.5 284.0 L290.5 277.1 L286.5 270.3 L282.7 263.4 L279.4 256.3 L276.2 249.1 L272.7 242.2 L269.5 235.2 L266.5 227.9 L262.9 220.8 L258.9 213.9 L254.7 207.1 L250.3 200.5 L245.4 194.1 L240.1 188.1 L234.7 182.3 L228.7 177.1 L222.5 172.2 L216.0 167.8 L209.3 163.6 L202.4 159.7 L195.3 156.1 L187.9 153.4 L180.1 151.4 L172.3 150.3 L164.3 150.0 L156.3 150.0 L148.4 149.8 L140.5 149.8 L132.7 150.7 L125.0 152.2 L117.4 154.2 L109.8 156.3 L102.6 159.6 L95.8 163.6 L89.2 167.9 L82.7 172.3 L76.4 177.2 L70.3 182.2 L65.3 188.0 L60.6 194.3 L56.0 200.8 L51.7 207.5 L48.0 214.6 L45.0 221.9 L42.7 229.6 L40.8 237.3 L39.4 245.2 L38.7 253.1 L38.3 261.1 L38.4 269.1 L39.1 277.0 L40.5 284.9 L42.4 292.5 L44.7 300.1 L47.5 307.5 L50.9 314.7 L54.6 321.8 L59.0 328.3 L64.3 334.3 L70.1 339.6 L76.0 344.9 L82.1 349.9 L88.6 354.1 L95.6 357.7 L102.4 361.5 L109.3 364.8 L116.7 367.3 L124.3 369.2 L132.0 369.8 L139.8 369.7 L147.6 369.9 L155.6 370.4 L162.9 371.9 L169.2 375.4 L174.9 380.9 L180.6 386.6 L186.2 392.2 L192.2 397.6 L198.5 402.4 L205.1 406.9 L212.0 410.6 L219.1 414.3 L226.1 418.0 L233.2 421.5 L240.6 424.5 L248.2 426.8 L255.8 429.0 L263.4 430.6 L271.3 431.4 L279.3 431.6 L287.1 431.9 L294.7 432.0 L302.4 432.0 L310.3 431.4 L318.1 430.0 L325.8 428.4 L333.5 426.7 L340.8 423.8 L347.8 420.1 L355.0 416.7 L360.8 414.3",
  "M439.0 452.0 L431.8 451.7 L424.3 453.2 L417.0 456.3 L410.2 460.4 L403.3 464.5 L396.2 468.1 L389.2 471.4 L382.2 474.9 L375.3 478.6 L368.1 481.9 L360.6 484.6 L353.0 487.2 L345.4 489.8 L337.7 491.9 L329.9 493.6 L322.1 495.0 L314.2 496.3 L306.2 497.1 L298.2 497.4 L290.2 497.6 L282.4 497.6 L274.5 497.3 L266.7 496.7 L258.8 495.8 L250.9 494.7 L243.2 493.4 L235.5 491.8 L228.0 489.6 L220.6 487.0 L213.2 484.3 L205.8 481.6 L198.5 478.7 L191.3 475.5 L184.2 472.0 L177.0 468.5 L170.1 464.6 L163.1 460.6 L156.5 456.3 L149.7 452.4 L142.6 449.6 L136.7 450.8 L134.3 455.8 L135.6 463.3 L138.4 470.5 L142.2 477.4 L146.2 484.3 L150.2 491.2 L153.9 498.2 L157.5 505.4 L161.5 512.2 L165.5 519.0 L169.5 525.8 L173.3 532.7 L177.1 539.7 L180.7 546.8 L184.8 553.7 L189.1 560.4 L193.1 567.3 L196.8 574.4 L200.7 581.3 L204.5 588.2 L208.3 595.1 L212.3 602.0 L216.2 608.9 L220.2 615.8 L224.2 622.6 L228.1 629.6 L231.6 636.7 L235.4 643.7 L239.6 650.6 L243.8 657.3 L248.1 664.1 L252.0 671.1 L255.7 678.1 L259.7 684.9 L263.8 691.6 L267.6 698.5 L271.1 705.6 L275.2 712.4 L279.8 718.7 L283.9 725.0 L285.9 730.9",
];
const sparkLen = [403, 1231, 642];
const sparkBegin = [0.75, 1.20, 2.33];
const sparkDur = [0.33, 1.01, 0.52];
export const SPARK_END = 2.85;

/** The mark with a blue spark (splash screen): the mark rises, a spark with a short glowing
 *  trail runs along the blue thread inside the metal — the cloud, then the cone — stops in the
 *  tip of the cone, where the spark of the mark always is, flashes brighter for a moment and
 *  stays. Plain SVG animation; the splash screen holds it until the picture of the mark is
 *  loaded, then starts it (components/site-splash.tsx). People who turned off animations see the
 *  mark as it is. */
export function AnimatedBrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <BrandMark priority className="block h-full w-auto" />
      <svg aria-hidden="true" viewBox="0 0 575 805" className="logo-spark absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id="spark-glow">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.22" stopColor="#bfe3ff" />
            <stop offset="0.5" stopColor="#3d8cff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1c5be0" stopOpacity="0" />
          </radialGradient>
          <filter id="spark-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* The glowing trail behind the spark, one piece of the thread after another */}
        {sparkPath.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#9ad6ff" strokeWidth="13" strokeLinecap="round" filter="url(#spark-blur)" strokeDasharray={`150 ${sparkLen[i] + 300}`} strokeDashoffset="150" opacity="0">
            <animate attributeName="stroke-dashoffset" from="150" to={-sparkLen[i]} begin={`${sparkBegin[i]}s`} dur={`${sparkDur[i] + 0.18}s`} fill="freeze" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.85;1" begin={`${sparkBegin[i]}s`} dur={`${sparkDur[i] + 0.18}s`} fill="freeze" />
          </path>
        ))}
        {/* The spark: it runs piece by piece and hides for a blink between the pieces */}
        {sparkPath.map((d, i) => (
          <g key={i} opacity="0">
            <circle r="62" fill="url(#spark-glow)" />
            <circle r="10" fill="#ffffff" />
            <animateMotion path={d} begin={`${sparkBegin[i]}s`} dur={`${sparkDur[i]}s`} fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines={i === 2 ? "0.3 0 0.4 1" : "0.4 0 0.6 1"} />
            <animate attributeName="opacity" values={i === 2 ? "0;1;1" : "0;1;1;0"} keyTimes={i === 2 ? "0;0.06;1" : "0;0.08;0.9;1"} begin={`${sparkBegin[i]}s`} dur={`${sparkDur[i]}s`} fill="freeze" />
            {i === 2 && <animate attributeName="opacity" to="0" begin={`${SPARK_END + 0.35}s`} dur="0.4s" fill="freeze" />}
          </g>
        ))}
        {/* The flash in the tip: brighter for a moment, then the usual spark of the mark */}
        <g transform="translate(286 735)" opacity="0">
          <circle r="80" fill="url(#spark-glow)">
            <animate attributeName="r" values="20;170;70" keyTimes="0;0.35;1" begin={`${SPARK_END}s`} dur="0.8s" fill="freeze" />
          </circle>
          <path d="M-150 0 L150 0 M0 -95 L0 95" stroke="#e8f5ff" strokeWidth="6" strokeLinecap="round" filter="url(#spark-blur)">
            <animate attributeName="opacity" values="0;1;0.35" keyTimes="0;0.3;1" begin={`${SPARK_END}s`} dur="0.8s" fill="freeze" />
          </path>
          <animate attributeName="opacity" values="0;1;0.7" keyTimes="0;0.25;1" begin={`${SPARK_END}s`} dur="0.8s" fill="freeze" />
        </g>
      </svg>
    </span>
  );
}
