"use client";

import { App, Button, Segmented } from "antd";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { AdminNotFound } from "./admin-not-found";
import { TranslateButton } from "./ai-translate";
import { useLeaveGuard } from "./leave-guard";
import { NewsList } from "./news-list";
import type { Topic } from "./news-topics";
import type { Lang } from "./page-block-editors";
import { SUPPORT_PATH, SupportFields, type ArticleOption, type SupportMeta } from "./support-fields";
import { AdminLoader } from "@/components/cone-loader";

// One page of the "Support" menu in the admin panel (4.11): no page builder — the page shows
// an article of its topic of news. On top its settings (name, address, topic, the article shown
// open, the "contact us" card), under them the articles of the topic: the same list as in
// "News", with "Add news" right here.

/** link: where the menu item leads (the address of the article shown open) */
type Loaded = SupportMeta & { id: number; topic_title: string; topic_href: string; link: string };

const panel =
  "mb-4.5 rounded-[30px] bg-[rgb(var(--paper-rgb)/0.94)] px-7 py-6.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:px-4.5 max-[700px]:py-5";

const metaOf = (data: Loaded): SupportMeta => ({
  title_uk: data.title_uk,
  title_en: data.title_en,
  topic_id: data.topic_id,
  main_news_id: data.main_news_id,
  is_visible: data.is_visible,
  contact_title: data.contact_title,
  contact_text: data.contact_text,
});

export function SupportEditor({ id }: { id: number }) {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const api = `/api/admin/support/${id}`;
  const [page, setPage] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<SupportMeta | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [failed, setFailed] = useState(false);
  // The page is not there (deleted, or a wrong address): the 404 of the admin panel
  const [missing, setMissing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>("uk");

  useEffect(() => {
    Promise.all([call(api), call("/api/admin/news-topics")])
      .then(async ([pageResponse, topicsResponse]) => {
        if (pageResponse.status === 404) {
          setMissing(true);
          return;
        }
        if (!pageResponse.ok) throw new Error(await readError(pageResponse));
        const data: Loaded = await pageResponse.json();
        setPage(data);
        setDraft(metaOf(data));
        if (topicsResponse.ok) setTopics(await topicsResponse.json());
      })
      .catch((error) => {
        if (error instanceof Error && error.message !== "logged out") setFailed(true);
      });
  }, [api, call]);

  // The articles of the chosen topic, for "the article shown open"
  const topicId = draft?.topic_id ?? null;
  const loadArticles = useCallback(async () => {
    if (!topicId) {
      setArticles([]);
      return;
    }
    const response = await call(`/api/admin/news?topic_id=${topicId}`);
    if (response.ok) setArticles(await response.json());
  }, [call, topicId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the articles of the topic
    loadArticles().catch(() => setArticles([]));
  }, [loadArticles]);

  useLeaveGuard(dirty);

  const change = (meta: SupportMeta) => {
    setDraft(meta);
    setDirty(true);
  };

  async function save() {
    if (!draft) return;
    if (!draft.title_uk.trim()) {
      message.error("Вкажіть назву сторінки українською");
      setLang("uk");
      return;
    }
    setSaving(true);
    try {
      const response = await call(api, json("PUT", draft));
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      const data: Loaded = await response.json();
      setPage(data);
      setDraft(metaOf(data));
      setDirty(false);
      message.success("Збережено");
      // The name in the menu on the left may have changed
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
    } finally {
      setSaving(false);
    }
  }

  if (missing) return <AdminNotFound />;
  if (failed) {
    return <div className="rounded-[28px] bg-white/75 p-8 text-ink-soft">Не вдалося завантажити сторінку. Оновіть сторінку.</div>;
  }
  if (!page || !draft) return <AdminLoader />;

  return (
    <div className="pb-4">
      <Link
        href={SUPPORT_PATH}
        className="mb-2.5 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline motion-safe:animate-fade-up"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        До сторінок підтримки
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-extrabold tracking-[2px] text-steel uppercase motion-safe:animate-fade-up">
            Підтримка · {page.link || "статтю ще не обрано"}
          </p>
          <h1 className="font-heading tracking-[-0.02em] text-[38px] leading-[1.05] font-extrabold text-ink motion-safe:animate-fade-up motion-safe:[animation-delay:40ms] max-[600px]:text-[28px]">
            {page.title_uk}
          </h1>
          <p className="mt-1.5 max-w-160 text-[15px] leading-normal text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            На сторінці відкрита одна стаття з теми, решта — під нею. Оберіть, яку статтю показати.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          <Button
            size="large"
            href={page.is_visible && page.link ? page.link : undefined}
            target="_blank"
            disabled={!page.is_visible || !page.link}
            title={!page.link ? "У темі ще немає статей на сайті" : page.is_visible ? "Відкрити збережену сторінку на сайті" : "Сторінку сховано з сайту"}
            icon={<ExternalLink size={17} />}
          >
            Переглянути на сайті
          </Button>
          <Button type="primary" size="large" loading={saving} disabled={!dirty} onClick={save}>
            Зберегти
          </Button>
        </div>
      </div>

      {/* No article of the topic on the site: the page is not in the menu (4.11) */}
      {!page.link && (
        <p className="mb-4 rounded-2xl bg-tag px-4 py-3 text-sm font-semibold text-tag-ink">
          {page.topic_id
            ? "У темі ще немає жодної статті на сайті, тому цього пункту немає в меню «Підтримка». Додайте статтю внизу (кнопка «Додати статтю») і ввімкніть у ній «На сайті» — пункт з'явиться в меню."
            : "Оберіть тему новин і збережіть. Поки в темі немає жодної статті на сайті, цього пункту немає в меню «Підтримка»."}
        </p>
      )}
      {!page.is_visible && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Сторінку сховано з сайту: її немає в меню «Підтримка». Коли все буде готово, увімкніть «Показувати на сайті» і
          збережіть.
        </p>
      )}

      <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">Налаштування сторінки</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <Segmented<Lang>
              value={lang}
              onChange={setLang}
              options={[
                { value: "uk", label: "Українська" },
                { value: "en", label: "English" },
              ]}
            />
            <TranslateButton
              value={draft}
              onApply={(translated) => {
                change(translated);
                setLang("en");
              }}
            />
          </div>
        </div>
        <SupportFields meta={draft} lang={lang} topics={topics} articles={articles} onChange={change} />
      </section>

      {/* The articles of the saved topic: the same list as in "News" */}
      {page.topic_id ? (
        <div className="mt-7">
          <NewsList topicId={page.topic_id} articles />
        </div>
      ) : (
        <p className="mt-7 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Оберіть тему новин вище і збережіть — тут з&apos;являться її статті, і можна буде додати нову.
        </p>
      )}
    </div>
  );
}
