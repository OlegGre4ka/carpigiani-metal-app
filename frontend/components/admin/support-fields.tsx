"use client";

import { Input, Segmented, Select, Switch } from "antd";

import { Field, Hint, TextInput, type Lang, type Text } from "./page-block-editors";
import type { Topic } from "./news-topics";

// Settings of a page of the "Support" menu (4.11): its name in the menu, how it shows the
// articles (5.11: one open for reading, or a list with a preview on top and its own address),
// topic of news, the article of the topic shown open or in the preview, the "contact us" card
// and visibility.

/** The list of support pages in the admin panel */
export const SUPPORT_PATH = "/fofkas-adminpanel/support";

/** article: the chosen article open for reading; list: its preview on top, the others under it */
export type SupportLayout = "article" | "list";

export type SupportMeta = {
  title_uk: string;
  title_en: string;
  layout: SupportLayout;
  /** The address of a list (an article page has none) */
  href: string;
  topic_id: number | null;
  main_news_id: number | null;
  is_visible: boolean;
  contact_title: Text;
  contact_text: Text;
};

/** An article of the topic to choose from */
export type ArticleOption = { id: number; title_uk: string; published_on: string; is_visible: boolean };

const shortDate = (date: string) => date.split("-").reverse().join(".");

export function SupportFields({
  meta,
  lang,
  topics,
  articles,
  onChange,
}: {
  meta: SupportMeta;
  lang: Lang;
  topics: Topic[];
  articles: ArticleOption[];
  onChange: (meta: SupportMeta) => void;
}) {
  const set = (next: Partial<SupportMeta>) => onChange({ ...meta, ...next });
  const titleKey = lang === "uk" ? "title_uk" : "title_en";
  const isList = meta.layout === "list";

  return (
    <div className="flex flex-col gap-4.5">
      <Field label={`Назва в меню «Підтримка» (${lang === "uk" ? "UA" : "EN"})`}>
        <Input
          value={meta[titleKey]}
          maxLength={200}
          placeholder={lang === "en" && meta.title_uk ? meta.title_uk : undefined}
          onChange={(e) => set({ [titleKey]: e.target.value })}
        />
      </Field>

      <Field label="Вигляд сторінки">
        <Segmented<SupportLayout>
          value={meta.layout}
          onChange={(layout) => set({ layout })}
          options={[
            { value: "article", label: "Стаття відкрита для читання" },
            { value: "list", label: "Список статей" },
          ]}
        />
      </Field>
      {isList && (
        <Field label="Адреса сторінки зі списком">
          <Input
            value={meta.href}
            maxLength={300}
            placeholder="/support-technologies"
            onChange={(e) => set({ href: e.target.value })}
            className="max-w-110"
          />
        </Field>
      )}

      <div className="grid grid-cols-[1fr_1.3fr] gap-4 max-[800px]:grid-cols-1">
        <Field label="Тема новин">
          <Select
            value={meta.topic_id ?? undefined}
            allowClear
            placeholder="Оберіть тему"
            className="w-full"
            // Another topic: the open article is chosen again from its articles
            onChange={(value) => set({ topic_id: value ?? null, main_news_id: null })}
            options={topics.map((topic) => ({ value: topic.id, label: topic.title_uk }))}
          />
        </Field>
        <Field label={isList ? "Стаття в прев'ю зверху" : "Відкрита стаття на сторінці"}>
          <Select
            value={meta.main_news_id ?? undefined}
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            disabled={!meta.topic_id}
            placeholder={meta.topic_id ? "Найновіша стаття теми" : "Спочатку оберіть тему"}
            className="w-full"
            onChange={(value) => set({ main_news_id: value ?? null })}
            options={articles.map((article) => ({
              value: article.id,
              label: `${article.title_uk} · ${shortDate(article.published_on)}${article.is_visible ? "" : " (схована)"}`,
            }))}
          />
        </Field>
      </div>
      <Hint>
        {isList
          ? "Пункт меню веде на адресу сторінки: обрана стаття — великою карткою зверху, решта статей теми — під нею по дві в ряд і в меню праворуч. Стаття відкривається за своєю адресою, без карток під нею. Не обрали — найновіша."
          : "Пункт меню веде на адресу обраної статті: вона відкрита для читання, решта статей теми — під нею картками й у меню праворуч. Не обрали — найновіша."}{" "}
        Статті ті самі, що в «Новинах»: нову можна додати внизу, у списку статей.
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
