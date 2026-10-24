import { z } from "zod";

// Form rules for the admin login pages. The same rules run in the browser
// (instant hints) and on the server (Server Actions), and FastAPI checks again.

const email = z
  .string()
  .trim()
  .min(1, "Введіть електронну пошту")
  .pipe(z.email("Перевірте адресу пошти"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Введіть пароль"),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
    confirm: z.string().min(1, "Повторіть пароль"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Паролі не збігаються",
    path: ["confirm"],
  });

export type FieldErrors = Partial<Record<string, string>>;

/** First error message for each field, e.g. { email: "Введіть електронну пошту" } */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** What a Server Action returns to the form */
export type FormState = {
  ok?: boolean;
  error?: string;
  fields?: FieldErrors;
};
