import { z } from "zod";

// Rules of the contact form of the site (one form in two places: the "Contact us" window and
// the form on equipment pages). Email is required, everything else is optional.
// Error texts come from the translation files. The server checks again (backend/app/schemas/contact.py).
export function contactSchema(messages: { email: string; phone: string }) {
  return z.object({
    name: z.string().trim().max(100),
    email: z.string().trim().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, messages.email).max(254, messages.email),
    // Empty, or 7–25 characters: digits, spaces, brackets, dashes and a leading "+"
    phone: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\+?[\d\s()-]{7,25}$/.test(value), messages.phone),
    message: z.string().trim().max(2000),
  });
}

export type ContactValues = { name: string; email: string; phone: string; message: string };
