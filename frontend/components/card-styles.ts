// Shared look of all cards that lead somewhere (category cards on the home page, equipment and
// showcase cards on category pages): the card lifts on hover and its button floats up.
export const cardLift = "transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_54px_rgba(90,60,40,0.15)]";
/** Button on the photo of a card: floats up on hover; on touch screens it is always visible */
export const moreButton =
  "rounded-full bg-[linear-gradient(180deg,#b88a5e,#7a5232)] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(122,82,50,0.35)] transition-all duration-300 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100";

/** Chip of a filter (showcases by category, news by topic): dark while chosen */
export const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-4.5 py-2.25 text-[13.5px] font-extrabold whitespace-nowrap transition-colors max-[820px]:px-3.5 max-[820px]:py-2 max-[820px]:text-[12.5px] ${
    active ? "border-cocoa bg-cocoa text-white" : "border-cocoa/15 bg-white/70 text-cocoa hover:bg-white"
  }`;

/** Arrow buttons: the same "ice cream scoop" as the slider arrows and the "up" button
 *  (quick view of cards, pages of news). aria-disabled makes it pale. */
export const scoopArrow =
  "flex size-13 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_35%_30%,#fff8ec,#f3dcc0_70%)] text-caramel shadow-[inset_0_-4px_8px_rgba(122,82,50,0.18),0_12px_26px_rgba(74,52,38,0.25)] transition-all duration-300 aria-disabled:cursor-default aria-disabled:opacity-35 [&:not([aria-disabled])]:hover:scale-110 [&:not([aria-disabled])]:hover:border-white [&:not([aria-disabled])]:hover:bg-[linear-gradient(180deg,#b88a5e,#7a5232)] [&:not([aria-disabled])]:hover:text-white max-[820px]:size-11";
