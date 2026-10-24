"use client";

import {
  App,
  AutoComplete,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  type TableColumnsType,
  type UploadFile,
} from "antd";
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useLeaveGuard } from "./leave-guard";

import { brandOf, brands } from "@/lib/admin/brands";
import { oldEquipmentPages } from "@/lib/admin/old-site-pages";
import { AdminLoader } from "@/components/cone-loader";

// A subcategory: a group of equipment (e.g. "Universal machines") shown on the category page
// by a "Subcategory" block. Here: its name (UA/EN), "show on the site", delete, and its
// equipment, added one by one with a form like the one of categories: photo, name and
// description in two languages, and the address of its page on the site (typed by the client,
// as on the old site: /labotronic). On the site each card also gets the name of the category.
// "Page" next to each piece of equipment opens its page in the same page builder.

type Text = { uk: string; en: string };
type Item = { id: string; visible: boolean; image: string | null; title: Text; text: Text; href: string };

/** Page of the category in the admin panel: under Equipment or under IFI / ISA showcases */
const categoryLink = (sub: { category_id: number; category_brand?: string }) =>
  `${brands[brandOf(sub.category_brand)].base}/${sub.category_id}`;

type Subcategory = {
  id: number;
  category_id: number;
  // Brand of the category: Carpigiani equipment or IFI / ISA showcases (own section in the menu)
  category_brand?: string;
  category_title: string;
  category_href: string;
  title_uk: string;
  title_en: string;
  is_visible: boolean;
  items: Item[];
};

type ItemValues = { title_uk: string; title_en: string; text_uk: string; text_en: string; href: string; visible: boolean };

// Ready choices for the address: pages of equipment of the old site
const hrefOptions = oldEquipmentPages.map((href) => ({ value: href, label: href }));

const newId = () => Math.random().toString(36).slice(2, 10);

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) return String(data.detail[0].msg ?? "").replace(/^Value error, /, "");
  } catch {}
  return "Щось пішло не так. Спробуйте ще раз.";
}

export function SubcategoryForm({ id }: { id: number }) {
  const { message } = App.useApp();
  const router = useRouter();
  const api = `/api/admin/subcategories/${id}`;
  const [sub, setSub] = useState<Subcategory | null>(null);
  const [failed, setFailed] = useState(false);
  const [names, setNames] = useState({ title_uk: "", title_en: "" });
  const [savingNames, setSavingNames] = useState(false);
  const [editing, setEditing] = useState<Item | "new" | null>(null);

  // Changed names that are not saved yet: leaving the page asks first
  const namesChanged = Boolean(sub) && (names.title_uk !== sub?.title_uk || names.title_en !== sub?.title_en);
  useLeaveGuard(namesChanged);

  const call = useCallback(async (input: string, init?: RequestInit) => {
    const response = await fetch(input, init);
    if (response.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose: logout is a server route that clears the cookie
      window.location.href = "/fofkas-adminpanel/logout";
      throw new Error("logged out");
    }
    return response;
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await call(api);
      if (!response.ok) throw new Error(await readError(response));
      const data: Subcategory = await response.json();
      setSub(data);
      setNames({ title_uk: data.title_uk, title_en: data.title_en });
      setFailed(false);
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") setFailed(true);
    }
  }, [api, call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the subcategory
    load();
  }, [load]);

  /** Saves the subcategory with these changes; true when saved */
  const save = useCallback(
    async (change: Partial<Subcategory>, success?: string): Promise<boolean> => {
      if (!sub) return false;
      const next = { ...sub, ...change };
      try {
        const response = await call(api, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title_uk: next.title_uk,
            title_en: next.title_en,
            is_visible: next.is_visible,
            items: next.items,
          }),
        });
        if (!response.ok) {
          message.error(await readError(response));
          return false;
        }
        const data: Subcategory = await response.json();
        setSub(data);
        if (success) message.success(success);
        return true;
      } catch (error) {
        if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
        return false;
      }
    },
    [api, call, message, sub],
  );

  async function saveNames() {
    if (!names.title_uk.trim()) {
      message.error("Вкажіть назву підкатегорії українською");
      return;
    }
    setSavingNames(true);
    const saved = await save({ title_uk: names.title_uk.trim(), title_en: names.title_en.trim() }, "Назву збережено");
    setSavingNames(false);
    if (saved) {
      setNames({ title_uk: names.title_uk.trim(), title_en: names.title_en.trim() });
      // The name in the menu on the left changes too
      router.refresh();
    }
  }

  async function remove() {
    if (!sub) return;
    const response = await call(api, { method: "DELETE" });
    if (!response.ok) {
      message.error(await readError(response));
      return;
    }
    message.success("Підкатегорію видалено");
    router.push(categoryLink(sub));
    router.refresh();
  }

  if (failed) {
    return (
      <div className="rounded-[28px] bg-white/75 p-8">
        <p className="mb-4 text-cocoa-soft">Не вдалося завантажити підкатегорію.</p>
        <Button onClick={load}>Спробувати ще раз</Button>
      </div>
    );
  }
  if (!sub) return <AdminLoader />;

  const items = sub.items;
  const move = (index: number, step: -1 | 1) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    save({ items: next });
  };
  const toggle = (item: Item, visible: boolean) =>
    save(
      { items: items.map((x) => (x.id === item.id ? { ...x, visible } : x)) },
      visible ? "Обладнання показано на сайті" : "Обладнання сховано з сайту",
    );
  const removeItem = (item: Item) => save({ items: items.filter((x) => x.id !== item.id) }, "Обладнання видалено");

  const orderButtons = (index: number) => (
    <Space size={4}>
      <Button size="small" type="text" aria-label="Вище" disabled={index === 0} icon={<ArrowUp size={16} />} onClick={() => move(index, -1)} />
      <Button
        size="small"
        type="text"
        aria-label="Нижче"
        disabled={index === items.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );
  const visibilitySwitch = (item: Item) => (
    <Switch
      checked={item.visible}
      aria-label={item.visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(item, checked)}
    />
  );
  // Page of the equipment on the site, built in the same page builder as categories
  const pageButton = (item: Item, className?: string) => (
    <Button
      icon={<LayoutTemplate size={16} />}
      className={className}
      onClick={() =>
        router.push(`${categoryLink(sub)}/subcategories/${sub.id}/items/${item.id}`)
      }
    >
      Сторінка
    </Button>
  );
  const address = (item: Item, className = "") =>
    item.href ? (
      <Tag className={`m-0! font-semibold ${className}`}>{item.href}</Tag>
    ) : (
      <Tag color="warning" className={`m-0! font-semibold ${className}`}>
        Адресу не вказано
      </Tag>
    );
  const rowActions = (item: Item, withPage = true) => (
    <Space size={4}>
      {withPage && pageButton(item)}
      <Button type="text" aria-label="Редагувати" icon={<Pencil size={17} />} onClick={() => setEditing(item)} />
      <Popconfirm
        title="Видалити обладнання?"
        description="Обладнання і його фото зникнуть назавжди."
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => removeItem(item)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );
  const preview = (item: Item, className: string) =>
    item.image ? (
      // eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded photo
      <img src={item.image} alt="" className={`${className} bg-white object-contain`} />
    ) : (
      <span className={`${className} flex items-center justify-center bg-sand text-xs text-cocoa-soft`}>Без фото</span>
    );

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Обладнання ще немає. Натисніть «Додати обладнання»."
      className="py-8"
    />
  );

  const columns: TableColumnsType<Item> = [
    { title: "Порядок", key: "order", width: 96, render: (_, __, index) => orderButtons(index) },
    { title: "Фото", key: "image", width: 132, render: (_, item) => preview(item, "h-16 w-24 rounded-xl border border-cocoa/10") },
    {
      title: "Назва та опис",
      key: "title",
      render: (_, item) => (
        <div>
          <div className="font-bold">{item.title.uk}</div>
          {item.title.en && <div className="text-sm text-cocoa-soft">EN: {item.title.en}</div>}
          {item.text.uk && <div className="mt-1 line-clamp-2 max-w-[60ch] text-sm text-cocoa-soft">{item.text.uk}</div>}
        </div>
      ),
    },
    { title: "Адреса сторінки", key: "href", width: 170, render: (_, item) => address(item) },
    { title: "На сайті", key: "visible", width: 110, render: (_, item) => visibilitySwitch(item) },
    { title: "", key: "actions", width: 220, align: "right", render: (_, item) => rowActions(item) },
  ];

  return (
    <div>
      <Link
        href={categoryLink(sub)}
        className="mb-2.5 inline-flex items-center gap-2 text-sm font-extrabold text-caramel hover:underline motion-safe:animate-fade-up"
      >
        <ArrowLeft size={16} aria-hidden="true" /> До сторінки категорії «{sub.category_title}»
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-extrabold tracking-[2px] text-gold uppercase motion-safe:animate-fade-up">
            Підкатегорія · {sub.category_title}
          </p>
          <h1 className="font-heading text-[40px] leading-tight font-bold text-caramel motion-safe:animate-fade-up motion-safe:[animation-delay:40ms] max-[600px]:text-[32px]">
            {sub.title_uk}
          </h1>
          <p className="mt-2 max-w-[62ch] text-cocoa-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Обладнання цієї підкатегорії показується на сторінці категорії там, де стоїть блок «Підкатегорія»: картки по 4
            в ряд. Над назвою кожної картки сайт сам пише назву категорії. Поки обладнання немає, блок на сайті не
            показується.
          </p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => setEditing("new")}>
          Додати обладнання
        </Button>
      </div>

      {/* Name of the subcategory */}
      <section className="mt-6 rounded-[28px] border border-white/90 bg-white/75 px-6 py-5 shadow-[0_14px_40px_rgba(90,60,40,0.08)] motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] max-[700px]:px-4">
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-extrabold text-cocoa-soft">Назва підкатегорії українською</span>
            <Input value={names.title_uk} maxLength={120} onChange={(e) => setNames((n) => ({ ...n, title_uk: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-extrabold text-cocoa-soft">Назва підкатегорії англійською (для /en)</span>
            <Input
              value={names.title_en}
              maxLength={120}
              placeholder={names.title_uk}
              onChange={(e) => setNames((n) => ({ ...n, title_en: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="primary" disabled={!namesChanged} loading={savingNames} onClick={saveNames}>
            Зберегти назву
          </Button>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Switch
              checked={sub.is_visible}
              onChange={(is_visible) =>
                save({ is_visible }, is_visible ? "Підкатегорію показано на сайті" : "Підкатегорію сховано з сайту")
              }
            />
            Показувати на сайті
          </label>
          <Popconfirm
            title="Видалити підкатегорію?"
            description="Її обладнання й фото зникнуть назавжди. Блок на сторінці категорії перестане показуватись."
            okText="Видалити"
            cancelText="Скасувати"
            okButtonProps={{ danger: true }}
            onConfirm={remove}
          >
            <Button danger type="text" icon={<Trash2 size={16} />} className="ml-auto max-[700px]:ml-0">
              Видалити підкатегорію
            </Button>
          </Popconfirm>
        </div>
        <p className="mt-2 text-[13px] text-[#8a7766]">
          Назва — це заголовок над картками на сайті і пункт у меню зліва. Англійську можна не вказувати: на /en тоді буде
          українська.
        </p>
      </section>

      {/* Large screens: table */}
      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/90 bg-white/75 p-2 shadow-[0_14px_40px_rgba(90,60,40,0.08)] motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:hidden">
        <Table<Item>
          rowKey="id"
          columns={columns}
          dataSource={items}
          pagination={false}
          scroll={{ x: 980 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per piece of equipment */}
      <div className="mt-5 hidden flex-col gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:flex">
        {items.length === 0 && <div className="rounded-3xl border border-white/90 bg-white/75 p-4">{emptyState}</div>}
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-3xl border border-white/90 bg-white/75 p-3 shadow-[0_10px_28px_rgba(90,60,40,0.08)] ${
              item.visible ? "" : "opacity-60"
            }`}
          >
            {preview(item, "h-40 w-full rounded-2xl border border-cocoa/10")}
            <div className="px-1.5 pt-3">
              <div className="font-bold">{item.title.uk}</div>
              {item.title.en && <div className="text-sm text-cocoa-soft">EN: {item.title.en}</div>}
              {item.text.uk && <div className="mt-1 line-clamp-3 text-sm text-cocoa-soft">{item.text.uk}</div>}
              {address(item, "mt-2!")}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-cocoa/8 px-1 pt-3">
              {orderButtons(index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(item)}
                На сайті
              </label>
              {rowActions(item, false)}
            </div>
            {pageButton(item, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <ItemForm
        item={editing}
        subcategoryApi={api}
        call={call}
        onClose={() => setEditing(null)}
        onSave={async (item, isNew) => {
          const next = isNew ? [...items, item] : items.map((x) => (x.id === item.id ? item : x));
          const saved = await save({ items: next }, isNew ? "Обладнання додано" : "Зміни збережено");
          if (saved) setEditing(null);
          return saved;
        }}
      />
    </div>
  );
}

/** Window with the form of one piece of equipment: photo, name and description in two languages */
function ItemForm({
  item,
  subcategoryApi,
  call,
  onClose,
  onSave,
}: {
  item: Item | "new" | null;
  subcategoryApi: string;
  call: (input: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onSave: (item: Item, isNew: boolean) => Promise<boolean>;
}) {
  const [form] = Form.useForm<ItemValues>();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = item === "new";
  const open = item !== null;

  // Fill the form when the window opens
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    if (item === "new") {
      form.setFieldsValue({ visible: true });
      setFiles([]);
    } else {
      form.setFieldsValue({
        title_uk: item.title.uk,
        title_en: item.title.en,
        text_uk: item.text.uk,
        text_en: item.text.en,
        href: item.href ?? "",
        visible: item.visible,
      });
      setFiles(item.image ? [{ uid: "current", name: "Поточне фото", status: "done", url: item.image }] : []);
    }
  }, [open, item, form]);

  async function submit(values: ItemValues) {
    const newFile = files.find((file) => file.originFileObj)?.originFileObj;
    const keptImage = files.find((file) => file.uid === "current")?.url ?? null;
    if (isNew && !newFile) {
      setError("Додайте фото обладнання");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let image = keptImage;
      // The photo goes up first; it becomes part of the subcategory when it is saved
      if (newFile) {
        const body = new FormData();
        body.append("image", newFile);
        const response = await call(`${subcategoryApi}/images`, { method: "POST", body });
        if (!response.ok) {
          setError(await readError(response));
          return;
        }
        image = ((await response.json()) as { url: string }).url;
      }
      await onSave(
        {
          id: isNew ? newId() : (item as Item).id,
          visible: values.visible,
          image,
          title: { uk: values.title_uk.trim(), en: (values.title_en ?? "").trim() },
          text: { uk: (values.text_uk ?? "").trim(), en: (values.text_en ?? "").trim() },
          href: values.href.trim().replace(/\/+$/, ""),
        },
        isNew,
      );
    } catch {
      setError("Немає зв'язку з сервером. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={<span className="font-heading text-[28px] font-bold text-caramel">{isNew ? "Нове обладнання" : "Редагувати обладнання"}</span>}
      onCancel={onClose}
      okText={isNew ? "Додати" : "Зберегти"}
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "equipment-item-form" }}
      destroyOnHidden
      width={600}
    >
      <Form<ItemValues> id="equipment-item-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item label="Фото обладнання" extra="JPG, PNG або WebP до 15 МБ. Найкраще фото апарата на білому фоні: сайт сам стисне його.">
          <Upload
            listType="picture-card"
            accept="image/jpeg,image/png,image/webp"
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
            showUploadList={{ showPreviewIcon: false }}
          >
            {files.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 text-caramel">
                <ImagePlus size={24} />
                <span className="text-sm font-semibold">Обрати фото</span>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="title_uk"
          label="Назва українською"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву українською" },
            { max: 200, message: "До 200 символів" },
          ]}
        >
          <Input placeholder="Carpigiani Maestro" />
        </Form.Item>
        <Form.Item name="title_en" label="Назва англійською (для /en, можна пізніше)" rules={[{ max: 200, message: "До 200 символів" }]}>
          <Input placeholder="Carpigiani Maestro" />
        </Form.Item>
        <Form.Item name="text_uk" label="Опис українською" rules={[{ max: 600, message: "До 600 символів" }]}>
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="Універсальний апарат: морозиво, шоколад, топінги, креми, йогурт та багато іншого"
          />
        </Form.Item>
        <Form.Item name="text_en" label="Опис англійською (для /en, можна пізніше)" rules={[{ max: 600, message: "До 600 символів" }]}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки обладнання"
          extra="Куди веде картка на сайті. Оберіть адресу зі старого сайту або впишіть свою, наприклад /labotronic."
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки обладнання" },
            { pattern: /^\/(?!\/)\S+$/, message: "Почніть з «/», без пробілів: наприклад /labotronic" },
          ]}
        >
          <AutoComplete
            options={hrefOptions}
            placeholder="/labotronic"
            filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item name="visible" label="Показувати на сайті" valuePropName="checked">
          <Switch />
        </Form.Item>

        {error && (
          <p role="alert" className="mb-1 rounded-2xl bg-[#f6dcd5] px-4 py-3 text-sm font-semibold text-[#8a3424]">
            {error}
          </p>
        )}
      </Form>
    </Modal>
  );
}
