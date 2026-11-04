"use client";

import { App, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Upload, type TableColumnsType, type UploadFile } from "antd";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";

// "Загальні налаштування" → "Партнери" (4.11): the logos of the strip "Partners" on the home
// page of the site, before the footer. The client adds the partners he wants: the logo, the
// name, the site (optional), the order and whether it is shown. Data: backend/app/routers/
// partners_router.py.

const API = "/api/admin/partners";

type Partner = { id: number; title: string; logo_url: string; url: string; is_visible: boolean };
type FormValues = { title: string; url: string; is_visible: boolean };

const panel =
  "overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)]";

export function PartnersManager() {
  const { message } = App.useApp();
  const router = useRouter();
  const call = useAdminCall();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partner | "new" | null>(null);

  async function load() {
    try {
      const response = await call(API);
      if (!response.ok) throw new Error(await readError(response));
      setPartners(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити партнерів");
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
    const next = [...partners];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    setPartners(next);
    const response = await call(`${API}/order`, json("PUT", { ids: next.map((p) => p.id) }));
    if (response.ok) setPartners(await response.json());
    else {
      message.error(await readError(response));
      load();
    }
  }

  async function toggle(partner: Partner, isVisible: boolean) {
    setPartners((list) => list.map((p) => (p.id === partner.id ? { ...p, is_visible: isVisible } : p)));
    const response = await call(`${API}/${partner.id}/visibility`, json("PATCH", { is_visible: isVisible }));
    if (response.ok) message.success(isVisible ? "Партнера показано на сайті" : "Партнера сховано з сайту");
    else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(partner: Partner) {
    const response = await call(`${API}/${partner.id}`, { method: "DELETE" });
    if (response.ok) {
      setPartners((list) => list.filter((p) => p.id !== partner.id));
      message.success("Партнера видалено");
    } else message.error(await readError(response));
  }

  const logo = (partner: Partner, className: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded logo
    <img src={partner.logo_url} alt="" className={`${className} rounded-xl bg-white object-contain p-1.5 shadow-[inset_0_0_0_1px_rgb(var(--ink-rgb)/0.08)]`} />
  );

  const orderButtons = (index: number) => (
    <Space size={4}>
      <Button size="small" type="text" aria-label="Вище" disabled={index === 0} icon={<ArrowUp size={16} />} onClick={() => move(index, -1)} />
      <Button
        size="small"
        type="text"
        aria-label="Нижче"
        disabled={index === partners.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );

  const visibilitySwitch = (partner: Partner) => (
    <Switch
      checked={partner.is_visible}
      aria-label={partner.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(partner, checked)}
    />
  );

  const rowActions = (partner: Partner) => (
    <Space size={4}>
      <Button type="text" aria-label="Редагувати" icon={<Pencil size={17} />} onClick={() => setEditing(partner)} />
      <Popconfirm
        title="Видалити партнера?"
        description="Його логотип зникне зі стрічки на сайті."
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => remove(partner)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );

  const site = (url: string) =>
    url ? (
      <a href={url} target="_blank" rel="noopener" className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-semibold text-brand hover:underline">
        <ExternalLink size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, "")}</span>
      </a>
    ) : (
      <span className="text-sm text-hint">без посилання</span>
    );

  const columns: TableColumnsType<Partner> = [
    { title: "Порядок", key: "order", width: 96, render: (_, __, index) => orderButtons(index) },
    { title: "Логотип", key: "logo", width: 150, render: (_, partner) => logo(partner, "h-14 w-28") },
    { title: "Назва", dataIndex: "title", key: "title", render: (title: string) => <b>{title}</b> },
    { title: "Сайт партнера", key: "url", render: (_, partner) => site(partner.url) },
    { title: "На сайті", key: "visible", width: 100, render: (_, partner) => visibilitySwitch(partner) },
    { title: "", key: "actions", width: 110, align: "right", render: (_, partner) => rowActions(partner) },
  ];

  const emptyState = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Партнерів ще немає. Натисніть «Додати партнера»." className="py-6" />;

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1 text-[11px] font-extrabold tracking-[1.5px] text-steel uppercase">Загальні налаштування</p>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            Партнери
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Логотипи стрічки «Партнери» на головній сторінці сайту, перед футером, — у тому ж порядку, що тут. Клік по
            логотипу відкриває сайт партнера.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="large" href="/" target="_blank">
            Подивитись на сайті
          </Button>
          <Button size="large" type="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>
            Додати партнера
          </Button>
        </div>
      </div>

      {/* Large screens: table */}
      <div className={`${panel} max-[700px]:hidden`}>
        <Table<Partner> rowKey="id" columns={columns} dataSource={partners} loading={loading} pagination={false} scroll={{ x: 760 }} locale={{ emptyText: emptyState }} />
      </div>

      {/* Phones: one card per partner */}
      <div className="hidden flex-col gap-3 max-[700px]:flex">
        {!loading && partners.length === 0 && <div className="rounded-3xl steel-card p-4">{emptyState}</div>}
        {partners.map((partner, index) => (
          <div key={partner.id} className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${partner.is_visible ? "" : "opacity-60"}`}>
            <div className="flex items-center gap-3 px-1 pt-1">
              {logo(partner, "h-14 w-24 shrink-0")}
              <div className="min-w-0">
                <div className="font-bold">{partner.title}</div>
                {site(partner.url)}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              {orderButtons(index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(partner)}
                На сайті
              </label>
              {rowActions(partner)}
            </div>
          </div>
        ))}
      </div>

      <PartnerForm
        partner={editing}
        call={call}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setPartners((list) => (isNew ? [...list, saved] : list.map((p) => (p.id === saved.id ? saved : p))));
          setEditing(null);
          message.success(isNew ? "Партнера додано" : "Зміни збережено");
          router.refresh();
        }}
      />
    </div>
  );
}

/** Window with the form: a new partner or changes of one */
function PartnerForm({
  partner,
  call,
  onClose,
  onSaved,
}: {
  partner: Partner | "new" | null;
  call: (input: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onSaved: (partner: Partner, isNew: boolean) => void;
}) {
  const [form] = Form.useForm<FormValues>();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = partner === "new";
  const open = partner !== null;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    if (partner === "new") {
      form.setFieldsValue({ is_visible: true, url: "" });
      setFiles([]);
    } else {
      form.setFieldsValue({ title: partner.title, url: partner.url, is_visible: partner.is_visible });
      setFiles([{ uid: "current", name: "Поточний логотип", status: "done", url: partner.logo_url }]);
    }
  }, [open, partner, form]);

  async function submit(values: FormValues) {
    const newFile = files.find((file) => file.originFileObj)?.originFileObj;
    if (isNew && !newFile) {
      setError("Додайте логотип партнера");
      return;
    }
    const body = new FormData();
    body.set("title", values.title.trim());
    body.set("url", (values.url ?? "").trim());
    body.set("is_visible", String(values.is_visible));
    if (newFile) body.set("logo", newFile);

    setSaving(true);
    setError(null);
    try {
      const response = await call(isNew ? API : `${API}/${(partner as Partner).id}`, { method: isNew ? "POST" : "PATCH", body });
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
      title={<span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">{isNew ? "Новий партнер" : "Редагувати партнера"}</span>}
      onCancel={onClose}
      okText={isNew ? "Додати" : "Зберегти"}
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "partner-form" }}
      destroyOnHidden
      width={540}
    >
      <Form<FormValues> id="partner-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item label="Логотип" extra="PNG або WebP з прозорим фоном (або на білому), до 15 МБ.">
          <Upload
            listType="picture-card"
            accept="image/png,image/webp,image/jpeg"
            maxCount={1}
            fileList={files}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              setFiles(
                fileList.map((file) =>
                  file.originFileObj && !file.thumbUrl ? { ...file, thumbUrl: URL.createObjectURL(file.originFileObj) } : file,
                ),
              );
              setError(null);
            }}
            showUploadList={{ showPreviewIcon: false, showRemoveIcon: isNew }}
          >
            {(files.length === 0 || !isNew) && (
              <div className="flex flex-col items-center gap-1.5 text-brand">
                <ImagePlus size={24} />
                <span className="text-sm font-semibold">{files.length ? "Замінити" : "Обрати логотип"}</span>
              </div>
            )}
          </Upload>
        </Form.Item>
        <Form.Item
          name="title"
          label="Назва"
          extra="Для підказки при наведенні й для пошукових систем."
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву партнера" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Fortfrio" />
        </Form.Item>
        <Form.Item name="url" label="Сайт партнера (можна залишити порожнім)" rules={[{ max: 300, message: "До 300 символів" }]}>
          <Input placeholder="https://www.fortfrio.com" />
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
