"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_PATH, SESSION_COOKIE, backendFetch } from "@/lib/admin/backend";
import { type FormState, fieldErrors, forgotSchema, loginSchema, resetSchema } from "@/lib/admin/schemas";

const SERVER_DOWN = "Сервер не відповідає. Спробуйте ще раз за хвилину.";
const TOO_MANY = "Забагато спроб. Спробуйте ще раз за 15 хвилин.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  let response: Response;
  try {
    response = await backendFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { error: SERVER_DOWN };
  }

  if (response.status === 401) return { error: "Неправильна пошта або пароль" };
  if (response.status === 429) return { error: TOO_MANY };
  if (!response.ok) return { error: SERVER_DOWN };

  // FastAPI gives the token in its cookie; keep it in our own httpOnly cookie on the site's domain
  const raw = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  const token = raw
    ?.slice(SESSION_COOKIE.length + 1)
    .split(";")[0]
    .replace(/^"|"$/g, "")
    .replace(/^Bearer\s+/, "");
  if (!token) return { error: SERVER_DOWN };

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect(ADMIN_PATH);
}

export async function forgotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  try {
    const response = await backendFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 429) return { error: TOO_MANY };
    if (!response.ok) return { error: SERVER_DOWN };
  } catch {
    return { error: SERVER_DOWN };
  }
  // Same result for any email: nobody can find out which emails exist
  return { ok: true };
}

export async function resetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  try {
    const response = await backendFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: String(formData.get("token") ?? ""), password: parsed.data.password }),
    });
    if (response.status === 400 || response.status === 422) {
      return { error: "Посилання недійсне або застаріло. Надішліть новий лист." };
    }
    if (response.status === 429) return { error: TOO_MANY };
    if (!response.ok) return { error: SERVER_DOWN };
  } catch {
    return { error: SERVER_DOWN };
  }
  return { ok: true };
}
