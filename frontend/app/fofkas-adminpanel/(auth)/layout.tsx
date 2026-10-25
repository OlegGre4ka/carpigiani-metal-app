import { BrandMark } from "@/components/brand-logo";

// Background for all login forms: soft blue glows and a big faint brand mark at the bottom right.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center overflow-hidden bg-page px-[8vw] py-12 text-ink max-[820px]:items-start max-[820px]:px-4 max-[820px]:pt-7 max-[820px]:pb-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_85%_80%,rgb(var(--brand-light-rgb)/0.22),transparent_70%),radial-gradient(40%_50%_at_0%_0%,rgb(var(--brand-rgb)/0.08),transparent_70%)]"
      />
      <BrandMark className="pointer-events-none absolute -right-10 -bottom-24 h-[min(90vh,720px)] w-auto opacity-[0.12] max-[820px]:-right-16 max-[820px]:h-80" />

      <main className="relative z-1 flex w-full">{children}</main>

      <div className="absolute bottom-6 left-[8vw] z-1 text-[13px] text-brand max-[820px]:bottom-3.5 max-[820px]:left-4">
        Сайт розроблено в AO Studio
      </div>
    </div>
  );
}
