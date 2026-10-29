"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { cardLift, moreButton, phoneArrow } from "@/components/card-styles";
import { Link } from "@/i18n/navigation";
import type { EquipmentCard } from "@/lib/site-pages";

// Cards of equipment / showcases (category pages, the IFI chips and the showcases block on the
// home page). All cards are the same height: the description is cut to 3 lines. A click on a
// card opens the page of the equipment at once (no quick view: the client asked for it).
// Large screens: "View" floats up on the photo on hover. Phones: no button, a double arrow
// at the bottom of the card says "open it to read more".
// onNavy: on the navy home page (mockup): blue cards with a thin metal rim.

/** Phones: double arrow at the bottom of a card, "open it to read more" (also on category cards) */
export function PhoneArrow({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <span aria-hidden="true" className={phoneArrow}>
      {/* On the navy cards: a small metal button, like the buttons of the slider */}
      <span
        className={`flex size-8 items-center justify-center rounded-full ${
          onNavy ? "bg-[image:var(--metal)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_6px_14px_rgb(0_0_0/0.35)]" : "bg-tag text-brand"
        }`}
      >
        <ChevronsRight className="size-4.5 motion-safe:animate-nudge" />
      </span>
    </span>
  );
}

/** pop: machines whose photo is cut out on a transparent background come out of the card on
 *  hover (29.10, Carpigiani equipment; showcases not yet) */
export function EquipmentCards({ items, onNavy = false, pop = false }: { items: EquipmentCard[]; onNavy?: boolean; pop?: boolean }) {
  return (
    <ul data-reveal-kids className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[820px]:gap-3">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <Card item={item} onNavy={onNavy} pop={pop} />
        </li>
      ))}
    </ul>
  );
}

/** Whether a loaded picture is cut out: a good part of it is see-through (a photo with its
 *  own background has none). Checked on a small copy of the picture. */
function isCutout(img: HTMLImageElement) {
  try {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let clear = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 24) clear += 1;
    return clear / (size * size) > 0.08;
  } catch {
    return false;
  }
}

function Card({ item, onNavy, pop }: { item: EquipmentCard; onNavy: boolean; pop: boolean }) {
  const t = useTranslations("Equipment");
  // A machine cut out on a transparent background: on hover it comes forward, out of the card
  // The server says it (cutout); the photo itself is also checked in the browser as a fallback
  const [seen, setSeen] = useState(false);
  const cutout = pop && (Boolean(item.cutout) || seen);
  // On plain white the white of the photo melts into the light card (and around it)
  const onWhite = item.cutout === "white";
  const photo = useRef<HTMLImageElement>(null);
  // The photo may be loaded before the page comes alive (then "load" is not heard): check it then
  useEffect(() => {
    const img = photo.current;
    if (!pop || item.cutout || !img) return;
    const check = () => setSeen(isCutout(img));
    if (img.complete && img.naturalWidth) check();
    else img.addEventListener("load", check, { once: true });
    return () => img.removeEventListener("load", check);
  }, [pop, item.cutout, item.image]);
  const box = `flex h-full w-full flex-col rounded-[30px] text-left max-[820px]:rounded-[22px] max-[820px]:p-2.5 ${
    onNavy ? "navy-card p-3 pb-5" : "steel-card p-4 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"
  }`;

  const inner = (
    <>
      <span
        className={`relative flex aspect-[4/3] w-full items-center justify-center rounded-[20px] ${
          cutout && !onWhite ? "eq-pop bg-[radial-gradient(ellipse_at_50%_100%,#e3ecf8,#ffffff_70%)]" : "overflow-hidden bg-white"
        }`}
      >
        {cutout && <span aria-hidden="true" className="eq-pop-floor" />}
        {item.image && (
          <Image
            src={item.image}
            alt=""
            width={600}
            height={450}
            sizes="(max-width: 1100px) 50vw, 300px"
            ref={photo}
            className={`relative max-h-[92%] w-auto max-w-[88%] object-contain ${cutout ? `eq-pop-img ${onWhite ? "eq-on-white" : ""}` : "transition-transform duration-400 group-hover:scale-105"}`}
          />
        )}
        {item.href && <span className={`absolute right-3 bottom-3 z-3 ${moreButton}`}>{t("view")}</span>}
      </span>
      <span className={`mx-1.5 mt-4 mb-1.5 line-clamp-2 font-extrabold max-[820px]:mt-3 max-[820px]:text-base ${onNavy ? "text-[19px] leading-[1.3] text-white" : "text-xl text-ink"}`}>{item.title}</span>
      {item.text && (
        <span className={`mx-1.5 mb-1.5 line-clamp-3 text-sm leading-normal max-[820px]:text-[13px] ${onNavy ? "text-on-navy-soft" : "text-ink-soft"}`}>{item.text}</span>
      )}
      {/* Phones: double arrow at the bottom, "open it to read more" */}
      {item.href && <PhoneArrow onNavy={onNavy} />}
    </>
  );

  // The page of the equipment is not made yet: the card is not a link
  // (group: the machine still comes out of the card on hover)
  if (!item.href) return <div className={`group ${box}`}>{inner}</div>;
  return (
    <Link href={item.href} className={`group ${box} ${cardLift}`}>
      {inner}
    </Link>
  );
}
