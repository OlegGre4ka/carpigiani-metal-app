// Addresses from the site menu and the slider whose pages are not made yet.
// Until then they show "This page is being prepared" instead of the 404 error.
// When a real page is made (its own folder in app/[locale]), remove its line here.
// Value: where the page title is taken from in the translation files.
export const comingSoonPages: Record<string, string> = {
  // Slider
  maestro: "Slider.maestro.title",
  "ifi-lunette": "Slider.lunette.title",
  "carpigiani-gelato-university": "Slider.university.title",
  ready: "Slider.ready.title",

  // Main menu
  support: "Nav.support",
  "gelato-crystal": "SupportMenu.gelatoCrystal",
  project: "SupportMenu.project",
  service: "SupportMenu.service",

  // Catalog: Carpigiani
  gelato: "Catalog.gelato",
  soft: "Catalog.soft",
  stick: "Catalog.stick",
  restaurant: "Catalog.restaurant",
  pastry: "Catalog.pastry",
  "fast-food": "Catalog.fastFood",

  // Catalog: IFI
  ifi: "Catalog.ifi",
  "ifi-gelato-cases": "Catalog.ifiGelatoCases",
  "ifi-panorama-pozzetti": "Catalog.ifiPanoramaPozzetti",
  "ifi-pastry-cases": "Catalog.ifiPastryCases",

  // Catalog: ISA
  isa: "Catalog.isa",
  "isa-professional": "Catalog.isaProfessional",
  "isa-promotional": "Catalog.isaPromotional",
};
