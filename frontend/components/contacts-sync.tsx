"use client";

import { useEffect } from "react";

import { setPhones, type Phone } from "@/lib/contacts-store";

/** Gives the phones from the admin panel to the contact forms of the page */
export function ContactsSync({ phones }: { phones: Phone[] }) {
  useEffect(() => setPhones(phones), [phones]);
  return null;
}
