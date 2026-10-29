"use client";

import {
  App,
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
import { ArrowDown, ArrowUp, FolderOpen, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { brandBase, type AdminBrand } from "@/lib/admin/brands";

// "Виробники": the brands of the site. Each brand has a name, a small logo (for the
// "Виробники" menu of the site), the address of its page and its place in the order.
// Hidden brand: gone from the site with its page and categories, stays here.
// A brand with categories cannot be deleted (the server explains why).
// The browser talks to FastAPI through /api/... (the login cookie goes along).
const API = "/api/admin/brands";

type FormValues = { title_uk: string; title_en: string; href: string; is_visible: boolean };

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
  } catch {}
  return "Щось пішло не так. Спробуйте ще раз.";
}

/** "3 категорії" */
function categoriesLabel(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} категорія`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} категорії`;
  return `${n} категорій`;
}

/** Small logo on a light tile (logos are colour on a transparent background) */
function Logo({ brand, className = "" }: { brand: AdminBrand; className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-xl border border-ink/10 bg-white p-1.5 ${className}`}>
      {brand.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small preview of the uploaded logo
        <img src={brand.logo_url} alt="" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-xs font-bold text-ink-soft">без лого</span>
      )}
    </span>
  );
}

export function BrandsManager() {
  const { message } = App.useApp();
  const router = useRouter();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminBrand | "new" | null>(null);

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
      const response = await call(API);
      if (!response.ok) throw new Error(await readError(response));
      setBrands(await response.json());
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося завантажити виробників");
    } finally {
      setLoading(false);
    }
  }, [call, message]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the list
    load();
  }, [load]);

  async function move(index: number, step: -1 | 1) {
    const next = [...brands];
    const [moved] = next.splice(index, 1);
    next.splice(index + step, 0, moved);
    setBrands(next);
    const response = await call(`${API}/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((brand) => brand.id) }),
    });
    if (response.ok) {
      setBrands(await response.json());
      // The order of the brands in the menu on the left too
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function toggle(brand: AdminBrand, isVisible: boolean) {
    setBrands((list) => list.map((b) => (b.id === brand.id ? { ...b, is_visible: isVisible } : b)));
    const response = await call(`${API}/${brand.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: isVisible }),
    });
    if (response.ok) {
      message.success(isVisible ? "Виробника показано на сайті" : "Виробника сховано з сайту разом із його категоріями");
      router.refresh();
    } else {
      message.error(await readError(response));
      load();
    }
  }

  async function remove(brand: AdminBrand) {
    const response = await call(`${API}/${brand.id}`, { method: "DELETE" });
    if (response.ok) {
      setBrands((list) => list.filter((b) => b.id !== brand.id));
      message.success("Виробника видалено");
      router.refresh();
    } else message.error({ content: await readError(response), duration: 7 });
  }

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Виробників ще немає. Натисніть «Додати виробника»."
      className="py-8"
    />
  );

  const orderButtons = (brand: AdminBrand, index: number) => (
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
        disabled={index === brands.length - 1}
        icon={<ArrowDown size={16} />}
        onClick={() => move(index, 1)}
      />
    </Space>
  );

  const visibilitySwitch = (brand: AdminBrand) => (
    <Switch
      checked={brand.is_visible}
      aria-label={brand.is_visible ? "Показується на сайті" : "Сховано з сайту"}
      onChange={(checked) => toggle(brand, checked)}
    />
  );

  // Its section with the categories
  const categoriesButton = (brand: AdminBrand, className?: string) => (
    <Button icon={<FolderOpen size={16} />} className={className} onClick={() => router.push(brandBase(brand.key))}>
      Категорії
    </Button>
  );

  const rowActions = (brand: AdminBrand, withCategories = true) => (
    <Space size={4}>
      {withCategories && categoriesButton(brand)}
      <Button type="text" aria-label="Редагувати" icon={<Pencil size={17} />} onClick={() => setEditing(brand)} />
      <Popconfirm
        title="Видалити виробника?"
        description={
          brand.categories_count
            ? `У нього ${categoriesLabel(brand.categories_count)}: спершу перенесіть або видаліть їх.`
            : "Виробник і його лого зникнуть назавжди."
        }
        okText="Видалити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
        onConfirm={() => remove(brand)}
      >
        <Button type="text" danger aria-label="Видалити" icon={<Trash2 size={17} />} />
      </Popconfirm>
    </Space>
  );

  const columns: TableColumnsType<AdminBrand> = [
    {
      title: "Порядок",
      key: "order",
      width: 96,
      render: (_, brand, index) => orderButtons(brand, index),
    },
    {
      title: "Лого",
      key: "logo",
      width: 120,
      render: (_, brand) => <Logo brand={brand} className="h-14 w-24" />,
    },
    {
      title: "Назва",
      key: "title",
      render: (_, brand) => (
        <div>
          <div className="font-bold">{brand.title_uk}</div>
          <div className="text-sm text-ink-soft">EN: {brand.title_en}</div>
          <EmptyNote show={brand.is_visible && !brand.has_content} />
        </div>
      ),
    },
    {
      title: "Сторінка",
      dataIndex: "href",
      key: "href",
      render: (href: string) => <Tag className="m-0! font-semibold">{href}</Tag>,
    },
    {
      title: "Категорій",
      key: "count",
      width: 100,
      render: (_, brand) => <span className="font-semibold">{brand.categories_count}</span>,
    },
    {
      title: "На сайті",
      key: "visible",
      width: 100,
      render: (_, brand) => visibilitySwitch(brand),
    },
    {
      title: "",
      key: "actions",
      width: 230,
      align: "right",
      render: (_, brand) => rowActions(brand),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading tracking-[-0.02em] text-[33px] leading-tight font-extrabold text-ink motion-safe:animate-fade-up max-[600px]:text-[26px]">
            Виробники
          </h1>
          <p className="mt-1 text-sm font-extrabold tracking-[1.5px] text-steel uppercase motion-safe:animate-fade-up motion-safe:[animation-delay:40ms]">
            (Бренди обладнання)
          </p>
          <p className="mt-2 max-w-[62ch] text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Кожен виробник має свою сторінку на сайті й свій пункт у меню зліва з категоріями. Сховайте виробника, щоб
            прибрати з сайту його сторінку й категорії: тут усе залишиться.
          </p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => setEditing("new")}>
          Додати виробника
        </Button>
      </div>

      {/* Large screens: table */}
      <div className="mt-6 overflow-hidden rounded-[28px] steel-card p-2 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:hidden">
        <Table<AdminBrand>
          rowKey="id"
          columns={columns}
          dataSource={brands}
          loading={loading}
          pagination={false}
          scroll={{ x: 880 }}
          locale={{ emptyText: emptyState }}
        />
      </div>

      {/* Phones: one card per brand, nothing to scroll sideways */}
      <div className="mt-5 hidden flex-col gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] max-[700px]:flex">
        {!loading && brands.length === 0 && <div className="rounded-3xl steel-card p-4">{emptyState}</div>}
        {brands.map((brand, index) => (
          <div
            key={brand.id}
            className={`rounded-3xl steel-card p-3 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.08)] ${
              brand.is_visible ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-center gap-3 px-1.5 pt-1.5">
              <Logo brand={brand} className="h-14 w-24 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">{brand.title_uk}</div>
                <div className="text-sm text-ink-soft">EN: {brand.title_en}</div>
                <EmptyNote show={brand.is_visible && !brand.has_content} />
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                  <Tag className="m-0! font-semibold">{brand.href}</Tag>
                  {categoriesLabel(brand.categories_count)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 px-1 pt-3">
              {orderButtons(brand, index)}
              <label className="flex items-center gap-2 text-sm font-semibold">
                {visibilitySwitch(brand)}
                На сайті
              </label>
              {rowActions(brand, false)}
            </div>
            {categoriesButton(brand, "mt-3 w-full")}
          </div>
        ))}
      </div>

      <BrandForm
        brand={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setBrands((list) => (isNew ? [...list, saved] : list.map((b) => (b.id === saved.id ? saved : b))));
          setEditing(null);
          // Brands are in the menu on the left too
          router.refresh();
          message.success(isNew ? "Виробника додано: його розділ з'явився в меню зліва" : "Зміни збережено");
        }}
        call={call}
      />
    </div>
  );
}

/** Window with the form: add a new brand or edit one */
function BrandForm({
  brand,
  onClose,
  onSaved,
  call,
}: {
  brand: AdminBrand | "new" | null;
  onClose: () => void;
  onSaved: (brand: AdminBrand, isNew: boolean) => void;
  call: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [form] = Form.useForm<FormValues>();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = brand === "new";
  const open = brand !== null;

  // Fill the form when the window opens
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the window when it opens
    setError(null);
    if (brand === "new") {
      form.setFieldsValue({ is_visible: true });
      setFiles([]);
    } else {
      form.setFieldsValue({
        title_uk: brand.title_uk,
        title_en: brand.title_en,
        href: brand.href,
        is_visible: brand.is_visible,
      });
      setFiles(brand.logo_url ? [{ uid: "current", name: "Поточне лого", status: "done", url: brand.logo_url }] : []);
    }
  }, [open, brand, form]);

  async function submit(values: FormValues) {
    const newFile = files.find((file) => file.originFileObj)?.originFileObj;
    const body = new FormData();
    body.set("title_uk", values.title_uk.trim());
    body.set("title_en", values.title_en.trim());
    body.set("href", values.href.trim());
    body.set("is_visible", String(values.is_visible));
    if (newFile) body.set("logo", newFile);

    setSaving(true);
    setError(null);
    try {
      const response = await call(isNew ? API : `${API}/${(brand as AdminBrand).id}`, {
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
      title={
        <span className="font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">
          {isNew ? "Новий виробник" : "Редагувати виробника"}
        </span>
      }
      onCancel={onClose}
      okText={isNew ? "Додати" : "Зберегти"}
      cancelText="Скасувати"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "brand-form" }}
      destroyOnHidden
      width={560}
    >
      <Form<FormValues> id="brand-form" form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
        <Form.Item
          label="Лого"
          extra="PNG або WebP з прозорим фоном, до 15 МБ. Показується маленьким у меню «Виробники» на сайті."
        >
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
                <span className="text-sm font-semibold">{files.length ? "Замінити" : "Обрати лого"}</span>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="title_uk"
          label="Назва українською"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву українською" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Carpigiani" />
        </Form.Item>
        <Form.Item
          name="title_en"
          label="Назва англійською (для /en)"
          rules={[
            { required: true, whitespace: true, message: "Вкажіть назву англійською" },
            { max: 120, message: "До 120 символів" },
          ]}
        >
          <Input placeholder="Carpigiani" />
        </Form.Item>
        <Form.Item
          name="href"
          label="Адреса сторінки на сайті"
          extra={
            isNew
              ? "Латинські літери, цифри й дефіс, наприклад /bravo. Сторінка буде такою самою, як у IFI."
              : "Обережно: стара адреса на сайті перестане працювати. Категорії переїдуть разом із виробником."
          }
          rules={[
            { required: true, whitespace: true, message: "Вкажіть адресу сторінки" },
            {
              pattern: /^\/?[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "Латинські маленькі літери, цифри й дефіс, наприклад /bravo",
            },
          ]}
          normalize={(value: string) => (value && !value.startsWith("/") ? `/${value}` : value)}
        >
          <Input placeholder="/bravo" />
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

/** The page of the brand is still empty: the site does not show the brand yet (29.10) */
function EmptyNote({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Tag color="orange" className="m-0! mt-1.5! font-semibold whitespace-normal!">
      Не показується на сайті — сторінка ще порожня
    </Tag>
  );
}
