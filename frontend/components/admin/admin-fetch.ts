"use client";

import { useCallback } from "react";

// Shared by the news screens of the admin panel: a call to FastAPI through /api/...
// (the login cookie goes along) that goes back to the login page when the login has expired,
// and the text of an error the server sent.

export function useAdminCall() {
  return useCallback(async (input: string, init?: RequestInit) => {
    const response = await fetch(input, init);
    if (response.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose: logout is a server route that clears the cookie
      window.location.href = "/fofkas-adminpanel/logout";
      throw new Error("logged out");
    }
    return response;
  }, []);
}

export const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Text of an error from FastAPI (a sentence, or the first problem of a wrong field) */
export async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) return String(data.detail[0].msg ?? "").replace(/^Value error, /, "");
  } catch {}
  return "Щось пішло не так. Спробуйте ще раз.";
}

/** "2023-05-23" → "23.05.2023" */
export function shortDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

/** "1 новина", "3 новини", "5 новин" */
export function newsCount(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} новина`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} новини`;
  return `${n} новин`;
}
