import "server-only";

// The Next.js server talks to the API directly
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type EquipmentCategory = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  image_url: string;
  /** Its page shows something besides the title: the card and the menu item lead to it.
   *  false: shown as plain text (29.10) */
  has_page?: boolean;
};

/** Whose categories: the key of the brand ("carpigiani", "ifi", "isa" or a brand added in the admin panel) */
export type Brand = string;

/** A brand shown on the site (the admin panel → "Виробники"), in the admin order */
export type SiteBrand = {
  key: string;
  title_uk: string;
  title_en: string;
  /** Its page: "/ifi" */
  href: string;
  logo_url: string | null;
};

/** Visible brands for the "Manufacturers" and "Equipment catalog" menus; hidden ones are not sent */
export async function loadSiteBrands(): Promise<SiteBrand[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/brands`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as SiteBrand[];
  } catch {
    // API is not reachable: nothing is shown
    return [];
  }
}

/** Categories of one brand shown on the site (only the ones marked "show"), in the admin order.
 *  Carpigiani: the cards on the home page and /carpigiani and the "Equipment catalog" menu;
 *  IFI / ISA: the cards on /ifi and /isa. */
export async function loadEquipmentCategories(brand: Brand = "carpigiani"): Promise<EquipmentCategory[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/equipment-categories?brand=${brand}`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as EquipmentCategory[];
  } catch {
    // API is not reachable: nothing is shown
    return [];
  }
}
