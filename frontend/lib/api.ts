
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Item {
  id: number;
  name: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const detail = error?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const itemsApi = {
  list: () => request<Item[]>("/api/items"),

  create: (name: string) =>
    request<Item>("/api/items", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  update: (id: number, name: string) =>
    request<Item>(`/api/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  delete: (id: number) =>
    request<void>(`/api/items/${id}`, {
      method: "DELETE",
    }),
};
