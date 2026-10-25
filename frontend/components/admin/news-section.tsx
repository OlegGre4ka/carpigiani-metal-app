"use client";

import { App, Button } from "antd";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { readError, useAdminCall } from "./admin-fetch";
import { NewsList } from "./news-list";
import { NEWS_BASE, NewsTopics, TopicForm, type Topic } from "./news-topics";
import { AdminLoader } from "@/components/cone-loader";

const heading =
  "font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]";

/** Section "News": the topics (like folders) and all news */
export function NewsSection() {
  // A topic was renamed or deleted: the list of news shows the new names
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div>
      <h1 className={heading}>Новини</h1>
      <p className="mt-1 text-sm font-extrabold tracking-[1.5px] text-steel uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:40ms]">
        (Теми та новини)
      </p>
      <p className="mt-2 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
        Новини показуються на сторінці /news і на сторінках своїх тем, а три останні — на головній. Новину можна додати
        тут або на сторінці теми.
      </p>
      <div className="mt-7 flex flex-col gap-10 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]">
        <NewsTopics onChanged={() => setReloadKey((key) => key + 1)} />
        <NewsList reloadKey={reloadKey} />
      </div>
    </div>
  );
}

/** Page of one topic in the admin panel: its news and "Add news" (already in this topic) */
export function TopicNews({ topicId }: { topicId: number }) {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    call(`/api/admin/news-topics/${topicId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response));
        setTopic(await response.json());
      })
      .catch((error) => {
        if (error instanceof Error && error.message !== "logged out") setFailed(true);
      });
  }, [call, topicId]);

  if (failed) {
    return (
      <div className="rounded-[28px] bg-white/75 p-8">
        <p className="mb-4 text-ink-soft">Тему не знайдено. Можливо, її видалили.</p>
        <Link href={NEWS_BASE} className="font-extrabold text-brand hover:underline">
          До новин
        </Link>
      </div>
    );
  }
  if (!topic) return <AdminLoader />;

  // The topic page is on the site while the topic is on and has news on the site
  const onSite = topic.is_visible && topic.visible_count > 0;

  return (
    <div>
      <Link
        href={NEWS_BASE}
        className="mb-2.5 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline motion-safe:animate-fade-up"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        До новин і тем
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-extrabold tracking-[2px] text-steel uppercase motion-safe:animate-fade-up">
            Тема новин · {topic.href}
          </p>
          <h1 className={heading}>{topic.title_uk}</h1>
        </div>
        <div className="flex flex-wrap gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          <Button
            size="large"
            href={onSite ? topic.href : undefined}
            target="_blank"
            disabled={!onSite}
            title={onSite ? "Відкрити сторінку теми на сайті" : "Тема на сайті з'явиться, коли в ній буде новина на сайті"}
            icon={<ExternalLink size={17} />}
          >
            Переглянути на сайті
          </Button>
          <Button size="large" icon={<Pencil size={17} />} onClick={() => setEditing(true)}>
            Редагувати тему
          </Button>
        </div>
      </div>
      {!topic.is_visible && (
        <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Тему сховано з сайту: її немає в меню, а новини показуються без неї.
        </p>
      )}

      <div className="mt-7 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]">
        <NewsList topicId={topicId} />
      </div>

      <TopicForm
        topic={editing ? topic : null}
        onClose={() => setEditing(false)}
        onSaved={(saved) => {
          setTopic(saved);
          setEditing(false);
          message.success("Зміни збережено");
          router.refresh();
        }}
      />
    </div>
  );
}
