"use client";

import { App, Button, Empty, Popconfirm, Segmented } from "antd";
import { ChevronDown, Mail, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { AdminLoader } from "@/components/cone-loader";

// Requests of the admin panel: everything sent from the contact form of the site, newest
// first — the same text as goes by email. A new request is marked; opening it (an accordion,
// right in the list) makes it read; it can be marked new again. Since 4.11 the list is in the
// card "Заявки" on the home page of the admin panel (no menu item of its own).

const API = "/api/admin/requests";

type Request = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  page: string;
  lang: string;
  is_read: boolean;
  created_at: string;
};

/** "1 нова заявка", "3 нові заявки", "5 нових заявок" */
function newRequests(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return "нова заявка";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "нові заявки";
  return "нових заявок";
}

/** "23.10.2026, 21:05" in Kyiv time */
function when(iso: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(new Date(iso));
}

export function RequestsList() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [items, setItems] = useState<Request[] | null>(null);
  const [filter, setFilter] = useState<"all" | "new">("all");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    call(API)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response));
        setItems((await response.json()).items);
      })
      .catch((error) => {
        if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити заявки");
      });
  }, [call, message]);

  async function mark(item: Request, isRead: boolean) {
    setItems((list) => list?.map((r) => (r.id === item.id ? { ...r, is_read: isRead } : r)) ?? null);
    const response = await call(`${API}/${item.id}`, json("PATCH", { is_read: isRead }));
    if (!response.ok) message.error(await readError(response));
    // The number of new requests is on the home page of the admin panel
    router.refresh();
  }

  async function remove(item: Request) {
    const response = await call(`${API}/${item.id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((list) => list?.filter((r) => r.id !== item.id) ?? null);
      message.success("Заявку видалено");
      router.refresh();
    } else message.error(await readError(response));
  }

  function toggle(item: Request) {
    const opening = open !== item.id;
    setOpen(opening ? item.id : null);
    if (opening && !item.is_read) mark(item, true);
  }

  if (!items) return <AdminLoader />;
  const fresh = items.filter((r) => !r.is_read).length;
  const shown = filter === "new" ? items.filter((r) => !r.is_read) : items;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] leading-none font-extrabold text-brand">{fresh}</span>
          <span className="text-sm font-semibold text-ink-soft">{newRequests(fresh)}</span>
        </div>
        <Segmented
          value={filter}
          onChange={(value) => setFilter(value as "all" | "new")}
          options={[
            { value: "all", label: `Усі (${items.length})` },
            { value: "new", label: `Нові (${fresh})` },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-ink/20 p-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === "new" ? "Нових заявок немає." : "Заявок поки немає. Вони з'являться тут, щойно хтось заповнить форму на сайті."}
          />
        </div>
      ) : (
        // A long list scrolls inside the card
        <ul className="-mx-1 flex max-h-[560px] flex-col gap-2.5 overflow-y-auto overscroll-contain px-1 pb-1">
          {shown.map((item) => {
            const expanded = open === item.id;
            return (
              <li
                key={item.id}
                className={`shrink-0 overflow-hidden rounded-[20px] border bg-white shadow-[0_6px_16px_rgb(var(--shadow-rgb)/0.06)] ${
                  item.is_read ? "border-white/90" : "border-brand-light/60"
                }`}
              >
                <button type="button" onClick={() => toggle(item)} aria-expanded={expanded} className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left max-[700px]:flex-wrap max-[700px]:gap-2">
                  <span
                    aria-label={item.is_read ? "Переглянута" : "Нова"}
                    className={`size-2.5 shrink-0 rounded-full ${item.is_read ? "bg-ink/15" : "bg-brand shadow-[0_0_0_4px_rgb(var(--brand-light-rgb)/0.2)]"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate ${item.is_read ? "font-semibold" : "font-extrabold"}`}>
                      {item.name || item.email}
                      {item.subject && <span className="font-semibold text-ink-soft"> · {item.subject}</span>}
                    </b>
                    <span className="block truncate text-sm text-ink-soft">{item.message || "(без повідомлення)"}</span>
                  </span>
                  <span className="shrink-0 text-[13px] whitespace-nowrap text-ink-soft">{when(item.created_at)}</span>
                  <ChevronDown aria-hidden="true" className={`size-4.5 shrink-0 text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-ink/8 px-4 pt-4 pb-4.5">
                    <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-[15px] max-[700px]:grid-cols-1 max-[700px]:gap-y-0.5">
                      <dt className="font-bold text-ink-soft">Ім&apos;я</dt>
                      <dd className="mb-1.5">{item.name || "—"}</dd>
                      <dt className="font-bold text-ink-soft">Email</dt>
                      <dd className="mb-1.5">
                        <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">
                          <Mail size={15} aria-hidden="true" /> {item.email}
                        </a>
                      </dd>
                      <dt className="font-bold text-ink-soft">Телефон</dt>
                      <dd className="mb-1.5">
                        {item.phone ? (
                          <a href={`tel:${item.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">
                            <Phone size={15} aria-hidden="true" /> {item.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                      {item.subject && (
                        <>
                          <dt className="font-bold text-ink-soft">Запит щодо</dt>
                          <dd className="mb-1.5">{item.subject}</dd>
                        </>
                      )}
                      {item.page && (
                        <>
                          <dt className="font-bold text-ink-soft">Сторінка</dt>
                          <dd className="mb-1.5">
                            <a href={item.page} target="_blank" rel="noopener" className="font-bold text-brand hover:underline">
                              {item.page}
                            </a>
                            {item.lang === "en" && <span className="ml-2 text-sm text-ink-soft">(англійська версія)</span>}
                          </dd>
                        </>
                      )}
                      <dt className="font-bold text-ink-soft">Повідомлення</dt>
                      <dd className="whitespace-pre-wrap">{item.message || "—"}</dd>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => mark(item, !item.is_read)}>{item.is_read ? "Позначити новою" : "Позначити переглянутою"}</Button>
                      <Popconfirm
                        title="Видалити заявку?"
                        description="Заявка зникне назавжди."
                        okText="Видалити"
                        cancelText="Скасувати"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(item)}
                      >
                        <Button danger icon={<Trash2 size={16} />}>
                          Видалити
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
