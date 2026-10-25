// Temporary page of a section until its form is made
export function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="motion-safe:animate-fade-up font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink max-[600px]:text-[26px]">{title}</h1>
      <div className="mt-6 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] rounded-[28px] border border-dashed border-ink/25 bg-white/50 p-8 text-ink-soft">
        Тут буде список і форма для додавання та редагування. Зробимо наступними кроками.
      </div>
    </div>
  );
}
