"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Lightbox, Magnifier } from "@/components/category-gallery";

/** Main photo at the top of a news page, in the left column: 16:7.2 (about 900×400; 4:3 on
 *  phones), cut to fit; a click shows it whole and big (the same big view as the photos of the
 *  "Photos" block). */
export function NewsPhoto({ image, alt }: { image: string; alt: string }) {
  const t = useTranslations("News");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("zoom")}
        onClick={() => setOpen(true)}
        className="group relative block aspect-[16/7.2] w-full cursor-zoom-in overflow-hidden rounded-[32px] bg-[#f3e4cf] shadow-[0_22px_50px_rgba(120,80,60,0.15)] max-[820px]:aspect-[4/3] max-[820px]:rounded-[24px]"
      >
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(max-width: 820px) 100vw, 900px"
          data-reveal-zoom
          className="object-cover"
        />
        <Magnifier />
      </button>
      {/* Placed straight into <body>: the fade-in of the block would otherwise keep it inside */}
      {open && createPortal(<Lightbox photos={[{ image, caption: "", link: "" }]} start={0} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
