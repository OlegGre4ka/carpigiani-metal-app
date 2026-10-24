import { getImageProps } from "next/image";

// Background for all login forms: brand emboss (wave + cone) at the bottom right.
// Separate pictures for desktop and phone; the browser loads only the one it needs.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const common = { alt: "", sizes: "100vw", fetchPriority: "high" as const };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: "/images/admin/emboss-desktop.webp", width: 1800, height: 555 });
  const {
    props: { srcSet: phone, ...rest },
  } = getImageProps({ ...common, src: "/images/admin/emboss-phone.webp", width: 900, height: 1097 });

  return (
    <div className="relative flex min-h-dvh items-center overflow-hidden bg-[#f6ead6] px-[8vw] py-12 text-cocoa max-[820px]:items-start max-[820px]:px-4 max-[820px]:pt-7 max-[820px]:pb-50">
      <picture>
        <source media="(max-width: 820px)" srcSet={phone} />
        <source media="(min-width: 821px)" srcSet={desktop} />
        <img
          {...rest}
          alt=""
          className="absolute inset-0 size-full object-cover object-bottom-right"
        />
      </picture>

      <main className="relative z-1 flex w-full">{children}</main>

      <div className="absolute bottom-6 left-[8vw] z-1 text-[13px] text-caramel max-[820px]:bottom-3.5 max-[820px]:left-4">
        Сайт розроблено в AO Studio
      </div>
    </div>
  );
}
