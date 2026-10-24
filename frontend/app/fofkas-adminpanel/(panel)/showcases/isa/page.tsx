import { EquipmentCategoriesManager } from "@/components/admin/equipment-categories-manager";

// ISA showcases: their categories, shown as cards on /isa. The same list (and the same pages
// under it) as the categories of Carpigiani equipment, only for the brand ISA.
export default function IsaShowcasesPage() {
  return <EquipmentCategoriesManager brand="isa" />;
}
