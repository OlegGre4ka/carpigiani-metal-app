"use client";

import { App, Button } from "antd";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { useLeaveGuard } from "./leave-guard";
import { AdminLoader } from "@/components/cone-loader";
import { DEFAULT_FONT, SITE_FONTS, siteFont, type SiteFont } from "@/lib/site-fonts";

// "Загальні налаштування" of the admin panel (29.10): the font of the titles and the font of the
// texts of the whole site. Each choice is shown at once in the example on the right; the site
// changes after "Зберегти". The list of fonts: lib/site-fonts.ts.

const API = "/api/admin/settings/general";
type General = { font_title: string; font_text: string };

const panel =
  "mb-4.5 rounded-[30px] bg-[rgb(var(--paper-rgb)/0.94)] px-7 py-6.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:px-4.5 max-[700px]:py-5";
const heading = "mb-1 font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink";
const family = (font: SiteFont) => `var(${font.css}), Arial, sans-serif`;

export function GeneralSettingsForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [data, setData] = useState<General | null>(null);
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const change = (next: Partial<General>) => {
    setData((current) => (current ? { ...current, ...next } : current));
    setDirty(true);
  };

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const response = await call(API, json("PUT", data));
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      setData(await response.json());
      setDirty(false);
      message.success("Збережено — шрифти вже на сайті");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
    } finally {
      setSaving(false);
    }
  }

  if (failed) {
    return <div className="rounded-[28px] bg-white/75 p-8 text-ink-soft">Не вдалося завантажити налаштування. Оновіть сторінку.</div>;
  }
  if (!data) return <AdminLoader />;

  const title = siteFont(data.font_title);
  const text = siteFont(data.font_text, true);

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            Загальні налаштування
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Шрифти всього сайту. Оберіть — приклад праворуч зміниться одразу, а сайт — після «Зберегти».
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="large" href="/" target="_blank">
            Подивитись на сайті
          </Button>
          <Button
            size="large"
            onClick={() => change({ font_title: DEFAULT_FONT, font_text: DEFAULT_FONT })}
            disabled={data.font_title === DEFAULT_FONT && data.font_text === DEFAULT_FONT}
          >
            Як було (Inter Tight)
          </Button>
          <Button size="large" type="primary" loading={saving} disabled={!dirty} onClick={save}>
            Зберегти
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-start gap-4.5 max-[1100px]:grid-cols-1">
        <div>
          <section className={panel}>
            <h2 className={heading}>Шрифт заголовків</h2>
            <p className="mb-4 text-sm text-ink-soft">Назви сторінок, блоків і карток.</p>
            <FontChoices fonts={SITE_FONTS} value={title.key} onChange={(key) => change({ font_title: key })} sample="Фризери Carpigiani" bold />
          </section>
          <section className={panel}>
            <h2 className={heading}>Шрифт тексту</h2>
            <p className="mb-4 text-sm text-ink-soft">Описи, меню, кнопки, форми. Тут лише шрифти, які легко читати в довгому тексті.</p>
            <FontChoices
              fonts={SITE_FONTS.filter((font) => font.forText)}
              value={text.key}
              onChange={(key) => change({ font_text: key })}
              sample="Якість і сервіс"
            />
          </section>
        </div>

        {/* The example: a title and a text of the site in the chosen fonts */}
        <section className={`${panel} sticky top-24 max-[1100px]:static`}>
          <p className="mb-4 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">Так буде на сайті</p>
          <h3 className="metal-text-dark w-fit max-w-full text-[34px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ fontFamily: family(title) }}>
            Фризери для джелато
          </h3>
          <div style={{ fontFamily: family(text) }}>
            <p className="mt-3 text-[16px] leading-[1.6] text-ink-soft">
              Carpigiani — світовий лідер обладнання для морозива. Підберемо фризер під ваше виробництво, привеземо, встановимо й навчимо
              персонал.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-navbar px-5 py-2.5 text-sm font-extrabold text-white">Зв&apos;язатися з нами</span>
              <span className="text-sm font-bold text-navbar">Детальніше →</span>
            </div>
          </div>
          <p className="mt-5 border-t border-ink/8 pt-3 text-[13px] text-ink-soft">
            Заголовки: <b className="text-ink">{title.label}</b> · Текст: <b className="text-ink">{text.label}</b>
          </p>
        </section>
      </div>
    </div>
  );
}

/** The fonts as cards: the name, a few words about it and a sample in the font itself */
function FontChoices({
  fonts,
  value,
  onChange,
  sample,
  bold = false,
}: {
  fonts: SiteFont[];
  value: string;
  onChange: (key: string) => void;
  sample: string;
  bold?: boolean;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-2.5 max-[700px]:grid-cols-1">
      {fonts.map((font) => {
        const active = font.key === value;
        return (
          <button
            key={font.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(font.key)}
            className={`relative cursor-pointer rounded-[18px] border-2 px-4 py-3 text-left transition-colors ${
              active ? "border-navbar bg-mist" : "border-ink/8 bg-white hover:border-navbar/40"
            }`}
          >
            {active && (
              <span className="absolute top-2.5 right-2.5 flex size-5.5 items-center justify-center rounded-full bg-navbar text-white">
                <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
              </span>
            )}
            <span className={`block truncate pr-6 text-[18px] leading-tight text-ink ${bold ? "font-extrabold" : "font-medium"}`} style={{ fontFamily: family(font) }}>
              {sample}
            </span>
            <span className="mt-1 block text-[13px] font-extrabold text-navbar">{font.label}</span>
            <span className="block text-xs text-ink-soft">{font.note}</span>
          </button>
        );
      })}
    </div>
  );
}
