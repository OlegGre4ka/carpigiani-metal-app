// Temporary page of a section until its form is made
export function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="motion-safe:animate-fade-up font-heading text-[40px] leading-tight font-bold text-caramel max-[600px]:text-[32px]">{title}</h1>
      <div className="mt-6 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] rounded-[28px] border border-dashed border-cocoa/25 bg-white/50 p-8 text-cocoa-soft">
        Тут буде список і форма для додавання та редагування. Зробимо наступними кроками.
      </div>
    </div>
  );
}
