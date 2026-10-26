import { BrandsManager } from "@/components/admin/brands-manager";

// "Виробники": the brands of the site — add, edit, logo, order, hide, delete.
// Each brand then has its own section in the menu with its categories.
export default function BrandsPage() {
  return <BrandsManager />;
}
