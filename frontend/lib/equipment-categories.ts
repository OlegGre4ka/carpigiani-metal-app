import "server-only";

// The Next.js server talks to the API directly
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type EquipmentCategory = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  image_url: string;
};

/** Whose categories: Carpigiani equipment or IFI / ISA showcases */
export type Brand = "carpigiani" | "ifi" | "isa";

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
