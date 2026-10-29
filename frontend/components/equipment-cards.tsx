"use client";

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

export function EquipmentCards({ items, onNavy = false }: { items: EquipmentCard[]; onNavy?: boolean }) {
  return (
    <ul data-reveal-kids className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[820px]:gap-3">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <Card item={item} onNavy={onNavy} />
        </li>
      ))}
    </ul>
  );
}

function Card({ item, onNavy }: { item: EquipmentCard; onNavy: boolean }) {
  const t = useTranslations("Equipment");
  const box = `flex h-full w-full flex-col rounded-[30px] text-left max-[820px]:rounded-[22px] max-[820px]:p-2.5 ${
    onNavy ? "navy-card p-3 pb-5" : "steel-card p-4 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]"
  }`;

  const inner = (
    <>
      <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[20px] bg-white">
        {item.image && (
          <Image
            src={item.image}
            alt=""
            width={600}
            height={450}
            sizes="(max-width: 1100px) 50vw, 300px"
            className="max-h-[92%] w-auto max-w-[88%] object-contain transition-transform duration-400 group-hover:scale-105"
          />
        )}
        {item.href && <span className={`absolute right-3 bottom-3 ${moreButton}`}>{t("view")}</span>}
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
  if (!item.href) return <div className={box}>{inner}</div>;
  return (
    <Link href={item.href} className={`group ${box} ${cardLift}`}>
      {inner}
    </Link>
  );
}
