// Every category belongs to one brand: Carpigiani (equipment), IFI or ISA (showcases).
// The admin panel has the same list of categories (and the same pages under it) for each brand;
// only the place in the menu, the texts and the ready addresses differ.

export type Brand = "carpigiani" | "ifi" | "isa";

type BrandInfo = {
  /** Where its categories are in the admin panel; their pages are under it: <base>/<id>/... */
  base: string;
  title: string;
  /** Small caption under the title */
  caption: string;
  /** Where the cards of its categories are on the site */
  shownOn: string;
  /** Ready addresses of category pages (from the old site), offered in the "Address" field */
  pageOptions: { value: string; label: string }[];
  /** Example names in the form */
  examples: { uk: string; en: string; href: string };
};

export const brands: Record<Brand, BrandInfo> = {
  carpigiani: {
    base: "/fofkas-adminpanel/equipment",
    title: "Обладнання для виробництва морозива",
    caption: "(Категорії обладнання)",
    shownOn: "на головній сторінці і на сторінці /carpigiani",
    pageOptions: [
      { value: "/gelato", label: "/gelato · Італійське морозиво" },
      { value: "/soft", label: "/soft · М'яке морозиво" },
      { value: "/stick", label: "/stick · Морозиво на паличці" },
      { value: "/restaurant", label: "/restaurant · Для ресторану" },
      { value: "/pastry", label: "/pastry · Для кондитерської" },
      { value: "/fast-food", label: "/fast-food · Для фастфуду" },
      { value: "/carpigiani", label: "/carpigiani · Обладнання Carpigiani" },
    ],
    examples: { uk: "Італійське морозиво Gelato", en: "Italian Gelato", href: "/gelato" },
  },
  ifi: {
    base: "/fofkas-adminpanel/showcases/ifi",
    title: "Вітрини IFI",
    caption: "(Категорії вітрин)",
    shownOn: "на сторінці /ifi",
    pageOptions: [
      { value: "/ifi-gelato-cases", label: "/ifi-gelato-cases · Класичні вітрини для морозива" },
      { value: "/ifi-panorama-pozzetti", label: "/ifi-panorama-pozzetti · Вітрини Panorama і Pozzetti" },
      { value: "/ifi-pastry-cases", label: "/ifi-pastry-cases · Кондитерські та інші вітрини" },
    ],
    examples: { uk: "Класичні вітрини для морозива", en: "Classic Gelato Display Cases", href: "/ifi-gelato-cases" },
  },
  isa: {
    base: "/fofkas-adminpanel/showcases/isa",
    title: "Вітрини ISA",
    caption: "(Категорії вітрин)",
    shownOn: "на сторінці /isa",
    pageOptions: [
      { value: "/isa-professional", label: "/isa-professional" },
      { value: "/isa-promotional", label: "/isa-promotional" },
      { value: "/isa-pozzetti", label: "/isa-pozzetti" },
    ],
    examples: { uk: "Професійні вітрини", en: "Professional Display Cases", href: "/isa-professional" },
  },
};

/** Brand of a category as the server sends it (old answers without it are Carpigiani) */
export function brandOf(value: string | undefined): Brand {
  return value === "ifi" || value === "isa" ? value : "carpigiani";
}
