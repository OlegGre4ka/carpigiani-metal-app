// Brands (manufacturers) come from the database: the admin adds, edits, hides and deletes them
// on the "Виробники" page. Each brand has its own section in the menu on the left with its
// categories → subcategories → equipment, all under /fofkas-adminpanel/brands/<key>.

/** A brand as the admin API sends it */
export type AdminBrand = {
  id: number;
  /** Address of its page on the site without "/": "ifi" */
  key: string;
  title_uk: string;
  title_en: string;
  /** Its page on the site: "/ifi" */
  href: string;
  logo_url: string | null;
  sort_order: number;
  is_visible: boolean;
  categories_count: number;
  /** Its page shows something (a block, category cards, equipment): until then the brand is
   *  nowhere on the site, not even in the menus */
  has_content: boolean;
};

/** The "Виробники" page (list of brands) */
export const BRANDS_PATH = "/fofkas-adminpanel/brands";

/** Section of one brand in the admin panel; its categories are under it: <base>/<id>/... */
export const brandBase = (key: string | undefined) => `${BRANDS_PATH}/${key || "carpigiani"}`;
