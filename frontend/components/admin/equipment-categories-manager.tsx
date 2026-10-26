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
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  type TableColumnsType,
  type UploadFile,
} from "antd";
import { ArrowDown, ArrowUp, ImagePlus, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { brandBase, type AdminBrand } from "@/lib/admin/brands";
import { oldCategoryPages } from "@/lib/admin/old-site-pages";

// Categories of one brand (Carpigiani, IFI, ISA or any brand added on the "Виробники" page),
// shown as cards on the page of the brand. The same list for every brand.
// The browser talks to FastAPI through /api/... (the login cookie goes along).
const API = "/api/admin/equipment-categories";

type Category = {
  id: number;
  title_uk: string;
  title_en: string;
  href: string;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
  brand: string;
};

type FormValues = { title_uk: string; title_en: string; href: string; is_visible: boolean; brand: string };

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
  } catch {}
  return "Щось пішло не так. Спробуйте ще раз.";
}

/** embedded: inside the "Categories" block of the brand page builder (no page title of its own) */
export function EquipmentCategoriesManager({
  brand,
  brands,
  embedded = false,
}: {
  brand: AdminBrand;
  brands: AdminBrand[];
  embedded?: boolean;
}) {
  const base = brandBase(brand.key);
  const { message } = App.useApp();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const call = useCallback(async (input: string, init?: RequestInit) => {
    const response = await fetch(input, init);
    // Login has expired: back to the login page
    if (response.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose: logout is a server route that clears the cookie
      window.location.href = "/fofkas-adminpanel/logout";
      throw new Error("logged out");
    }
    return response;
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await call(`${API}?brand=${brand.key}`);
      if (!response.ok) throw new Error(await readError(response));
      setCategories(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити категорії");
    } finally {
      setLoading(false);
    }
  }, [call, message, brand.key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the list
    load();
  }, [load]);

  async function move(index: number, step: -1 | 1) {
    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    setCategories(next);
    const response = await call(`${API}/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((category) => category.id) }),
    });
    if (response.ok) {
      setCategories(await response.json());
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function toggle(category: Category, isVisible: boolean) {
    setCategories((list) => list.map((t) => (t.id === category.id ? { ...t, is_visible: isVisible } : t)));
    const response = await call(`${API}/${category.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: isVisible }),
    });
    if (response.ok) message.success(isVisible ? "Категорію показано на сайті" : "Категорію сховано з сайту");
    else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(category: Category) {
    const response = await call(`${API}/${category.id}`, { method: "DELETE" });
    if (response.ok) {
      setCategories((list) => list.filter((t) => t.id !== category.id));
      message.success("Категорію видалено");
      router.refresh();
    } else message.error(await readError(response));
  }

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Категорій ще немає. Натисніть «Додати категорію»."
      className="py-8"
    />
  );

  const orderButtons = (category: Category, index: number) => (
    <Space size={4}>
      <Button
        size="small"
        type="text"
        aria-label="Вище"
        disabled={index === 0}
        icon={<ArrowUp size={16} />}
        onClick={() => move(index, -1)}
      />
      <Button
        size="small"
        type="text"
        aria-label="Нижче"
        disabled={index === categories.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );

  const visibilitySwitch = (category: Category) => (
    <Switch
      checked={category.is_visible}
      aria-label={category.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(category, checked)}
    />
  );

  // Page of the category on the site, built from blocks
  const pageButton = (category: Category, className?: string) => (
    <Button
      icon={<LayoutTemplate size={16} />}
      className={className}
      onClick={() => router.push(`${base}/${category.id}`)}
    >
      Сторінка
    </Button>
  );

  const rowActions = (category: Category, withPage = true) => (
    <Space size={4}>
      {withPage && pageButton(category)}
      <Button type="text" aria-label="Редагувати" icon={<Pencil size={17} />} onClick={() => setEditing(category)} />
      <Popconfirm
        title="Видалити категорію?"
        description="Категорія і її фото зникнуть назавжди."
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => remove(category)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );

  const columns: TableColumnsType<Category> = [
    {
      title: "Порядок",
      key: "order",
      width: 96,
      render: (_, category, index) => orderButtons(category, index),
    },
    {
      title: "Фото",
      key: "image",
      width: 132,
      render: (_, category) => (
        // eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded photo
        <img src={category.image_url} alt="" className="h-16 w-24 rounded-xl object-cover" />
      ),
    },
    {
      title: "Назва",
      key: "title",
      render: (_, category) => (
        <div>
          <div className="font-bold">{category.title_uk}</div>
          <div className="text-sm text-ink-soft">EN: {category.title_en}</div>
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
      title: "На сайті",
      key: "visible",
      width: 110,
      render: (_, category) => visibilitySwitch(category),
    },
    {
      title: "",
      key: "actions",
      width: 230,
      align: "right",
      render: (_, category) => rowActions(category),
    },
  ];

  const addButton = (
    <Button type="primary" size={embedded ? "middle" : "large"} icon={<Plus size={18} />} onClick={() => setEditing("new")}>
      Додати категорію
    </Button>
  );

  return (
    <div>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[60ch] text-sm text-ink-soft">
            Картки категорій на сторінці {brand.href}, по 3 в ряд. Зміни категорій зберігаються одразу, без кнопки
            «Зберегти сторінку».
          </p>
          {addButton}
        </div>
      ) : (
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            {brand.title_uk}
          </h1>
          <p className="mt-1 text-sm font-extrabold tracking-[1.5px] text-steel uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:40ms]">
            (Категорії)
          </p>
          <p className="mt-2 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Кожна категорія показується на сторінці {brand.href} карткою з фото й назвою. Картки стоять по 3 в ряд. Поки
            категорій немає, блок на сайті не показується.
          </p>
          {!brand.is_visible && (
            <p className="mt-3 max-w-[62ch] rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-ink motion-safe:animate-fade-up">
              Виробник прихований: його сторінка й категорії зараз не показуються на сайті. Показати його можна на
              сторінці «Виробники».
            </p>
          )}
        </div>
        {addButton}
      </div>
      )}

      {/* Large screens: table */}
      <div className="mt-5 overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:hidden">
        <Table<Category>
          rowKey="id"
          columns={columns}
          dataSource={categories}
          loading={loading}
          pagination={false}
          scroll={{ x: 880 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per category, nothing to scroll sideways */}
      <div className="mt-5 hidden flex-col gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:flex">
        {!loading && categories.length === 0 && (
          <div className="rounded-3xl steel-card p-4">{emptyState}</div>
        )}
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${
              category.is_visible ? "" : "opacity-60"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded photo */}
            <img src={category.image_url} alt="" className="h-36 w-full rounded-2xl object-cover" />
            <div className="px-1.5 pt-3">
              <div className="font-bold">{category.title_uk}</div>
              <div className="text-sm text-ink-soft">EN: {category.title_en}</div>
              <Tag className="m-0! mt-2! font-semibold">{category.href}</Tag>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              {orderButtons(category, index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(category)}
                На сайті
              </label>
              {rowActions(category, false)}
            </div>
            {pageButton(category, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <CategoryForm
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          // Moved to another brand: it leaves this list and appears under that brand
          const moved = saved.brand !== brand.key;
          setCategories((list) =>
            moved
              ? list.filter((t) => t.id !== saved.id)
              : isNew
                ? [...list, saved]
                : list.map((t) => (t.id === saved.id ? saved : t)),
          );
          setEditing(null);
          // Categories are in the menu on the left too
          router.refresh();
          const target = brands.find((item) => item.key === saved.brand)?.title_uk ?? saved.brand;
          message.success(moved ? `Категорію перенесено до «${target}»` : isNew ? "Категорію додано" : "Зміни збережено");
        }}
        call={call}
        brand={brand}
        brands={brands}
      />
    </div>
  );
}

/** Window with the form: add a new category or edit one */
function CategoryForm({
  category,
  onClose,
  onSaved,
  call,
  brand,
  brands,
}: {
  category: Category | "new" | null;
  onClose: () => void;
  onSaved: (category: Category, isNew: boolean) => void;
  call: (input: string, init?: RequestInit) => Promise<Response>;
  brand: AdminBrand;
  brands: AdminBrand[];
}) {
  const [form] = Form.useForm<FormValues>();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = category === "new";
  const open = category !== null;

  // Fill the form when the window opens
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    if (category === "new") {
      form.setFieldsValue({ is_visible: true, brand: brand.key });
      setFiles([]);
    } else {
      form.setFieldsValue({
        title_uk: category.title_uk,
        title_en: category.title_en,
        href: category.href,
        is_visible: category.is_visible,
        brand: category.brand ?? brand.key,
      });
      setFiles([{ uid: "current", name: "Поточне фото", status: "done", url: category.image_url }]);
    }
  }, [open, category, form, brand.key]);

  async function submit(values: FormValues) {
    const newFile = files.find((file) => file.originFileObj)?.originFileObj;
    if (isNew && !newFile) {
      setError("Додайте фото для картки");
      return;
    }
    const body = new FormData();
    body.set("title_uk", values.title_uk.trim());
    body.set("title_en", values.title_en.trim());
    body.set("href", values.href.trim());
    body.set("is_visible", String(values.is_visible));
    if (newFile) body.set("image", newFile);
    body.set("brand", values.brand);

    setSaving(true);
    setError(null);
    try {
      const response = await call(isNew ? API : `${API}/${(category as Category).id}`, {
        method: isNew ? "POST" : "PATCH",
        body,
      });
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
      title={<span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">{isNew ? "Нова категорія" : "Редагувати категорію"}</span>}
      onCancel={onClose}
      okText={isNew ? "Додати" : "Зберегти"}
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "category-form" }}
      destroyOnHidden
      width={560}
    >
      <Form<FormValues> id="category-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item label="Фото для картки" extra="JPG, PNG або WebP до 15 МБ. Найкраще горизонтальне, від 1200 px завширшки: сайт сам стисне його.">
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
              <div className="flex flex-col items-center gap-1.5 text-brand">
                <ImagePlus size={24} />
                <span className="text-sm font-semibold">Обрати фото</span>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="title_uk"
          label="Назва категорії українською"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву українською" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Італійське морозиво Gelato" />
        </Form.Item>
        <Form.Item
          name="title_en"
          label="Назва категорії англійською (для /en)"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву англійською" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Italian Gelato" />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки категорії"
          extra={`Куди веде картка. Оберіть зі списку або впишіть свою, наприклад /gelato (сторінка сайту), чи повну адресу https://...`}
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки категорії" },
            {
              pattern: /^(\/(?!\/)\S*|https?:\/\/\S+)$/,
              message: "Почніть з «/» (сторінка сайту) або з https://",
            },
          ]}
        >
          <AutoComplete
            options={oldCategoryPages}
            placeholder="/gelato"
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item
          name="brand"
          label="Виробник"
          extra={isNew ? undefined : "Оберіть іншого виробника, щоб перенести категорію разом із підкатегоріями й обладнанням."}
        >
          <Select
            options={brands.map((item) => ({
              value: item.key,
              label: item.is_visible ? item.title_uk : `${item.title_uk} (приховано)`,
            }))}
          />
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
