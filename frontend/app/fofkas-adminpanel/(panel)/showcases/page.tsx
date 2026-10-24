import { redirect } from "next/navigation";

// "Showcases" has no page of its own: in the menu it only opens "IFI showcases" and
// "ISA showcases". Someone who types this address goes to the IFI showcases.
export default function ShowcasesPage() {
  redirect("/fofkas-adminpanel/showcases/ifi");
}
