import { notFound } from "next/navigation";

// Any address of the admin panel that is not one of its screens: the 404 of the panel
// ((panel)/not-found.tsx), with the menu of the panel around it
export default function MissingAdminPage() {
  notFound();
}
