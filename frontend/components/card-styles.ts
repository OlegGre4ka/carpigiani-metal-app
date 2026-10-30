// Shared look of all cards that lead somewhere (category cards on the home page, equipment and
// showcase cards on category pages): the card lifts on hover and its button floats up.
export const cardLift = "transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_54px_rgb(var(--shadow-rgb)/0.15)]";
/** Button on the photo of a card (metal, as in the mockup): floats up on hover; on touch screens
 *  it is always visible. Phones hide it (a double arrow at the bottom of the card instead). */
export const moreButton =
  "metal-shine rounded-full bg-[image:var(--metal)] px-5.5 py-2.75 text-sm font-extrabold text-ink shadow-[0_12px_28px_rgb(0_10_50/0.45)] transition-all duration-300 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 max-[820px]:hidden";

/** Chip of a filter (showcases by category, news by topic): dark while chosen.
 *  onNavy: on the navy home page (mockup): blue while chosen, see-through otherwise. */
export const chip = (active: boolean, onNavy = false) =>
  `shrink-0 rounded-full border px-4.5 py-2.25 text-[13.5px] font-extrabold whitespace-nowrap transition-colors max-[820px]:px-3.5 max-[820px]:py-2 max-[820px]:text-[12.5px] ${
    onNavy
      ? active
        ? "border-transparent bg-[image:var(--metal)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_8px_20px_rgb(0_0_0/0.35)]"
        : "border-white/20 bg-white/5 text-on-navy hover:bg-white/10"
      : active
        ? "chip-active text-white"
        : "border-ink/15 bg-white/70 text-ink hover:bg-white"
  }`;

/** Phones: double arrow at the bottom of a card that leads to a page, "open it to read more"
 *  (instead of the button on the photo) */
export const phoneArrow = "mt-auto hidden self-end pt-1 max-[820px]:flex";

/** Arrow buttons: the same "ice cream scoop" as the slider arrows and the "up" button
 *  (pages of news). aria-disabled makes it pale. */
export const scoopArrow =
  // 30.10: metal like the arrows of the sliders and the "Up" button (.metal-round: navy on hover)
  "metal-round flex size-13 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-[image:var(--metal)] text-ink shadow-[inset_0_-4px_8px_rgb(var(--ink-rgb)/0.18),0_12px_26px_rgb(var(--ink-rgb)/0.25)] transition-all duration-300 aria-disabled:pointer-events-none aria-disabled:cursor-default aria-disabled:opacity-35 [&:not([aria-disabled])]:hover:scale-110 [&:not([aria-disabled])]:hover:text-white max-[820px]:size-11";
