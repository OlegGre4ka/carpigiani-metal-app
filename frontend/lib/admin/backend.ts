import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { brandBase, type AdminBrand } from "@/lib/admin/brands";

// The Next.js server talks to FastAPI directly; the browser never sees this address.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const ADMIN_PATH = "/fofkas-adminpanel";
export const SESSION_COOKIE = "access_token";

/** Call the API from the server. Passes the visitor's address (for attempt limits) and the login cookie. */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("Content-Type", "application/json");

  const incoming = await headers();
  const ip = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
  if (ip) requestHeaders.set("X-Forwarded-For", ip);

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) requestHeaders.set("Cookie", `${SESSION_COOKIE}=${token}`);

  return fetch(`${BACKEND_URL}${path}`, { ...init, headers: requestHeaders, cache: "no-store" });
}

export type AdminUser = { email: string; role: string };

/** The logged-in admin, or null when the login cookie is missing or expired. Asked once per page. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const response = await backendFetch("/api/auth/me");
    if (!response.ok) return null;
    return (await response.json()) as AdminUser;
  } catch {
    return null;
  }
});

/** All brands (also hidden ones), in order: the sections of the menu on the left. Asked once per page. */
export const getAdminBrands = cache(async (): Promise<AdminBrand[]> => {
  try {
    const response = await backendFetch("/api/admin/brands");
    return response.ok ? ((await response.json()) as AdminBrand[]) : [];
  } catch {
    return [];
  }
});

/** Menu item of a category (under the section of its brand), with its subcategories */
export type MenuCategory = {
  href: string;
  title: string;
  brand: string;
  children: { href: string; title: string }[];
};

/** Categories and their subcategories for the menu on the left. Asked once per page. */
export const getMenuCategories = cache(async (): Promise<MenuCategory[]> => {
  try {
    const [categories, subcategories] = await Promise.all([
      backendFetch("/api/admin/equipment-categories"),
      backendFetch("/api/admin/subcategories"),
    ]);
    if (!categories.ok || !subcategories.ok) return [];
    const categoryList: { id: number; title_uk: string; brand?: string }[] = await categories.json();
    const subcategoryList: { id: number; category_id: number; title_uk: string }[] = await subcategories.json();
    return categoryList.map((category) => {
      const brand = category.brand ?? "carpigiani";
      const href = `${brandBase(brand)}/${category.id}`;
      return {
        href,
        title: category.title_uk,
        brand,
        children: subcategoryList
          .filter((sub) => sub.category_id === category.id)
          .map((sub) => ({ href: `${href}/subcategories/${sub.id}`, title: sub.title_uk })),
      };
    });
  } catch {
    return [];
  }
});

/** Topics of news for the menu on the left (under "News"). Asked once per page. */
export const getMenuTopics = cache(async (): Promise<{ href: string; title: string }[]> => {
  try {
    const response = await backendFetch("/api/admin/news-topics");
    if (!response.ok) return [];
    const topics: { id: number; title_uk: string }[] = await response.json();
    return topics.map((topic) => ({ href: `${ADMIN_PATH}/news/topics/${topic.id}`, title: topic.title_uk }));
  } catch {
    return [];
  }
});
