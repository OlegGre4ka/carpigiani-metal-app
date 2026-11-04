import Link from "next/link";

import { AdminMark } from "@/components/brand-logo";

// 404 of the admin panel (4.11): an address of the admin panel that is not one of its screens,
// or a category / news / page that does not exist (any more). Shown inside the panel, with its
// menu on the left, so the way back is at hand.
export function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center pb-6">
      <section className="w-full max-w-150 rounded-[30px] steel-card px-10 py-10 text-center shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] motion-safe:animate-fade-up max-[600px]:px-6 max-[600px]:py-8">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden="true" className="font-heading text-[88px] leading-none font-extrabold tracking-[-0.04em] text-ink max-[600px]:text-[64px]">
            4
          </span>
          <AdminMark className="h-20 w-auto max-[600px]:h-15" />
          <span aria-hidden="true" className="font-heading text-[88px] leading-none font-extrabold tracking-[-0.04em] text-ink max-[600px]:text-[64px]">
            4
          </span>
        </div>
        <p className="mt-5 text-xs font-extrabold tracking-[2px] text-steel uppercase">Помилка 404</p>
        <h1 className="mt-2 font-heading text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-ink max-[600px]:text-[23px]">
          Такої сторінки в адмін-панелі немає
        </h1>
        <p className="mx-auto mt-2.5 max-w-[44ch] text-ink-soft">
          Можливо, її видалили або адресу набрано з помилкою. Оберіть розділ у меню ліворуч або поверніться на головну.
        </p>
        <Link
          href="/fofkas-adminpanel"
          className="btn-shine mt-6 inline-flex items-center justify-center rounded-full bg-[image:var(--grad-btn)] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.25)] transition hover:-translate-y-0.5 hover:brightness-108"
        >
          На головну адмінки
        </Link>
      </section>
    </div>
  );
}
