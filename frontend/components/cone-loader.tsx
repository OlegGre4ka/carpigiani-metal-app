import { useId } from "react";

// Cone loader (kept for later; not used now — the ring RingLoader below is used instead):
// a cone sways, three scoops and a
// swirl appear on it one by one, then all of it softly "melts" and it starts again (2.8 s).
// Design and sizes: claude/loader-design.md. Sizes 120 / 96 / 72 / 40 px wide; smaller loaders
// (buttons) use the ring <Spinner> instead: below 40 px the scoops stick together.
// It appears only after 250 ms, so a fast load does not make it blink.
// Without animations (system setting) the cone simply stands full.

export function ConeLoader({ size = 96, label }: { size?: 120 | 96 | 72 | 40; label?: string }) {
  // Every loader on the page needs its own gradient id
  const gradient = `cone-${useId().replace(/:/g, "")}`;
  return (
    <div role="status" aria-live="polite" className="cone-loader flex flex-col items-center gap-3.5">
      <svg className="lc" width={size} height={Math.round((size * 4) / 3)} viewBox="0 0 120 160" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C99A68" />
            <stop offset="1" stopColor="#7A5232" />
          </linearGradient>
        </defs>
        <ellipse className="lsh" cx="60" cy="154" rx="20" ry="4" fill="#7A5232" opacity=".18" />
        <g className="lcone">
          <path d="M30 74h60l-26 74a4.5 4.5 0 0 1-8 0z" fill="#F0D5AC" stroke="#B88A5E" strokeWidth="2.4" strokeLinejoin="round" />
          <path
            d="M40 82l22 58M60 76l-1 0M52 76l20 66M78 80l-24 58M36 96h48M44 116h32"
            stroke="#B88A5E"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity=".75"
          />
        </g>
        <g className="lsc">
          <ellipse className="s1" cx="60" cy="68" rx="35" ry="13" fill={`url(#${gradient})`} />
          <ellipse className="s2" cx="60" cy="52" rx="27" ry="12" fill="#FFF3DC" stroke="#E8CFA6" strokeWidth="2" />
          <ellipse className="s3" cx="60" cy="37" rx="19" ry="10.5" fill={`url(#${gradient})`} />
          <path
            className="s4"
            d="M60 28c-5-4-3-11 3-12 1 4 6 5 5 10-1 3-5 4-8 2z"
            fill="#FFF3DC"
            stroke="#E8CFA6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      {label ? (
        <span className="ltx">
          {label}
          <i>.</i>
          <i>.</i>
          <i>.</i>
        </span>
      ) : (
        <span className="sr-only">…</span>
      )}
    </div>
  );
}

/** Small ring for buttons ("Saving…", "Uploading photo…"): 18 px */
export function Spinner({ dark = false }: { dark?: boolean }) {
  return <span aria-hidden="true" className={`ring-spinner ${dark ? "dark" : ""}`} />;
}

/** THE loader of the project now (Oleh's choice, 22.10): a coffee-coloured ring that spins,
 *  familiar to everyone, with a caption under it. Shown at once (no delay). */
export function RingLoader({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-4">
      <span
        aria-hidden="true"
        className="size-14 animate-spin rounded-full border-4 border-brand-light/25 border-t-brand motion-reduce:animate-[spin_2.5s_linear_infinite]"
      />
      <span className="text-sm font-semibold tracking-[1.5px] text-steel uppercase">{label}</span>
    </div>
  );
}

/** Admin panel: the ring in the middle of the content area while it loads
 *  (the menu and the header stay visible) */
export function AdminLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-10">
      <RingLoader label="Завантаження…" />
    </div>
  );
}
