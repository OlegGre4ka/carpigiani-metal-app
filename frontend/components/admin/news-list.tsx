"use client";

import { App, AutoComplete, Button, Empty, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, type TableColumnsType } from "antd";
import { ImageOff, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { json, readError, shortDate, useAdminCall } from "./admin-fetch";
import { NEWS_BASE, type Topic } from "./news-topics";
import { oldNewsPages } from "@/lib/admin/old-site-pages";

// List of news: all of them (section "News") or of one topic (the page of the topic).
// "Add news" asks only for the title, address, date and topic; then the news opens in the page
// builder, where its photo, short text and the news itself are filled in.
// A new news item is hidden from the site until "On the site" is turned on.

const API = "/api/admin/news";

type NewsItem = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  published_on: string;
  topic_id: number | null;
  topic_title: string;
  image: string | null;
  is_visible: boolean;
};

/** topic_id 0: without a topic */
type FormValues = { title_uk: string; href: string; published_on: string; topic_id: number };

/** Today in Kyiv as "2026-10-23" (the date of a new news item) */
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
}

/** topicId: only the news of this topic, and a new one goes into it.
 *  reloadKey: a change of it loads the list again (e.g. a topic was renamed or deleted). */
export function NewsList({ topicId, reloadKey = 0 }: { topicId?: number; reloadKey?: number }) {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await call(topicId ? `${API}?topic_id=${topicId}` : API);
      if (!response.ok) throw new Error(await readError(response));
      setNews(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити новини");
    } finally {
      setLoading(false);
    }
  }, [call, message, topicId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the list (again after a change of topics)
    load();
  }, [load, reloadKey]);

  async function toggle(item: NewsItem, isVisible: boolean) {
    setNews((list) => list.map((n) => (n.id === item.id ? { ...n, is_visible: isVisible } : n)));
    const response = await call(`${API}/${item.id}/visibility`, json("PATCH", { is_visible: isVisible }));
    if (response.ok) message.success(isVisible ? "Новину показано на сайті" : "Новину сховано з сайту");
    else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(item: NewsItem) {
    const response = await call(`${API}/${item.id}`, { method: "DELETE" });
    if (response.ok) {
      setNews((list) => list.filter((n) => n.id !== item.id));
      message.success("Новину видалено");
      router.refresh();
    } else message.error(await readError(response));
  }

  const open = (item: NewsItem) => router.push(`${NEWS_BASE}/${item.id}`);

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={topicId ? "У цій темі ще немає новин." : "Новин ще немає. Натисніть «Додати новину»."}
      className="py-6"
    />
  );

  const photo = (item: NewsItem, className: string) =>
    item.image ? (
      // eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded photo
      <img src={item.image} alt="" className={`${className} rounded-xl object-cover`} />
    ) : (
      <span className={`${className} flex items-center justify-center rounded-xl bg-mist text-steel`} title="Фото ще не додано">
        <ImageOff size={20} aria-hidden="true" />
      </span>
    );

  const visibilitySwitch = (item: NewsItem) => (
    <Switch
      checked={item.is_visible}
      aria-label={item.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(item, checked)}
    />
  );

  const pageButton = (item: NewsItem, className?: string) => (
    <Button icon={<LayoutTemplate size={16} />} className={className} onClick={() => open(item)}>
      Сторінка
    </Button>
  );

  const deleteButton = (item: NewsItem) => (
    <Popconfirm
      title="Видалити новину?"
      description="Новина і її фото зникнуть назавжди."
      okText="Видалити"
      cancelText="Скасувати"
      okButtonProps={{ danger: true }}
      onConfirm={() => remove(item)}
    >
      <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
    </Popconfirm>
  );

  const columns: TableColumnsType<NewsItem> = [
    { title: "Фото", key: "image", width: 120, render: (_, item) => photo(item, "h-14 w-20") },
    {
      title: "Заголовок",
      key: "title",
      render: (_, item) => (
        <div className="min-w-0">
          <button type="button" onClick={() => open(item)} className="text-left font-bold hover:text-brand">
            {item.title_uk}
          </button>
          <div className="mt-1">
            <Tag className="m-0! font-semibold">{item.href}</Tag>
          </div>
        </div>
      ),
    },
    ...(topicId
      ? []
      : [
          {
            title: "Тема",
            key: "topic",
            width: 150,
            render: (_: unknown, item: NewsItem) =>
              item.topic_title ? <span className="font-semibold">{item.topic_title}</span> : <span className="text-ink-soft">Без теми</span>,
          },
        ]),
    {
      title: "Дата",
      key: "date",
      width: 120,
      render: (_, item) => <span className="whitespace-nowrap">{shortDate(item.published_on)}</span>,
    },
    { title: "На сайті", key: "visible", width: 100, render: (_, item) => visibilitySwitch(item) },
    {
      title: "",
      key: "actions",
      width: 190,
      align: "right",
      render: (_, item) => (
        <Space size={4}>
          {pageButton(item)}
          {deleteButton(item)}
        </Space>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading tracking-[-0.02em] text-[26px] leading-tight font-extrabold text-ink">{topicId ? "Новини теми" : "Усі новини"}</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-soft">
            {"Нові зверху. На сайті найновіша — великою карткою, решта — по три в ряд. Нова новина з'явиться на сайті, коли ви ввімкнете «На сайті»."}
          </p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => setCreating(true)}>
          Додати новину
        </Button>
      </div>

      {/* Large screens: table */}
      <div className="overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:hidden">
        <Table<NewsItem>
          rowKey="id"
          columns={columns}
          dataSource={news}
          loading={loading}
          pagination={news.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          scroll={{ x: 820 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per news item */}
      <div className="hidden flex-col gap-3 max-[700px]:flex">
        {!loading && news.length === 0 && <div className="rounded-3xl steel-card p-4">{emptyState}</div>}
        {news.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${
              item.is_visible ? "" : "opacity-60"
            }`}
          >
            <div className="flex gap-3">
              {photo(item, "h-16 w-22 shrink-0")}
              <div className="min-w-0">
                <div className="font-bold">{item.title_uk}</div>
                <div className="mt-0.5 text-sm text-ink-soft">
                  {shortDate(item.published_on)}
                  {!topicId && ` · ${item.topic_title || "Без теми"}`}
                </div>
              </div>
            </div>
            <Tag className="m-0! mt-2.5! max-w-full truncate font-semibold">{item.href}</Tag>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(item)}
                На сайті
              </label>
              {deleteButton(item)}
            </div>
            {pageButton(item, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <NewNews
        open={creating}
        topicId={topicId}
        onClose={() => setCreating(false)}
        onCreated={(created) => {
          setCreating(false);
          message.success("Новину створено. Заповніть її сторінку.");
          router.refresh();
          router.push(`${NEWS_BASE}/${created.id}`);
        }}
      />
    </section>
  );
}

/** Window "New news item": title, address, date and topic; the rest is filled in the builder */
function NewNews({
  open,
  topicId,
  onClose,
  onCreated,
}: {
  open: boolean;
  topicId?: number;
  onClose: () => void;
  onCreated: (news: NewsItem) => void;
}) {
  const call = useAdminCall();
  const [form] = Form.useForm<FormValues>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    form.setFieldsValue({ published_on: today(), topic_id: topicId ?? 0 });
    call("/api/admin/news-topics")
      .then((response) => (response.ok ? response.json() : []))
      .then(setTopics)
      .catch(() => {});
  }, [open, topicId, form, call]);

  async function submit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const response = await call(
        API,
        json("POST", {
          title_uk: values.title_uk.trim(),
          href: values.href.trim(),
          published_on: values.published_on,
          topic_id: values.topic_id || null,
        }),
      );
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      onCreated(await response.json());
    } catch {
      setError("Немає зв'язку з сервером. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={<span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">Нова новина</span>}
      onCancel={onClose}
      okText="Створити"
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "news-form" }}
      destroyOnHidden
      width={560}
    >
      <p className="mb-3 text-sm text-ink-soft">
        Після створення відкриється сторінка новини: там додасте фото, короткий опис і саму новину.
      </p>
      <Form<FormValues> id="news-form" form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item
          name="title_uk"
          label="Заголовок українською"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть заголовок" },
            { max: 200, message: "До 200 символів" },
          ]}
        >
          <Input autoFocus placeholder="Морозиво: повернення до крафтового коріння" />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки новини"
          extra="Як на старому сайті: оберіть зі списку або впишіть свою, наприклад /230500-back-to-roots."
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки" },
            { pattern: /^(\/(?!\/)\S*|https?:\/\/(www\.)?carpigiani\.com\.ua\/\S+)$/, message: "Почніть з «/», без пробілів" },
          ]}
        >
          <AutoComplete
            options={oldNewsPages.map((value) => ({ value }))}
            placeholder="/230500-back-to-roots"
            filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1 max-[560px]:gap-0">
          <Form.Item name="published_on" label="Дата" rules={[{ required: true, message: "Вкажіть дату" }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="topic_id" label="Тема">
            {/* 0 = "Without a topic" (the list cannot hold an empty value) */}
            <Select options={[{ value: 0, label: "Без теми" }, ...topics.map((t) => ({ value: t.id, label: t.title_uk }))]} />
          </Form.Item>
        </div>

        {error && (
          <p role="alert" className="mb-1 rounded-2xl bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-ink">
            {error}
          </p>
        )}
      </Form>
    </Modal>
  );
}
