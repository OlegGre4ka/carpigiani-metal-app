"use client";

import { App, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, type TableColumnsType } from "antd";
import { ArrowDown, ArrowUp, ExternalLink, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";
import { SUPPORT_PATH } from "./support-fields";

// The pages of the "Support" menu of the site (4.11): Carpigiani Gelato University, Technologies
// and any other. Their order here is the order of the menu; a hidden page is not in the menu.
// "Сторінка" opens its settings: the topic of news, the article shown open, the "contact us" card.

const API = "/api/admin/support";

type SupportItem = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  is_visible: boolean;
  topic_title: string;
  main_title: string;
};

type FormValues = { title_uk: string; href: string };

export function SupportList() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [pages, setPages] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const response = await call(API);
      if (!response.ok) throw new Error(await readError(response));
      setPages(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити сторінки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the list
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the page opens
  }, []);

  async function move(index: number, step: -1 | 1) {
    const next = [...pages];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    setPages(next);
    const response = await call(`${API}/order`, json("PUT", { ids: next.map((page) => page.id) }));
    if (response.ok) {
      setPages(await response.json());
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function toggle(page: SupportItem, isVisible: boolean) {
    setPages((list) => list.map((p) => (p.id === page.id ? { ...p, is_visible: isVisible } : p)));
    const response = await call(`${API}/${page.id}/visibility`, json("PATCH", { is_visible: isVisible }));
    if (response.ok) {
      message.success(isVisible ? "Сторінку показано в меню «Підтримка»" : "Сторінку сховано з сайту");
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(page: SupportItem) {
    const response = await call(`${API}/${page.id}`, { method: "DELETE" });
    if (response.ok) {
      setPages((list) => list.filter((p) => p.id !== page.id));
      message.success("Сторінку видалено");
      router.refresh();
    } else message.error(await readError(response));
  }

  const open = (page: SupportItem) => router.push(`${SUPPORT_PATH}/${page.id}`);

  const emptyState = (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Сторінок ще немає. Натисніть «Додати сторінку»." className="py-6" />
  );

  const orderButtons = (index: number) => (
    <Space size={4}>
      <Button size="small" type="text" aria-label="Вище" disabled={index === 0} icon={<ArrowUp size={16} />} onClick={() => move(index, -1)} />
      <Button
        size="small"
        type="text"
        aria-label="Нижче"
        disabled={index === pages.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );

  const visibilitySwitch = (page: SupportItem) => (
    <Switch
      checked={page.is_visible}
      aria-label={page.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(page, checked)}
    />
  );

  const pageButton = (page: SupportItem, className?: string) => (
    <Button icon={<LayoutTemplate size={16} />} className={className} onClick={() => open(page)}>
      Сторінка
    </Button>
  );

  const rowActions = (page: SupportItem, withPage = true) => (
    <Space size={4}>
      {withPage && pageButton(page)}
      <Button
        type="text"
        aria-label="Переглянути на сайті"
        title={page.is_visible ? "Переглянути на сайті" : "Сторінку сховано з сайту"}
        disabled={!page.is_visible}
        href={page.is_visible ? page.href : undefined}
        target="_blank"
        icon={<ExternalLink size={17} />}
      />
      <Popconfirm
        title="Видалити сторінку?"
        description="Сторінка і її фото зникнуть назавжди. Статті теми залишаться в «Новинах»."
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => remove(page)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );

  const columns: TableColumnsType<SupportItem> = [
    { title: "Порядок", key: "order", width: 96, render: (_, __, index) => orderButtons(index) },
    {
      title: "Назва в меню",
      key: "title",
      render: (_, page) => (
        <div>
          <button type="button" onClick={() => open(page)} className="text-left font-bold hover:text-brand">
            {page.title_uk}
          </button>
          <div className="text-sm text-ink-soft">EN: {page.title_en || "—"}</div>
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
      title: "Тема і відкрита стаття",
      key: "topic",
      width: 260,
      render: (_, page) => (
        <div className="text-sm">
          <div className="font-semibold">{page.topic_title || "Тему не обрано"}</div>
          {page.topic_title && <div className="text-ink-soft">{page.main_title || "Найновіша стаття"}</div>}
        </div>
      ),
    },
    { title: "На сайті", key: "visible", width: 100, render: (_, page) => visibilitySwitch(page) },
    { title: "", key: "actions", width: 220, align: "right", render: (_, page) => rowActions(page) },
  ];

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">Меню сайту</p>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            Підтримка
          </h1>
          <p className="mt-1.5 max-w-[66ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Сторінки меню «Підтримка» на сайті — у тому ж порядку, що тут. На кожній відкрита одна стаття з обраної теми
            новин, решта статей теми — під нею. Нова сторінка спочатку схована: налаштуйте її і ввімкніть «На сайті».
          </p>
        </div>
        <Button size="large" type="primary" icon={<Plus size={18} />} onClick={() => setCreating(true)}>
          Додати сторінку
        </Button>
      </div>

      {/* Large screens: table */}
      <div className="overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:hidden">
        <Table<SupportItem>
          rowKey="id"
          columns={columns}
          dataSource={pages}
          loading={loading}
          pagination={false}
          scroll={{ x: 860 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per page */}
      <div className="hidden flex-col gap-3 max-[700px]:flex">
        {!loading && pages.length === 0 && <div className="rounded-3xl steel-card p-4">{emptyState}</div>}
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${page.is_visible ? "" : "opacity-60"}`}
          >
            <div className="px-1.5 pt-1">
              <div className="font-bold">{page.title_uk}</div>
              <div className="text-sm text-ink-soft">EN: {page.title_en || "—"}</div>
              <Tag className="m-0! mt-2! font-semibold">{page.href}</Tag>
              <div className="mt-1.5 text-sm text-ink-soft">
                {page.topic_title ? `${page.topic_title} · ${page.main_title || "найновіша стаття"}` : "Тему не обрано"}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              {orderButtons(index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(page)}
                На сайті
              </label>
              {rowActions(page, false)}
            </div>
            {pageButton(page, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <NewSupportPage
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(page) => {
          setCreating(false);
          message.success("Сторінку додано — оберіть тему і статтю");
          router.refresh();
          open(page);
        }}
      />
    </div>
  );
}

/** Window: the name in the menu and the address of a new page; the rest is filled in its builder */
function NewSupportPage({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (page: SupportItem) => void;
}) {
  const call = useAdminCall();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
  }, [open, form]);

  async function submit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const response = await call(API, json("POST", { title_uk: values.title_uk.trim(), href: values.href.trim() }));
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
      title={<span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">Нова сторінка підтримки</span>}
      onCancel={onClose}
      okText="Додати"
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "support-form" }}
      destroyOnHidden
      width={540}
    >
      <Form<FormValues> id="support-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item
          name="title_uk"
          label="Назва в меню (українською)"
          extra="Англійську назву можна вказати потім, на сторінці."
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву" },
            { max: 200, message: "До 200 символів" },
          ]}
        >
          <Input placeholder="Сервіс" />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки" },
            { pattern: /^\/(?!\/)\S*$/, message: "Почніть з «/», без пробілів" },
          ]}
        >
          <Input placeholder="/service" />
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
