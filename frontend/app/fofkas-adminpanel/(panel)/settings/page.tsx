import { redirect } from "next/navigation";

// "Загальні налаштування" has no page of its own: its sub-items are in the menu (30.10).
// The card on the admin home page and old links lead to the first one.
export default function GeneralSettingsPage() {
  redirect("/fofkas-adminpanel/settings/fonts");
}
