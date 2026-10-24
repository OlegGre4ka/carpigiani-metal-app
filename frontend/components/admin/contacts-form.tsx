"use client";

import { App, Button, Input, InputNumber, Segmented } from "antd";
import { MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { useLeaveGuard } from "./leave-guard";
import { Field, Hint } from "./page-block-editors";
import { AdminLoader } from "@/components/cone-loader";
import { SiteMap } from "@/components/site-map";

// "Contacts" of the admin panel: phones, email, address, hours, the point on the map and the
// email the requests go to. The same data is on the "Contacts" page, in the footer and under
// the contact form of the site. The point is put by a click on the map (or by dragging the
// marker), so a new office address is changed without a programmer.

const API = "/api/admin/settings/contacts";
type Lang = "uk" | "en";
type Text = { uk: string; en: string };
type Contacts = {
  phones: { label: string }[];
  email: string;
  company: Text;
  street: Text;
  city: Text;
  hours: Text;
  lat: number;
  lng: number;
  requests_email: string;
};

const panel =
  "mb-4.5 rounded-[30px] bg-[rgba(255,253,248,0.94)] px-7 py-6.5 shadow-[0_14px_40px_rgba(90,60,40,0.08)] max-[700px]:px-4.5 max-[700px]:py-5";
const heading = "mb-3.5 font-heading text-[28px] font-bold text-caramel";

export function ContactsForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [data, setData] = useState<Contacts | null>(null);
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>("uk");
  // Address search on the map
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ label: string; lat: number; lng: number }[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    call(API)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response));
        setData(await response.json());
      })
      .catch((error) => {
        if (error instanceof Error && error.message !== "logged out") setFailed(true);
      });
  }, [call]);

  useLeaveGuard(dirty);

  const change = (next: Partial<Contacts>) => {
    setData((current) => (current ? { ...current, ...next } : current));
    setDirty(true);
  };

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const response = await call(
        API,
        json("PUT", { ...data, phones: data.phones.map((p) => ({ label: p.label.trim() })).filter((p) => p.label) }),
      );
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      setData(await response.json());
      setDirty(false);
      message.success("Контакти збережено");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
    } finally {
      setSaving(false);
    }
  }

  async function search() {
    // Empty field: the address of the office, without the office number (the map does not know it)
    const fromAddress = [data?.street.uk, data?.city.uk]
      .filter(Boolean)
      .join(", ")
      .replace(/,?\s*(оф\.?|офіс)\s*[\w-]+/giu, "");
    const text = (query || fromAddress).trim();
    if (text.length < 3) return;
    setQuery(text);
    setSearching(true);
    try {
      const response = await call(`${API.replace("/contacts", "/geocode")}?${new URLSearchParams({ q: text })}`);
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      const places: { label: string; lat: number; lng: number }[] = await response.json();
      setFound(places);
      // One place: the cone goes there at once
      if (places.length === 1) pickPlace(places[0]);
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося знайти. Перевірте зв'язок.");
    } finally {
      setSearching(false);
    }
  }

  function pickPlace(place: { lat: number; lng: number }) {
    change({ lat: Number(place.lat.toFixed(6)), lng: Number(place.lng.toFixed(6)) });
  }

  if (failed) {
    return <div className="rounded-[28px] bg-white/75 p-8 text-cocoa-soft">Не вдалося завантажити контакти. Оновіть сторінку.</div>;
  }
  if (!data) return <AdminLoader />;

  const text = (key: "company" | "street" | "city" | "hours", label: string, placeholder: Text) => (
    <Field label={`${label} (${lang === "uk" ? "UA" : "EN"})`}>
      <Input
        value={data[key][lang]}
        maxLength={200}
        placeholder={lang === "en" && data[key].uk ? data[key].uk : placeholder[lang]}
        onChange={(e) => change({ [key]: { ...data[key], [lang]: e.target.value } })}
      />
    </Field>
  );

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[40px] leading-tight font-bold text-caramel motion-safe:animate-fade-up max-[600px]:text-[32px]">Контакти</h1>
          <p className="mt-1.5 max-w-[62ch] text-cocoa-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Показуються на сторінці «Контакти», у футері всіх сторінок і під формою зв&apos;язку.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="large" href="/contacts" target="_blank">
            Переглянути на сайті
          </Button>
          <Button type="primary" size="large" loading={saving} onClick={save}>
            Зберегти
          </Button>
        </div>
      </div>

      <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]`}>
        <h2 className={heading}>Телефони й пошта</h2>
        <div className="flex flex-col gap-2.5">
          {data.phones.map((phone, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={phone.label}
                maxLength={30}
                placeholder="+38 044 465 5543"
                aria-label={`Телефон ${index + 1}`}
                onChange={(e) => change({ phones: data.phones.map((p, i) => (i === index ? { label: e.target.value } : p)) })}
              />
              <Button
                type="text"
                danger
                aria-label="Прибрати телефон"
                disabled={data.phones.length === 1}
                icon={<Trash2 size={17} />}
                onClick={() => change({ phones: data.phones.filter((_, i) => i !== index) })}
              />
            </div>
          ))}
        </div>
        {data.phones.length < 4 && (
          <Button className="mt-2.5" icon={<Plus size={16} />} onClick={() => change({ phones: [...data.phones, { label: "" }] })}>
            Додати телефон
          </Button>
        )}
        <div className="mt-4.5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <Field label="Email на сайті">
            <Input value={data.email} maxLength={254} placeholder="info@carpigiani.com.ua" onChange={(e) => change({ email: e.target.value })} />
          </Field>
          <Field label="Куди надсилати заявки (на сайті не видно)">
            <Input
              value={data.requests_email}
              maxLength={254}
              placeholder="info@carpigiani.com.ua"
              onChange={(e) => change({ requests_email: e.target.value })}
            />
          </Field>
        </div>
        <Hint>Усі заявки з форми також зберігаються в розділі «Заявки», навіть якщо лист не дійде.</Hint>
      </section>

      <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]`}>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-[28px] font-bold text-caramel">Адреса й графік</h2>
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            options={[
              { value: "uk", label: "Українська" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          {text("company", "Компанія", { uk: "ТОВ «ХОЛОД»", en: "KHOLOD LLC" })}
          {text("street", "Вулиця, будинок, офіс", { uk: "вул. Шумського, 1, оф. 317", en: "1 Shumskoho St, office 317" })}
          {text("city", "Місто, індекс", { uk: "Київ, 02098", en: "Kyiv, 02098, Ukraine" })}
          {text("hours", "Графік роботи", { uk: "Пн–Пт: 9:00–18:00", en: "Mon–Fri: 9:00–18:00" })}
        </div>
        <Hint>Де англійського тексту немає, на /en буде український.</Hint>
      </section>

      <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:200ms]`}>
        <h2 className={heading}>Точка на мапі</h2>
        <Field label="Знайти адресу на мапі">
          <div className="flex gap-2 max-[560px]:flex-col">
            <Input
              value={query}
              maxLength={200}
              placeholder={[data.street.uk, data.city.uk].filter(Boolean).join(", ") || "Київ, вулиця Юрія Шумського, 1"}
              onChange={(e) => setQuery(e.target.value)}
              onPressEnter={search}
            />
            <Button type="primary" icon={<Search size={16} />} loading={searching} onClick={search}>
              Знайти
            </Button>
          </div>
        </Field>
        {found && found.length === 0 && (
          <p className="mt-2 text-sm text-[#8a3424]">Нічого не знайдено. Спробуйте інакше (наприклад, «Київ, Шумського 1») або поставте точку кліком.</p>
        )}
        {found && found.length > 1 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {found.map((place) => (
              <li key={`${place.lat},${place.lng}`}>
                <button
                  type="button"
                  onClick={() => pickPlace(place)}
                  className={`flex w-full items-start gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-sand ${
                    Math.abs(place.lat - data.lat) < 1e-6 && Math.abs(place.lng - data.lng) < 1e-6 ? "border-caramel bg-sand" : "border-cocoa/12 bg-white"
                  }`}
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-caramel" aria-hidden="true" />
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3.5 mb-3 flex items-start gap-2 rounded-2xl bg-sand px-4 py-3 text-sm text-[#5d4838]">
          <MapPin size={17} className="mt-0.5 shrink-0 text-caramel" aria-hidden="true" />
          Знайдіть адресу або клікніть на мапі там, де офіс; ріжок можна перетягнути. Колесом мишки мапа збільшується після
          першого кліку. Потім натисніть «Зберегти контакти».
        </p>
        <SiteMap
          lat={data.lat}
          lng={data.lng}
          label={data.street.uk}
          onPick={(lat, lng) => change({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })}
          className="h-105 rounded-[24px] max-[700px]:h-80"
        />
        <div className="mt-3.5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <Field label="Широта">
            <InputNumber className="w-full!" value={data.lat} min={-90} max={90} step={0.0001} onChange={(lat) => lat !== null && change({ lat })} />
          </Field>
          <Field label="Довгота">
            <InputNumber className="w-full!" value={data.lng} min={-180} max={180} step={0.0001} onChange={(lng) => lng !== null && change({ lng })} />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-4 z-5 mt-4.5 flex items-center justify-end gap-3.5 rounded-full border border-white bg-[rgba(255,252,246,0.95)] px-4.5 py-3.5 shadow-[0_14px_40px_rgba(90,60,40,0.18)] max-[700px]:bottom-3 max-[700px]:rounded-[26px] max-[700px]:p-2.5">
        <span role="status" className="mr-auto pl-2.5 text-sm text-cocoa-soft max-[700px]:sr-only">
          {dirty ? "Зміни ще не збережено" : "Усі зміни збережено"}
        </span>
        <Button type="primary" size="large" loading={saving} onClick={save} className="max-[700px]:flex-1">
          Зберегти контакти
        </Button>
      </div>
    </div>
  );
}
