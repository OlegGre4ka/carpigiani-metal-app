// Shared look of all cards that lead somewhere (category cards on the home page, equipment and
// showcase cards on category pages): the card lifts on hover and its button floats up.
export const cardLift = "transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_54px_rgb(var(--shadow-rgb)/0.15)]";
/** Button on the photo of a card: floats up on hover; on touch screens it is always visible */
export const moreButton =
  "rounded-full bg-[image:var(--grad-btn)] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgb(var(--brand-rgb)/0.35)] transition-all duration-300 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100";

/** Chip of a filter (showcases by category, news by topic): dark while chosen */
export const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-4.5 py-2.25 text-[13.5px] font-extrabold whitespace-nowrap transition-colors max-[820px]:px-3.5 max-[820px]:py-2 max-[820px]:text-[12.5px] ${
    active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white/70 text-ink hover:bg-white"
  }`;

/** Arrow buttons: the same "ice cream scoop" as the slider arrows and the "up" button
 *  (quick view of cards, pages of news). aria-disabled makes it pale. */
export const scoopArrow =
  "flex size-13 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-[image:var(--grad-round)] text-brand shadow-[inset_0_-4px_8px_rgb(var(--brand-rgb)/0.18),0_12px_26px_rgb(var(--ink-rgb)/0.25)] transition-all duration-300 aria-disabled:cursor-default aria-disabled:opacity-35 [&:not([aria-disabled])]:hover:scale-110 [&:not([aria-disabled])]:hover:border-white [&:not([aria-disabled])]:hover:bg-[image:var(--grad-btn)] [&:not([aria-disabled])]:hover:text-white max-[820px]:size-11";
