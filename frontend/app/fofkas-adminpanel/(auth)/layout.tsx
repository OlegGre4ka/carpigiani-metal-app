// Background for all login forms: soft blue glows, the form in the middle of the screen
// (30.10, Oleh: the big cut-off mark at the bottom right is removed).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-page px-6 py-16 text-ink max-[820px]:items-start max-[820px]:px-4 max-[820px]:pt-7 max-[820px]:pb-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_45%,rgb(var(--brand-light-rgb)/0.2),transparent_70%),radial-gradient(40%_50%_at_0%_0%,rgb(var(--brand-rgb)/0.08),transparent_70%)]"
      />

      <main className="relative z-1 flex w-full justify-center">{children}</main>

      <div className="absolute bottom-6 left-1/2 z-1 -translate-x-1/2 text-[13px] whitespace-nowrap text-brand max-[820px]:bottom-3.5">
        Сайт розроблено в AO Studio
      </div>
    </div>
  );
}
