"use client";

import { App, Button, Empty, Popconfirm, Segmented } from "antd";
import { Mail, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { AdminLoader } from "@/components/cone-loader";

// "Requests" of the admin panel: everything sent from the contact form of the site, newest
// first — the same text as goes by email. A new request is marked; opening it makes it read
// (it can be marked new again). Telegram and email come later.

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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">Заявки</h1>
          <p className="mt-1.5 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Усе, що надіслали через форму на сайті. Нові зверху; відкрита заявка стає переглянутою.
          </p>
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
        <div className="rounded-[28px] steel-card p-6">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === "new" ? "Нових заявок немає." : "Заявок поки немає. Вони з'являться тут, щойно хтось заповнить форму на сайті."}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          {shown.map((item) => {
            const expanded = open === item.id;
            return (
              <li
                key={item.id}
                className={`overflow-hidden rounded-[24px] border bg-[rgb(var(--paper-rgb)/0.96)] shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.07)] ${
                  item.is_read ? "border-white/90" : "border-brand-light/60"
                }`}
              >
                <button type="button" onClick={() => toggle(item)} aria-expanded={expanded} className="flex w-full items-center gap-3.5 px-5 py-4 text-left max-[700px]:flex-wrap max-[700px]:gap-2 max-[700px]:px-4">
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
                  <span className="shrink-0 text-sm whitespace-nowrap text-ink-soft">{when(item.created_at)}</span>
                </button>
                {expanded && (
                  <div className="border-t border-ink/8 px-5 pt-4 pb-5 max-[700px]:px-4">
                    <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-[15px] max-[700px]:grid-cols-1 max-[700px]:gap-y-0.5">
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
