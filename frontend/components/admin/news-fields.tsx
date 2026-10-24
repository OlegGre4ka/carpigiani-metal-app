"use client";

import { AutoComplete, Input, Select, Switch } from "antd";

import { Field, Hint, PhotoEditor, TextInput, type Lang, type Text, type Uploader } from "./page-block-editors";
import type { Topic } from "./news-topics";
import { oldNewsPages } from "@/lib/admin/old-site-pages";

// Fields of the card of a news item, at the top of its page builder: the card in the list of
// news shows the main photo, the topic, the date, the title and the short text; the main photo
// is also at the top of the news page.

export type NewsMeta = {
  href: string;
  published_on: string;
  topic_id: number | null;
  image: string | null;
  summary: Text;
  is_visible: boolean;
};

export function NewsFields({
  meta,
  lang,
  topics,
  upload,
  onChange,
}: {
  meta: NewsMeta;
  lang: Lang;
  topics: Topic[];
  upload: Uploader;
  onChange: (meta: NewsMeta) => void;
}) {
  const set = (next: Partial<NewsMeta>) => onChange({ ...meta, ...next });

  return (
    <div className="flex flex-col gap-4.5">
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-4 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
        <Field label="Дата">
          <Input type="date" value={meta.published_on} onChange={(e) => set({ published_on: e.target.value })} />
        </Field>
        <Field label="Тема">
          {/* 0 = "Without a topic" (the list cannot hold an empty value) */}
          <Select
            className="w-full"
            value={meta.topic_id ?? 0}
            onChange={(topic: number) => set({ topic_id: topic || null })}
            options={[{ value: 0, label: "Без теми" }, ...topics.map((t) => ({ value: t.id, label: t.title_uk }))]}
          />
        </Field>
        <Field label="Адреса сторінки новини" className="max-[1100px]:col-span-2 max-[700px]:col-span-1">
          <AutoComplete
            className="w-full"
            value={meta.href}
            onChange={(href) => set({ href })}
            options={oldNewsPages.map((value) => ({ value }))}
            placeholder="/230500-back-to-roots"
            filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Field>
      </div>

      <label className="flex w-fit items-center gap-3 rounded-2xl bg-sand/70 px-4 py-2.5 text-sm font-bold text-cocoa">
        <Switch checked={meta.is_visible} onChange={(is_visible) => set({ is_visible })} />
        Показувати на сайті
      </label>

      <div>
        <span className="block text-[13px] font-extrabold text-cocoa-soft">Головне фото</span>
        <PhotoEditor
          block={{ id: "main", type: "photo", visible: true, image: meta.image }}
          onChange={(block) => set({ image: block.image })}
          upload={upload}
          hint="На картці новини і вгорі її сторінки. Найкраще горизонтальне, від 1200 px завширшки: сайт сам стисне фото."
        />
      </div>

      <Field label={`Короткий опис для картки (${lang === "uk" ? "UA" : "EN"})`}>
        <TextInput
          area
          value={meta.summary}
          lang={lang}
          maxLength={600}
          onChange={(summary) => set({ summary })}
          placeholder="Два-три речення: про що новина"
        />
      </Field>
      <Hint>На картці показуються перші три рядки опису. Фото, дата, тема й адреса спільні для обох мов.</Hint>
    </div>
  );
}
