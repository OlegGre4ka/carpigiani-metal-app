"use client";

import { Input, Select, Switch } from "antd";

import { Field, Hint, TextInput, type Lang, type Text } from "./page-block-editors";
import type { Topic } from "./news-topics";

// Settings of a page of the "Support" menu, at the top of its builder (4.11): its address, the
// topic of news shown on it (the articles at the bottom and in the menu on the right) and the
// "contact us" card on the right (its title and text above the contact form).

/** The list of support pages in the admin panel */
export const SUPPORT_PATH = "/fofkas-adminpanel/support";

export type SupportMeta = {
  href: string;
  topic_id: number | null;
  is_visible: boolean;
  contact_title: Text;
  contact_text: Text;
};

export function SupportFields({
  meta,
  lang,
  topics,
  onChange,
}: {
  meta: SupportMeta;
  lang: Lang;
  topics: Topic[];
  onChange: (meta: SupportMeta) => void;
}) {
  const set = (next: Partial<SupportMeta>) => onChange({ ...meta, ...next });

  return (
    <div className="flex flex-col gap-4.5">
      <div className="grid grid-cols-[1fr_1.3fr] gap-4 max-[800px]:grid-cols-1">
        <Field label="Адреса сторінки">
          <Input value={meta.href} maxLength={300} placeholder="/carpigiani-gelato-university" onChange={(e) => set({ href: e.target.value })} />
        </Field>
        <Field label="Тема новин на сторінці">
          <Select
            value={meta.topic_id ?? undefined}
            allowClear
            placeholder="Без статей"
            className="w-full"
            onChange={(value) => set({ topic_id: value ?? null })}
            options={topics.map((topic) => ({ value: topic.id, label: topic.title_uk }))}
          />
        </Field>
      </div>
      <Hint>
        Статті цієї теми з «Новин» показуються внизу сторінки й у меню праворуч. Нову статтю можна додати прямо тут, у
        блоці «Статті теми» внизу, — вона з&apos;явиться і в «Новинах».
      </Hint>

      <div className="rounded-2xl bg-mist/60 px-4 py-3.5">
        <p className="mb-2.5 text-sm font-extrabold text-ink">Картка «Зв&apos;язатися з нами» праворуч</p>
        <div className="flex flex-col gap-3">
          <Field label={lang === "uk" ? "Заголовок картки (UA)" : "Заголовок картки (EN)"}>
            <TextInput value={meta.contact_title} lang={lang} onChange={(contact_title) => set({ contact_title })} />
          </Field>
          <Field label={lang === "uk" ? "Текст під заголовком (UA)" : "Текст під заголовком (EN)"}>
            <Input.TextArea
              value={meta.contact_text[lang]}
              maxLength={600}
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder={lang === "en" && meta.contact_text.uk ? meta.contact_text.uk : undefined}
              onChange={(e) => set({ contact_text: { ...meta.contact_text, [lang]: e.target.value } })}
            />
          </Field>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-ink">
        <Switch checked={meta.is_visible} onChange={(is_visible) => set({ is_visible })} />
        Показувати на сайті (у меню «Підтримка»)
      </label>
    </div>
  );
}
