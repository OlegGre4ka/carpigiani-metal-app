// Colours of the topic labels of news (claude/news-page-design.md): each topic gets the colour
// of its place among the topics, so it looks the same everywhere. More topics than colours:
// the colours repeat.
const tones = [
  "bg-[#d6f0e0] text-[#2f5a44]", // mint
  "bg-[#f3e4cf] text-[#7a5232]", // sand
  "bg-[#e3ecf7] text-[#35557f]", // blue
  "bg-[#ede3f3] text-[#5e4277]", // lilac
  "bg-[#fbe3d6] text-[#8a4a2e]", // peach
  "bg-[#f4edc9] text-[#6b5714]", // lemon
];

export function toneClass(tone: number | undefined) {
  return tones[Math.abs(tone ?? 0) % tones.length];
}
