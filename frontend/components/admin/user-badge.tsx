"use client";

import { useEffect, useRef, useState } from "react";

/** Circle with the first letter of the admin's email. A click opens a small menu: full email and "Log out". */
export function UserBadge({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Closes on a click anywhere else and on Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Ви увійшли як ${email}. Меню профілю`}
        aria-expanded={open}
        className={`flex size-10 cursor-pointer items-center justify-center rounded-full text-sm font-extrabold uppercase transition-colors ${
          open ? "bg-cocoa text-white" : "bg-sand text-caramel hover:bg-[#ecdcc6]"
        }`}
      >
        {email[0]}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-max max-w-[calc(100vw-32px)] animate-panel-in rounded-2xl border border-white/90 bg-[rgba(255,252,246,0.97)] p-3 text-cocoa shadow-[0_18px_40px_rgba(74,52,38,0.22)]">
          <span className="block px-1 text-[10px] font-bold tracking-[1.5px] text-gold uppercase">Ви увійшли як</span>
          <span className="mt-0.5 block truncate px-1 text-sm font-bold">{email}</span>
          <form action="/fofkas-adminpanel/logout" method="post" className="mt-3 border-t border-cocoa/10 pt-3">
            <button
              type="submit"
              className="w-full cursor-pointer rounded-full border border-cocoa/20 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-caramel hover:bg-[linear-gradient(180deg,#b88a5e,#7a5232)] hover:text-white"
            >
              Вийти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
