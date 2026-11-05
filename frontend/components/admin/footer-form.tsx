"use client";

import { App, Button, Input, Segmented, Select, Switch } from "antd";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { TranslateButton } from "./ai-translate";
import { useLeaveGuard } from "./leave-guard";
import { Field, Hint, PhotoEditor, TextInput, type Lang, type Text, type Uploader } from "./page-block-editors";
import { AdminLoader } from "@/components/cone-loader";
import { NETWORKS, SocialIcon, type Network } from "@/components/social-icons";

// "Загальні налаштування" → "Футер" (5.11): the footer of every page of the site. The client
// changes the text under the name of the company, the logo (none: the cone of the site), the
// socials, the order of the blocks and which are shown, and the block "Links" (hidden at first).
// The name, the address, the phones and the email are in "Contacts" (one place for them).
// Data: backend/app/routers/settings_router.py (footer).

const API = "/api/admin/settings/footer";

type BlockKey = "company" | "address" | "contacts" | "links";
type Footer = {
  about: Text;
  logo: string;
  socials: { network: Network; url: string; visible: boolean }[];
  blocks: { key: BlockKey; visible: boolean }[];
  links_title: Text;
  links: { title: Text; href: string }[];
};

const BLOCKS: Record<BlockKey, { title: string; text: string }> = {
  company: { title: "Про компанію", text: "Лого, назва компанії й текст під нею" },
  address: { title: "Адреса й соцмережі", text: "Адреса з «Контактів», під нею значки соцмереж" },
  contacts: { title: "Телефони й пошта", text: "З розділу «Контакти»" },
  links: { title: "Посилання", text: "Свій список посилань (видно, коли є хоча б одне)" },
};

const MAX_SOCIALS = 10;
const MAX_LINKS = 10;

const panel =
  "mb-4.5 rounded-[30px] bg-[rgb(var(--paper-rgb)/0.94)] px-7 py-6.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:px-4.5 max-[700px]:py-5";
const heading = "mb-3.5 font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink";
const row = "flex items-center gap-2 rounded-2xl bg-mist/60 px-3 py-2.5 max-[700px]:flex-wrap";

/** The list with the item moved one place up or down */
function moved<T>(list: T[], index: number, step: -1 | 1): T[] {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + step, 0, item);
  return next;
}

/** "Up" and "down" buttons of a row, as in the other lists of the admin panel */
function OrderButtons({ index, count, onMove }: { index: number; count: number; onMove: (step: -1 | 1) => void }) {
  return (
    <span className="flex shrink-0 gap-1">
      <Button type="text" aria-label="Вище" disabled={index === 0} icon={<ArrowUp size={17} />} onClick={() => onMove(-1)} />
      <Button type="text" aria-label="Нижче" disabled={index === count - 1} icon={<ArrowDown size={17} />} onClick={() => onMove(1)} />
    </span>
  );
}

function Section({ title, delay, children, aside }: { title: string; delay: number; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className={`${panel} motion-safe:animate-fade-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`${heading} mb-0!`}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function FooterForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [data, setData] = useState<Footer | null>(null);
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>("uk");

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

  const change = (next: Partial<Footer>) => {
    setData((current) => (current ? { ...current, ...next } : current));
    setDirty(true);
  };

  const upload: Uploader = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.append("image", file);
      try {
        const response = await call(`${API}/logo`, { method: "POST", body });
        if (!response.ok) {
          message.error(await readError(response));
          return null;
        }
        return ((await response.json()) as { url: string }).url;
      } catch {
        return null;
      }
    },
    [call, message],
  );

  async function save() {
    if (!data) return;
    // Empty rows are not saved
    const socials = data.socials.map((s) => ({ ...s, url: s.url.trim() })).filter((s) => s.url);
    const links = data.links.map((l) => ({ ...l, href: l.href.trim() })).filter((l) => l.href);
    setSaving(true);
    try {
      const response = await call(API, json("PUT", { ...data, socials, links }));
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      setData(await response.json());
      setDirty(false);
      message.success("Футер збережено");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
    } finally {
      setSaving(false);
    }
  }

  if (failed) {
    return <div className="rounded-[28px] bg-white/75 p-8 text-ink-soft">Не вдалося завантажити футер. Оновіть сторінку.</div>;
  }
  if (!data) return <AdminLoader />;

  const langBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented<Lang>
        value={lang}
        onChange={setLang}
        options={[
          { value: "uk", label: "Українська" },
          { value: "en", label: "English" },
        ]}
      />
      <TranslateButton
        value={data}
        onApply={(translated) => {
          change(translated);
          setLang("en");
        }}
      />
    </div>
  );

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            Футер
          </h1>
          <p className="mt-1.5 max-w-[66ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Нижня частина всіх сторінок сайту. Назва компанії, адреса, телефони й пошта беруться з розділу{" "}
            <Link href="/fofkas-adminpanel/contacts" className="font-bold text-brand hover:underline">
              «Контакти»
            </Link>
            . Останній рядок «© … · Сайт розроблено AO Studio» є завжди.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="large" href="/" target="_blank">
            Переглянути на сайті
          </Button>
          <Button type="primary" size="large" loading={saving} onClick={save}>
            Зберегти
          </Button>
        </div>
      </div>

      {/* One language bar for all the texts of the page */}
      <div className="mb-4.5 flex justify-end motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">{langBar}</div>

      <Section title="Блоки футера" delay={120}>
        <Hint>Порядок тут — порядок на сайті (зліва направо; на телефоні — згори вниз). Вимкнений блок на сайті не видно.</Hint>
        <ul className="flex flex-col gap-2">
          {data.blocks.map((block, index) => (
            <li key={block.key} className={`${row} ${block.visible ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink">{BLOCKS[block.key].title}</div>
                <div className="text-sm text-ink-soft">{BLOCKS[block.key].text}</div>
              </div>
              <OrderButtons index={index} count={data.blocks.length} onMove={(step) => change({ blocks: moved(data.blocks, index, step) })} />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={block.visible}
                  onChange={(visible) => change({ blocks: data.blocks.map((b, i) => (i === index ? { ...b, visible } : b)) })}
                />
                На сайті
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Про компанію" delay={160}>
        <Field label="Лого біля назви">
          <PhotoEditor
            block={{ id: "logo", type: "photo", visible: true, image: data.logo || null }}
            onChange={(block) => change({ logo: block.image ?? "" })}
            upload={upload}
            dark
            hint="Найкраще PNG або WebP з прозорим фоном, світле (футер темний). Не завантажили — на сайті ріжок, як зараз."
          />
        </Field>
        <Field label={`Текст під назвою (${lang === "uk" ? "UA" : "EN"})`} className="mt-4">
          <TextInput value={data.about} lang={lang} area maxLength={600} onChange={(about) => change({ about })} />
        </Field>
      </Section>

      <Section title="Соцмережі" delay={200}>
        <Hint>Значки під адресою. Оберіть мережу й вставте повне посилання на сторінку (https://…). Вимкнену на сайті не видно.</Hint>
        <ul className="flex flex-col gap-2">
          {data.socials.map((social, index) => {
            const set = (next: Partial<Footer["socials"][number]>) =>
              change({ socials: data.socials.map((s, i) => (i === index ? { ...s, ...next } : s)) });
            return (
              <li key={index} className={`${row} ${social.visible ? "" : "opacity-60"}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navbar text-white">
                  <SocialIcon network={social.network} size={17} />
                </span>
                <Select<Network>
                  value={social.network}
                  onChange={(network) => set({ network })}
                  options={NETWORKS}
                  className="w-40 shrink-0"
                  aria-label="Соцмережа"
                />
                <Input
                  value={social.url}
                  maxLength={500}
                  placeholder="https://www.instagram.com/…"
                  aria-label="Посилання"
                  onChange={(e) => set({ url: e.target.value })}
                  className="min-w-50 flex-1"
                />
                <OrderButtons index={index} count={data.socials.length} onMove={(step) => change({ socials: moved(data.socials, index, step) })} />
                <Switch checked={social.visible} aria-label="На сайті" onChange={(visible) => set({ visible })} />
                <Button
                  type="text"
                  danger
                  aria-label="Прибрати соцмережу"
                  icon={<Trash2 size={17} />}
                  onClick={() => change({ socials: data.socials.filter((_, i) => i !== index) })}
                />
              </li>
            );
          })}
        </ul>
        {data.socials.length < MAX_SOCIALS && (
          <Button
            className="mt-2.5"
            icon={<Plus size={16} />}
            onClick={() => change({ socials: [...data.socials, { network: "telegram", url: "", visible: true }] })}
          >
            Додати соцмережу
          </Button>
        )}
      </Section>

      <Section title="Посилання" delay={240}>
        <Hint>
          Окремий блок футера зі своїм списком: сторінки сайту (/news) або інші сайти (https://…). Щоб він з&apos;явився на сайті,
          увімкніть його вгорі, у «Блоках футера».
        </Hint>
        <Field label={`Заголовок блоку (${lang === "uk" ? "UA" : "EN"})`}>
          <TextInput value={data.links_title} lang={lang} onChange={(links_title) => change({ links_title })} className="max-w-110" />
        </Field>
        <ul className="mt-3 flex flex-col gap-2">
          {data.links.map((item, index) => {
            const set = (next: Partial<Footer["links"][number]>) =>
              change({ links: data.links.map((l, i) => (i === index ? { ...l, ...next } : l)) });
            return (
              <li key={index} className={row}>
                <TextInput
                  value={item.title}
                  lang={lang}
                  placeholder="Назва"
                  aria-label="Назва посилання"
                  onChange={(title) => set({ title })}
                  className="min-w-40 flex-1"
                />
                <Input
                  value={item.href}
                  maxLength={500}
                  placeholder="/news або https://…"
                  aria-label="Адреса посилання"
                  onChange={(e) => set({ href: e.target.value })}
                  className="min-w-40 flex-1"
                />
                <OrderButtons index={index} count={data.links.length} onMove={(step) => change({ links: moved(data.links, index, step) })} />
                <Button
                  type="text"
                  danger
                  aria-label="Прибрати посилання"
                  icon={<Trash2 size={17} />}
                  onClick={() => change({ links: data.links.filter((_, i) => i !== index) })}
                />
              </li>
            );
          })}
        </ul>
        {data.links.length < MAX_LINKS && (
          <Button className="mt-2.5" icon={<Plus size={16} />} onClick={() => change({ links: [...data.links, { title: { uk: "", en: "" }, href: "" }] })}>
            Додати посилання
          </Button>
        )}
      </Section>

      <div className="flex justify-end">
        <Button type="primary" size="large" loading={saving} onClick={save}>
          Зберегти футер
        </Button>
      </div>
    </div>
  );
}
