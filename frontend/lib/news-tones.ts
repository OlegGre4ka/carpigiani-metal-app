// Colours of the topic labels of news (claude/news-page-design.md): each topic gets the colour
// of its place among the topics, so it looks the same everywhere. More topics than colours:
// the colours repeat.
// The colours themselves are in app/theme.css (--tone-N-bg / --tone-N-ink).
const tones = [
  "bg-[var(--tone-1-bg)] text-[var(--tone-1-ink)]",
  "bg-[var(--tone-2-bg)] text-[var(--tone-2-ink)]",
  "bg-[var(--tone-3-bg)] text-[var(--tone-3-ink)]",
  "bg-[var(--tone-4-bg)] text-[var(--tone-4-ink)]",
  "bg-[var(--tone-5-bg)] text-[var(--tone-5-ink)]",
  "bg-[var(--tone-6-bg)] text-[var(--tone-6-ink)]",
];

export function toneClass(tone: number | undefined) {
  return tones[Math.abs(tone ?? 0) % tones.length];
}
