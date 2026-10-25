"use client";

import { App, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, type TableColumnsType } from "antd";
import { ArrowDown, ArrowUp, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, newsCount, readError, useAdminCall } from "./admin-fetch";

// Topics of news ("Interesting", "Installations"...), like folders: a name and the address of
// the topic page on the site. The same look as the list of equipment categories, without photos.
// "Page" opens the news of the topic in the admin panel.

const API = "/api/admin/news-topics";
export const NEWS_BASE = "/fofkas-adminpanel/news";

export type Topic = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
  news_count: number;
  visible_count: number;
};

type FormValues = { title_uk: string; title_en: string; href: string; is_visible: boolean };

/** Small line with the number of news of a topic */
const countText = (topic: Topic) =>
  topic.news_count ? `${newsCount(topic.news_count)}, на сайті ${topic.visible_count}` : "Новин ще немає";

export function NewsTopics({ onChanged }: { onChanged?: () => void }) {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Topic | "new" | null>(null);

  async function load() {
    try {
      const response = await call(API);
      if (!response.ok) throw new Error(await readError(response));
      setTopics(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити теми");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the list
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the page opens
  }, []);

  // The topics are in the menu on the left and the news list shows their names: both update
  const changed = () => {
    router.refresh();
    onChanged?.();
  };

  async function move(index: number, step: -1 | 1) {
    const next = [...topics];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    setTopics(next);
    const response = await call(`${API}/order`, json("PUT", { ids: next.map((topic) => topic.id) }));
    if (response.ok) {
      setTopics(await response.json());
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function toggle(topic: Topic, isVisible: boolean) {
    setTopics((list) => list.map((t) => (t.id === topic.id ? { ...t, is_visible: isVisible } : t)));
    const response = await call(`${API}/${topic.id}/visibility`, json("PATCH", { is_visible: isVisible }));
    if (response.ok) {
      message.success(isVisible ? "Тему показано на сайті" : "Тему сховано з сайту");
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(topic: Topic) {
    const response = await call(`${API}/${topic.id}`, { method: "DELETE" });
    if (response.ok) {
      setTopics((list) => list.filter((t) => t.id !== topic.id));
      message.success("Тему видалено");
      changed();
    } else message.error(await readError(response));
  }

  const emptyState = (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Тем ще немає. Натисніть «Додати тему»." className="py-6" />
  );

  const orderButtons = (index: number) => (
    <Space size={4}>
      <Button size="small" type="text" aria-label="Вище" disabled={index === 0} icon={<ArrowUp size={16} />} onClick={() => move(index, -1)} />
      <Button
        size="small"
        type="text"
        aria-label="Нижче"
        disabled={index === topics.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );

  const visibilitySwitch = (topic: Topic) => (
    <Switch
      checked={topic.is_visible}
      aria-label={topic.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(topic, checked)}
    />
  );

  const pageButton = (topic: Topic, className?: string) => (
    <Button icon={<FolderOpen size={16} />} className={className} onClick={() => router.push(`${NEWS_BASE}/topics/${topic.id}`)}>
      Сторінка
    </Button>
  );

  const rowActions = (topic: Topic, withPage = true) => (
    <Space size={4}>
      {withPage && pageButton(topic)}
      <Button type="text" aria-label="Редагувати" icon={<Pencil size={17} />} onClick={() => setEditing(topic)} />
      <Popconfirm
        title="Видалити тему?"
        description={
          topic.news_count
            ? `У темі ${newsCount(topic.news_count)}. Новини залишаться, але без теми.`
            : "Тема зникне з меню і з сайту."
        }
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => remove(topic)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );

  const columns: TableColumnsType<Topic> = [
    { title: "Порядок", key: "order", width: 96, render: (_, __, index) => orderButtons(index) },
    {
      title: "Назва",
      key: "title",
      render: (_, topic) => (
        <div>
          <div className="font-bold">{topic.title_uk}</div>
          <div className="text-sm text-ink-soft">EN: {topic.title_en || "—"}</div>
        </div>
      ),
    },
    {
      title: "Адреса сторінки",
      dataIndex: "href",
      key: "href",
      render: (href: string) => <Tag className="m-0! font-semibold">{href}</Tag>,
    },
    {
      title: "Новини",
      key: "count",
      width: 170,
      render: (_, topic) => <span className="text-sm text-ink-soft">{countText(topic)}</span>,
    },
    { title: "На сайті", key: "visible", width: 100, render: (_, topic) => visibilitySwitch(topic) },
    { title: "", key: "actions", width: 230, align: "right", render: (_, topic) => rowActions(topic) },
  ];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading tracking-[-0.02em] text-[26px] leading-tight font-extrabold text-ink">Теми новин</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-soft">
            Тема — як папка: назва й адреса сторінки на сайті. Теми з новинами показуються в меню «Новини» і над
            новинами. Порожня або вимкнена тема на сайті не видна.
          </p>
        </div>
        <Button size="large" icon={<Plus size={18} />} onClick={() => setEditing("new")}>
          Додати тему
        </Button>
      </div>

      {/* Large screens: table */}
      <div className="overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:hidden">
        <Table<Topic>
          rowKey="id"
          columns={columns}
          dataSource={topics}
          loading={loading}
          pagination={false}
          scroll={{ x: 860 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per topic */}
      <div className="hidden flex-col gap-3 max-[700px]:flex">
        {!loading && topics.length === 0 && <div className="rounded-3xl steel-card p-4">{emptyState}</div>}
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${
              topic.is_visible ? "" : "opacity-60"
            }`}
          >
            <div className="px-1.5 pt-1">
              <div className="font-bold">{topic.title_uk}</div>
              <div className="text-sm text-ink-soft">EN: {topic.title_en || "—"}</div>
              <Tag className="m-0! mt-2! font-semibold">{topic.href}</Tag>
              <div className="mt-1.5 text-sm text-ink-soft">{countText(topic)}</div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              {orderButtons(index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(topic)}
                На сайті
              </label>
              {rowActions(topic, false)}
            </div>
            {pageButton(topic, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <TopicForm
        topic={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setTopics((list) => (isNew ? [...list, saved] : list.map((t) => (t.id === saved.id ? saved : t))));
          setEditing(null);
          message.success(isNew ? "Тему додано" : "Зміни збережено");
          changed();
        }}
      />
    </section>
  );
}

/** Window with the form: add a new topic or edit one */
export function TopicForm({
  topic,
  onClose,
  onSaved,
}: {
  topic: Topic | "new" | null;
  onClose: () => void;
  onSaved: (topic: Topic, isNew: boolean) => void;
}) {
  const call = useAdminCall();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = topic === "new";
  const open = topic !== null;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    form.setFieldsValue(
      topic === "new"
        ? { is_visible: true }
        : { title_uk: topic.title_uk, title_en: topic.title_en, href: topic.href, is_visible: topic.is_visible },
    );
  }, [open, topic, form]);

  async function submit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const response = await call(
        isNew ? API : `${API}/${(topic as Topic).id}`,
        json(isNew ? "POST" : "PATCH", {
          title_uk: values.title_uk.trim(),
          title_en: (values.title_en ?? "").trim(),
          href: values.href.trim(),
          is_visible: values.is_visible,
        }),
      );
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      onSaved(await response.json(), isNew);
    } catch {
      setError("Немає зв'язку з сервером. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={<span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">{isNew ? "Нова тема" : "Редагувати тему"}</span>}
      onCancel={onClose}
      okText={isNew ? "Додати" : "Зберегти"}
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "topic-form" }}
      destroyOnHidden
      width={540}
    >
      <Form<FormValues> id="topic-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item
          name="title_uk"
          label="Назва теми українською"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву українською" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Цікаве" />
        </Form.Item>
        <Form.Item name="title_en" label="Назва англійською (для /en, можна пізніше)" rules={[{ max: 120, message: "До 120 символів" }]}>
          <Input placeholder="Interesting" />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки теми"
          extra="Як на старому сайті, наприклад /news/content/5-interesting. На цій сторінці будуть новини теми."
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки теми" },
            { pattern: /^\/(?!\/)\S*$/, message: "Почніть з «/», без пробілів" },
          ]}
        >
          <Input placeholder="/news/content/5-interesting" />
        </Form.Item>
        <Form.Item name="is_visible" label="Показувати на сайті" valuePropName="checked">
          <Switch />
        </Form.Item>

        {error && (
          <p role="alert" className="mb-1 rounded-2xl bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-ink">
            {error}
          </p>
        )}
      </Form>
    </Modal>
  );
}
