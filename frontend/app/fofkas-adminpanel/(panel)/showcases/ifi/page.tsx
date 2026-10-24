import { EquipmentCategoriesManager } from "@/components/admin/equipment-categories-manager";

// IFI showcases: their categories, shown as cards on /ifi. The same list (and the same pages
// under it) as the categories of Carpigiani equipment, only for the brand IFI.
export default function IfiShowcasesPage() {
  return <EquipmentCategoriesManager brand="ifi" />;
}
