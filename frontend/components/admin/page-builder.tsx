"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { App, Button, Input, Modal, Popconfirm, Segmented, Switch } from "antd";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Boxes,
  ChevronDown,
  Clapperboard,
  ExternalLink,
  FolderOpen,
  FileDown,
  GripVertical,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  Sparkles,
  Table2,
  Trash2,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useLeaveGuard } from "./leave-guard";
import { NewsFields, type NewsMeta } from "./news-fields";
import { NEWS_BASE, type Topic } from "./news-topics";

import {
  CatalogsEditor,
  emptyText,
  FeaturesEditor,
  Field,
  GalleryEditor,
  PhotoEditor,
  SliderEditor,
  SubcategoryEditor,
  TableEditor,
  TextEditor,
  VideoEditor,
  youtubeId,
  type Block,
  type BlockType,
  type CatalogFile,
  type FileUploader,
  type Lang,
  type SubcategoryOption,
  type Uploader,
} from "./page-block-editors";
import { EquipmentCategoriesManager } from "./equipment-categories-manager";
import { AdminLoader } from "@/components/cone-loader";
import { BRANDS_PATH, brandBase, type AdminBrand } from "@/lib/admin/brands";

// THE page builder of the site: one for every page made of blocks — pages of brands (/ifi:
// title, line under it, the "Categories" block with the category cards managed right in it, and
// the equipment with filter chips), pages of categories (/gelato), pages of single pieces of equipment and showcases (/labotronic, /ifi-tonda) and
// news (/230500-back-to-roots; above the blocks the fields of the news card).
// The page is put together from blocks, like building bricks; on the site they go from top
// to bottom in the same order. One switch "UA | EN" changes the language of all texts at once.
// Kinds of pages differ only in where they are saved and which blocks they may have:
// "Subcategory" only on category pages, "Catalogs" (PDF) only on equipment pages; news have
// only text, photos and video.
// The browser talks to FastAPI through /api/... (the login cookie goes along).

/** Which page is built */
export type PageTarget =
  | { kind: "category"; id: number }
  | { kind: "equipment"; categoryId: number; subcategoryId: number; itemId: string }
  | { kind: "news"; id: number }
  /** brands: all brands (a category can be moved to another one) */
  | { kind: "brand"; brand: AdminBrand; brands: AdminBrand[] };

/** A brand page: the line under the title and the equipment with filter chips */
type BrandMeta = {
  subtitle_uk: string;
  subtitle_en: string;
  show_equipment: boolean;
  hidden_chips: number[];
};

type Loaded = {
  title_uk: string;
  title_en: string;
  blocks: Block[];
  category_id?: number;
  // Brand of the category: its pages are under the section of that brand
  category_brand?: string;
  category_title?: string;
  // False: never saved yet
  saved: boolean;
  // Category page: where the card of the category leads
  category_href?: string;
  // Equipment page
  subcategory_id?: number;
  subcategory_title?: string;
  item_title?: string;
  href?: string;
  item_visible?: boolean;
  // News: the fields of its card (href above is its address)
  published_on?: string;
  topic_id?: number | null;
  topic_title?: string;
  image?: string | null;
  summary?: { uk: string; en: string };
  is_visible?: boolean;
  // Brand page: the line under the title, the equipment with filters and its chips
  subtitle_uk?: string;
  subtitle_en?: string;
  show_equipment?: boolean;
  hidden_chips?: number[];
  chips?: { id: number; title_uk: string; enabled: boolean }[];
  brand_title?: string;
};

/** news: the fields of the news card (news pages only) */
type Draft = { title_uk: string; title_en: string; blocks: Block[]; news?: NewsMeta; brand?: BrandMeta };

const kinds: Record<BlockType, { name: string; icon: ReactNode }> = {
  categories: { name: "Категорії", icon: <FolderOpen size={19} /> },
  slider: { name: "Слайдер", icon: <Images size={19} /> },
  text: { name: "Текст", icon: <Type size={19} /> },
  gallery: { name: "Фото", icon: <LayoutGrid size={19} /> },
  features: { name: "Особливості", icon: <Sparkles size={19} /> },
  table: { name: "Таблиця", icon: <Table2 size={19} /> },
  video: { name: "Відео", icon: <Clapperboard size={19} /> },
  subcategory: { name: "Підкатегорія", icon: <Boxes size={19} /> },
  photo: { name: "Головне фото", icon: <ImageIcon size={19} /> },
  catalogs: { name: "Каталоги", icon: <FileDown size={19} /> },
};

/** Blocks each kind of page may have, in the order of the "Add block" buttons */
const blocksOf: Record<PageTarget["kind"], BlockType[]> = {
  category: ["slider", "text", "gallery", "features", "table", "video", "subcategory"],
  // One machine — one big main photo instead of a slider
  equipment: ["photo", "text", "gallery", "features", "table", "video", "catalogs"],
  // The main photo of a news item is a field of its card, above the blocks
  news: ["text", "gallery", "slider", "video"],
  // Brand pages: the cards of its categories and the blocks of category pages
  brand: ["categories", "slider", "text", "gallery", "features", "table", "video", "catalogs"],
};

const newId = () => Math.random().toString(36).slice(2, 10);
const row = (columns: number) => Array.from({ length: columns }, emptyText);

function emptyBlock(type: BlockType): Block {
  const base = { id: newId(), visible: true };
  switch (type) {
    case "categories":
      return { ...base, type };
    case "slider":
      return { ...base, type, images: [], autoplay: true };
    case "text":
      return { ...base, type, title: emptyText(), html: emptyText() };
    case "gallery":
      return { ...base, type, photos: [], per_row: 3, captions: false, zoom: true };
    case "features":
      return { ...base, type, title: emptyText(), items: [0, 1].map(() => ({ title: emptyText(), text: emptyText() })) };
    case "table":
      return { ...base, type, title: emptyText(), header: row(3), rows: [row(3), row(3)] };
    case "video":
      return { ...base, type, url: "", caption: emptyText() };
    case "subcategory":
      return { ...base, type, subcategory_id: null, show_title: true };
    case "photo":
      return { ...base, type, image: null };
    case "catalogs":
      return { ...base, type, items: [{ id: newId(), label: emptyText(), file_uk: null, file_en: null }] };
  }
}

const text = (value: { uk: string; en: string }, lang: Lang) => (lang === "en" && value.en) || value.uk;

/** Short line under the block name, so a closed block still says what is inside */
function summary(block: Block, lang: Lang, subcategories: SubcategoryOption[]): string {
  switch (block.type) {
    case "categories":
      return "Картки категорій бренду: додавайте й змінюйте категорії прямо тут";
    case "slider":
      return block.images.length ? `${block.images.length} фото з 6` : "Фото ще не додано";
    case "text": {
      const words = text(block.html, lang).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return text(block.title, lang) || words.slice(0, 80) || "Текст ще не написано";
    }
    case "gallery":
      return block.photos.length
        ? `${block.photos.length} фото, у ряд по ${block.per_row}${block.captions ? ", з підписами" : ""}`
        : "Фото ще не додано";
    case "features": {
      const title = text(block.title, lang);
      return `${title ? `${title} · ` : ""}${block.items.length} комірок`;
    }
    case "table": {
      const title = text(block.title, lang);
      return `${title ? `${title} · ` : ""}${block.rows.length} рядків, ${block.header.length} стовпці`;
    }
    case "video":
      return block.url.trim() ? (youtubeId(block.url) ? block.url.trim() : "Неправильне посилання") : "Посилання не вказано";
    case "subcategory":
      return subcategories.find((s) => s.id === block.subcategory_id)?.title_uk ?? "Підкатегорію не вибрано";
    case "photo":
      return block.image ? "Фото додано" : "Фото ще не додано";
    case "catalogs": {
      const ready = block.items.filter((c) => c.file_uk || c.file_en).length;
      return ready ? `Каталогів: ${ready}` : "PDF ще не завантажено";
    }
  }
}

/** Text of an error from FastAPI; for a wrong block says which one */
async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) {
      const first = data.detail[0];
      const message = String(first.msg ?? "").replace(/^Value error, /, "");
      const at = Array.isArray(first.loc) ? first.loc.indexOf("blocks") : -1;
      return at >= 0 && typeof first.loc[at + 1] === "number" ? `Блок ${first.loc[at + 1] + 1}: ${message}` : message;
    }
  } catch {}
  return "Щось пішло не так. Спробуйте ще раз.";
}

const roundIcon =
  "flex size-8.5 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/7 disabled:cursor-not-allowed disabled:opacity-30";

const panel =
  "mb-4.5 rounded-[30px] bg-[rgb(var(--paper-rgb)/0.94)] px-7 py-6.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.08)] max-[700px]:px-4.5 max-[700px]:py-5";

export function PageBuilder({ target }: { target: PageTarget }) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const isCategory = target.kind === "category";
  const isNews = target.kind === "news";
  const isBrand = target.kind === "brand";
  const api =
    target.kind === "category"
      ? `/api/admin/equipment-categories/${target.id}/page`
      : target.kind === "news"
        ? `/api/admin/news/${target.id}/page`
        : target.kind === "brand"
          ? `/api/admin/brands/${target.brand.id}/page`
          : `/api/admin/subcategories/${target.subcategoryId}/items/${encodeURIComponent(target.itemId)}/page`;
  const [page, setPage] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>("uk");
  const [open, setOpen] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [categoryTitles, setCategoryTitles] = useState<Record<number, string>>({});
  // News: the topics to choose from
  const [topics, setTopics] = useState<Topic[]>([]);
  // The "Subcategory" block that asked for a new subcategory
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

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
      const pageResponse = await call(api);
      if (!pageResponse.ok) throw new Error(await readError(pageResponse));
      const data: Loaded = await pageResponse.json();
      setPage(data);
      setDraft(toDraft(data));
      setDirty(false);
      setFailed(false);
      // The "Subcategory" block lists subcategories (category pages only)
      if (isCategory) {
        const [subsResponse, categoriesResponse] = await Promise.all([
          call("/api/admin/subcategories"),
          call("/api/admin/equipment-categories"),
        ]);
        if (subsResponse.ok) setSubcategories(await subsResponse.json());
        if (categoriesResponse.ok) {
          const list: { id: number; title_uk: string }[] = await categoriesResponse.json();
          setCategoryTitles(Object.fromEntries(list.map((c) => [c.id, c.title_uk])));
        }
      }
      if (isNews) {
        const topicsResponse = await call("/api/admin/news-topics");
        if (topicsResponse.ok) setTopics(await topicsResponse.json());
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") setFailed(true);
    }
  }, [api, call, isCategory, isNews]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the page
    load();
  }, [load]);

  // Leaving with unsaved changes asks first (links, menu, "Back", closing the tab)
  useLeaveGuard(dirty);

  const change = (next: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...next } : current));
    setDirty(true);
  };
  const setBlocks = (update: (blocks: Block[]) => Block[]) => {
    setDraft((current) => (current ? { ...current, blocks: update(current.blocks) } : current));
    setDirty(true);
  };
  const setBlock = (index: number, block: Block) => setBlocks((blocks) => blocks.map((b, i) => (i === index ? block : b)));

  function move(from: number, to: number) {
    if (!draft || to < 0 || to >= draft.blocks.length || from === to) return;
    setBlocks((blocks) => arrayMove(blocks, from, to));
  }

  function addBlock(type: BlockType) {
    const block = emptyBlock(type);
    setBlocks((blocks) => [...blocks, block]);
    setOpen((list) => [...list, block.id]);
    // Show the new block
    window.setTimeout(() => document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  const upload: Uploader = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.append("image", file);
      try {
        const response = await call(`${api}/images`, { method: "POST", body });
        if (!response.ok) {
          message.error(await readError(response));
          return null;
        }
        return ((await response.json()) as { url: string }).url;
      } catch {
        return null;
      }
    },
    [api, call, message],
  );

  /** PDF catalogs (the "Catalogs" block) go up at once; they are kept when the page is saved */
  const uploadFile: FileUploader = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await call(`${api}/files`, { method: "POST", body });
        if (!response.ok) {
          message.error(await readError(response));
          return null;
        }
        return (await response.json()) as CatalogFile;
      } catch {
        return null;
      }
    },
    [api, call, message],
  );

  /** Saves the page (or the given version of it). True when saved. */
  async function save(version: Draft | null = draft): Promise<boolean> {
    if (!version) return false;
    if (!version.title_uk.trim()) {
      message.error("Вкажіть заголовок сторінки українською");
      setLang("uk");
      return false;
    }
    if (version.news && !version.news.href.trim()) {
      message.error("Вкажіть адресу сторінки новини");
      return false;
    }
    if (version.news && !version.news.published_on) {
      message.error("Вкажіть дату новини");
      return false;
    }
    // A news item is saved with the fields of its card next to the title and the blocks;
    // a brand page with the line under the title and the filters
    const { news, brand, ...pageVersion } = version;
    setSaving(true);
    try {
      const response = await call(api, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          news ? { ...pageVersion, ...news, href: news.href.trim() } : brand ? { ...pageVersion, ...brand } : pageVersion,
        ),
      });
      if (!response.ok) {
        message.error(await readError(response));
        return false;
      }
      const data: Loaded = await response.json();
      setPage(data);
      setDraft(toDraft(data));
      setDirty(false);
      message.success(isNews ? "Новину збережено" : "Сторінку збережено");
      // Names in the menu on the left may have changed
      router.refresh();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося зберегти. Перевірте зв'язок.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    modal.confirm({
      title: "Скасувати зміни?",
      content: "Сторінка повернеться до останнього збереженого вигляду.",
      okText: "Скасувати зміни",
      cancelText: "Ні, лишити",
      okButtonProps: { danger: true },
      onOk: load,
    });
  }

  /** Opens the page of a subcategory; unsaved changes of this page are saved first */
  async function openSubcategory(subcategoryId: number, version: Draft | null = draft) {
    if (dirty || version !== draft) {
      const saved = await save(version);
      if (!saved) return;
    }
    if (target.kind === "category" && page) router.push(`${brandBase(page.category_brand)}/${target.id}/subcategories/${subcategoryId}`);
  }

  /** New subcategory from a "Subcategory" block: chosen in the block, page saved, then opened */
  async function createSubcategory(title_uk: string, title_en: string) {
    if (!page || !draft) return;
    const response = await call("/api/admin/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: page.category_id, title_uk, title_en }),
    });
    if (!response.ok) {
      message.error(await readError(response));
      return;
    }
    const created: SubcategoryOption = await response.json();
    setSubcategories((list) => [...list, created]);
    const version = {
      ...draft,
      blocks: draft.blocks.map((b) => (b.id === creatingFor && b.type === "subcategory" ? { ...b, subcategory_id: created.id } : b)),
    };
    setCreatingFor(null);
    message.success("Підкатегорію створено");
    await openSubcategory(created.id, version);
  }

  // Blocks are dragged by the handle (mouse, finger) or moved with the keyboard: Space, arrows, Space
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function dragEnd({ active, over }: DragEndEvent) {
    if (!draft || !over || active.id === over.id) return;
    const ids = draft.blocks.map((b) => b.id);
    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  if (failed) {
    return (
      <div className="rounded-[28px] bg-white/75 p-8">
        <p className="mb-4 text-ink-soft">Не вдалося завантажити сторінку.</p>
        <Button onClick={load}>Спробувати ще раз</Button>
      </div>
    );
  }
  if (!page || !draft) return <AdminLoader />;

  // Address of the page on the site: of the category, or the one typed for the equipment / news
  const href = (isCategory ? page.category_href : page.href) ?? "";
  const onSite = href.startsWith("/");
  const canView =
    onSite &&
    (isBrand
      ? page.is_visible === true
      : page.saved && (isNews ? page.is_visible === true : isCategory || page.item_visible !== false));
  const blockTypes = blocksOf[target.kind];
  // The pages of each brand are in its own section
  const base = brandBase(page.category_brand);
  const back =
    target.kind === "brand"
      ? { href: BRANDS_PATH, text: "До виробників" }
      : target.kind === "category"
      ? { href: base, text: "До списку категорій" }
      : target.kind === "news"
        ? page.topic_id
          ? { href: `${NEWS_BASE}/topics/${page.topic_id}`, text: `До теми «${page.topic_title}»` }
          : { href: NEWS_BASE, text: "До новин" }
        : {
            href: `${base}/${target.categoryId}/subcategories/${target.subcategoryId}`,
            text: `До підкатегорії «${page.subcategory_title}»`,
          };
  const titleKey = lang === "uk" ? "title_uk" : "title_en";
  // In English the Ukrainian text is the grey hint of an empty field
  const hintUk = (value: string) => (lang === "en" && value ? value : undefined);

  return (
    <div className="pb-4">
      <Link
        href={back.href}
        className="mb-2.5 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline motion-safe:animate-fade-up"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {back.text}
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-extrabold tracking-[2px] text-steel uppercase motion-safe:animate-fade-up">
            {isBrand
              ? `Виробник · ${page.brand_title} · ${href}`
              : isCategory
              ? `Категорія · ${page.category_title} · ${href}`
              : isNews
                ? `Новина · ${page.topic_title || "Без теми"} · ${href}`
                : `Обладнання · ${page.item_title} · ${href || "адресу не вказано"}`}
          </p>
          <h1 className="font-heading tracking-[-0.02em] text-[38px] leading-[1.05] font-extrabold text-ink motion-safe:animate-fade-up motion-safe:[animation-delay:40ms] max-[600px]:text-[28px]">
            {isBrand ? "Сторінка бренду" : isCategory ? "Сторінка категорії" : isNews ? "Сторінка новини" : "Сторінка обладнання"}
          </h1>
          <p className="mt-1.5 max-w-160 text-[15px] leading-normal text-ink-soft motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
            Збирайте сторінку з блоків, як з кубиків. На сайті вони йдуть зверху вниз у тому ж порядку.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          {onSite && (
            <Button
              size="large"
              href={canView ? href : undefined}
              target="_blank"
              disabled={!canView}
              title={
                canView
                  ? "Відкрити збережену сторінку на сайті"
                  : isBrand
                    ? "Виробника сховано з сайту: показати його можна на сторінці «Виробники»"
                    : isNews
                    ? "Новину сховано з сайту"
                    : page.saved
                      ? "Обладнання сховано з сайту"
                      : "Спочатку збережіть сторінку"
              }
              icon={<ExternalLink size={17} />}
            >
              Переглянути на сайті
            </Button>
          )}
          <Button type="primary" size="large" loading={saving} onClick={() => save()}>
            Зберегти
          </Button>
        </div>
      </div>

      {/* One language switch for the whole page; it stays at the top while scrolling */}
      <div className="sticky top-20 z-6 mb-4.5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[22px] max-[700px]:gap-x-2.5 max-[700px]:px-3 max-[700px]:py-2 border border-white bg-[rgb(var(--paper-rgb)/0.96)] px-4 py-2.5 shadow-[0_10px_28px_rgb(var(--shadow-rgb)/0.1)] motion-safe:animate-fade-up motion-safe:[animation-delay:140ms] max-[900px]:top-17">
        <span className="text-sm font-extrabold text-ink">Редагую:</span>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { value: "uk", label: "Українська" },
            { value: "en", label: "English" },
          ]}
        />
        {/* On phones the hint is left out, so the bar stays one line */}
        <span className="text-[13px] text-hint max-[700px]:hidden">
          {lang === "uk"
            ? "Фото, порядок і налаштування блоків спільні для обох мов."
            : "Сірим показано український текст. Де англійського немає, на /en буде український."}
        </span>
      </div>

      {isCategory && !onSite && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Картка цієї категорії веде на іншу адресу ({href}), тому сторінка на сайті не відкриється. Щоб показати її,
          вкажіть у категорії адресу сторінки сайту, наприклад /gelato.
        </p>
      )}
      {isNews && page.is_visible === false && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Новину сховано з сайту. Коли заповните її, увімкніть «Показувати на сайті» нижче і збережіть.
        </p>
      )}
      {target.kind === "equipment" && !href && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          У цього обладнання ще не вказано адресу сторінки, тому на сайті її не відкрити. Вкажіть адресу в підкатегорії:
          олівець біля обладнання, поле «Адреса сторінки» (наприклад /labotronic).
        </p>
      )}
      {target.kind === "equipment" && href && page.item_visible === false && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Обладнання або його підкатегорію сховано з сайту, тому сторінки на сайті не видно.
        </p>
      )}
      {isBrand && page.is_visible === false && (
        <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-body">
          Виробника сховано з сайту: його сторінки й категорій на сайті не видно. Показати його можна на сторінці
          «Виробники».
        </p>
      )}
      {!page.saved && (
        <p className="mb-4 rounded-2xl bg-tag px-4 py-3 text-sm text-tag-ink">
          {isBrand
            ? "Сторінку ще не збережено: поки що на сайті показуються заголовок і картки категорій."
            : isCategory
            ? "Сторінки ще немає: поки її не збережено, на сайті за цією адресою «Сторінка в розробці»."
            : "Сторінки ще немає: поки її не збережено, картка обладнання на сайті не веде нікуди, а за адресою «Сторінка в розробці»."}
        </p>
      )}

      {/* The page title is always first */}
      <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]`}>
        <h2 className="mb-3.5 font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">{isNews ? "Заголовок новини" : "Заголовок сторінки"}</h2>
        <Field label={lang === "uk" ? "Українською" : "Англійською"}>
          <Input
            value={draft[titleKey]}
            placeholder={hintUk(draft.title_uk)}
            maxLength={200}
            onChange={(e) => change({ [titleKey]: e.target.value })}
          />
        </Field>
        {/* Brand page: a line under the title; left empty, it is not shown */}
        {draft.brand && (
          <Field label={`Підзаголовок (${lang === "uk" ? "українською" : "англійською"}), можна залишити порожнім`} className="mt-4">
            <Input.TextArea
              value={lang === "uk" ? draft.brand.subtitle_uk : draft.brand.subtitle_en}
              placeholder={lang === "en" && draft.brand.subtitle_uk ? draft.brand.subtitle_uk : "Коротко про бренд одним реченням"}
              maxLength={400}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onChange={(e) =>
                change({ brand: { ...draft.brand!, [lang === "uk" ? "subtitle_uk" : "subtitle_en"]: e.target.value } })
              }
            />
          </Field>
        )}
      </section>

      {/* Brand page: all its equipment with filter chips (by category) at the bottom */}
      {draft.brand && (
        <EquipmentFilters
          meta={draft.brand}
          chips={page.chips ?? []}
          onChange={(brand) => change({ brand })}
        />
      )}

      {/* News: its card in the list of news (and the main photo at the top of its page) */}
      {draft.news && (
        <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:180ms]`}>
          <h2 className="mb-3.5 font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">Картка новини</h2>
          <NewsFields meta={draft.news} lang={lang} topics={topics} upload={upload} onChange={(news) => change({ news })} />
        </section>
      )}

      {draft.blocks.length === 0 && (
        <p className="mb-3 rounded-[26px] steel-card px-6 py-8 text-center text-ink-soft">
          {isNews
            ? "Блоків ще немає. Додайте перший блок нижче: наприклад, текст новини."
            : "Блоків ще немає. Додайте перший блок нижче: наприклад, слайдер з фото."}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={dragEnd}>
        <SortableContext items={draft.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {draft.blocks.map((block, index) => (
            <BlockCard
              key={block.id}
              block={block}
              index={index}
              count={draft.blocks.length}
              summary={summary(block, lang, subcategories)}
              expanded={open.includes(block.id)}
              onToggle={() =>
                setOpen((list) => (list.includes(block.id) ? list.filter((x) => x !== block.id) : [...list, block.id]))
              }
              onMove={(to) => move(index, to)}
              onVisible={(visible) => setBlock(index, { ...block, visible })}
              onDelete={() => setBlocks((blocks) => blocks.filter((b) => b.id !== block.id))}
            >
              <BlockForm
                categories={
                  target.kind === "brand" ? (
                    <EquipmentCategoriesManager key={target.brand.key} brand={target.brand} brands={target.brands} embedded />
                  ) : null
                }
                block={block}
                lang={lang}
                onChange={(next) => setBlock(index, next)}
                upload={upload}
                uploadFile={uploadFile}
                subcategories={subcategories}
                categoryTitles={categoryTitles}
                onCreateSubcategory={() => setCreatingFor(block.id)}
                onEditSubcategory={(subId) => openSubcategory(subId)}
              />
            </BlockCard>
          ))}
        </SortableContext>
      </DndContext>

      <section className="mt-1.5 rounded-[26px] border-2 border-dashed border-brand/40 bg-mist/45 p-5.5 max-[700px]:p-4">
        <h2 className="mb-3.5 text-base font-bold text-ink">Додати блок</h2>
        <div className="grid grid-cols-7 gap-2.5 max-[1200px]:grid-cols-4 max-[700px]:grid-cols-3">
          {/* The category cards go on a page once */}
          {blockTypes.filter((type) => type !== "categories" || !draft.blocks.some((b) => b.type === "categories")).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="flex flex-col items-center gap-2 rounded-[18px] border border-ink/14 bg-white px-1.5 py-3.5 text-[13px] text-ink transition-[border-color,box-shadow] hover:border-brand-light hover:shadow-[0_8px_20px_rgb(var(--brand-rgb)/0.15)]"
            >
              <span aria-hidden="true" className="text-brand">
                {kinds[type].icon}
              </span>
              <b>{kinds[type].name}</b>
            </button>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-5 mt-4.5 flex items-center justify-end gap-3.5 rounded-full border border-white bg-[rgb(var(--paper-rgb)/0.95)] px-4.5 py-3.5 shadow-[0_14px_40px_rgb(var(--shadow-rgb)/0.18)] max-[700px]:bottom-3 max-[700px]:gap-2.5 max-[700px]:rounded-[26px] max-[700px]:p-2.5">
        {/* On phones only the two buttons, so the bar stays small */}
        <span role="status" className="mr-auto pl-2.5 text-sm text-ink-soft max-[700px]:sr-only">
          {dirty ? "Зміни ще не збережено" : !page.saved ? "Сторінку ще не збережено" : "Усі зміни збережено"}
        </span>
        <Button size="large" disabled={!dirty || saving} onClick={cancel} className="max-[700px]:min-w-0 max-[700px]:flex-1">
          Скасувати
        </Button>
        <Button type="primary" size="large" loading={saving} onClick={() => save()} className="max-[700px]:min-w-0 max-[700px]:flex-[1.4]">
          Зберегти сторінку
        </Button>
      </div>

      {isCategory && (
        <NewSubcategory
          open={creatingFor !== null}
          categoryTitle={page.category_title ?? ""}
          onCancel={() => setCreatingFor(null)}
          onCreate={createSubcategory}
        />
      )}
    </div>
  );
}

function toDraft(data: Loaded): Draft {
  const draft: Draft = { title_uk: data.title_uk, title_en: data.title_en, blocks: data.blocks };
  // A brand page: the line under the title and the filters
  if (data.show_equipment !== undefined) {
    draft.brand = {
      subtitle_uk: data.subtitle_uk ?? "",
      subtitle_en: data.subtitle_en ?? "",
      show_equipment: data.show_equipment,
      hidden_chips: data.hidden_chips ?? [],
    };
  }
  // A news item: the fields of its card
  if (data.published_on !== undefined) {
    draft.news = {
      href: data.href ?? "",
      published_on: data.published_on,
      topic_id: data.topic_id ?? null,
      image: data.image ?? null,
      summary: data.summary ?? { uk: "", en: "" },
      is_visible: data.is_visible ?? false,
    };
  }
  return draft;
}

/** One block: handle, number, icon, name with a short line, arrows, "on the site", delete, open/close */
function BlockCard({
  block,
  index,
  count,
  summary,
  expanded,
  onToggle,
  onMove,
  onVisible,
  onDelete,
  children,
}: {
  block: Block;
  index: number;
  count: number;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  onMove: (to: number) => void;
  onVisible: (visible: boolean) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const kind = kinds[block.type];
  const bodyId = `block-body-${block.id}`;

  return (
    // The outer box moves while dragging; the fade-in sits on the inner one
    // (an animation on the same box would keep it in place)
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative mb-3 ${isDragging ? "z-20" : ""}`}
    >
      <section
        id={`block-${block.id}`}
        aria-label={`Блок ${index + 1}: ${kind.name}`}
        className={`overflow-hidden rounded-[26px] border bg-[rgb(var(--paper-rgb)/0.97)] transition-[border-color,box-shadow,opacity,scale] motion-safe:animate-fade-up ${
          isDragging
            ? "scale-[1.01] border-brand-light shadow-[0_24px_50px_rgb(var(--shadow-rgb)/0.25)]"
            : "border-white/90 shadow-[0_10px_30px_rgb(var(--shadow-rgb)/0.07)]"
        } ${block.visible ? "" : "opacity-65"}`}
      >
        <div className="flex items-center gap-3 px-4.5 py-3.5 max-[700px]:gap-1.5 max-[700px]:px-2.5">
          <DragHandle setRef={setActivatorNodeRef} attributes={attributes} listeners={listeners} name={kind.name} dragging={isDragging} />
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-mist text-[13px] font-extrabold text-brand">
            {index + 1}
          </span>
          <span aria-hidden="true" className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-mist text-brand max-[700px]:hidden">
            {kind.icon}
          </span>
          <button type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={onToggle} className="min-w-0 flex-1 text-left">
            <b className="block text-base">{kind.name}</b>
            <em className="block truncate text-[13px] text-hint not-italic">{summary}</em>
          </button>
          <span className="flex shrink-0 items-center gap-1.5 max-[700px]:gap-0.5">
            {/* On phones blocks are moved by the handle, the arrows would not fit */}
            <button
              type="button"
              aria-label="Вгору"
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
              className={`${roundIcon} max-[700px]:hidden`}
            >
              <ArrowUp size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Вниз"
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
              className={`${roundIcon} max-[700px]:hidden`}
            >
              <ArrowDown size={17} aria-hidden="true" />
            </button>
            <Switch
              size="small"
              checked={block.visible}
              aria-label={block.visible ? "Показується на сайті" : "Сховано з сайту"}
              title={block.visible ? "Показується на сайті" : "Сховано з сайту"}
              onChange={onVisible}
              className="mx-1.5"
            />
            <Popconfirm
              title="Видалити блок?"
              description="Блок зникне зі сторінки після збереження."
              okText="Видалити"
              cancelText="Скасувати"
              okButtonProps={{ danger: true }}
              onConfirm={onDelete}
            >
              <button type="button" aria-label="Видалити блок" className={`${roundIcon} hover:bg-danger/12 hover:text-danger`}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </Popconfirm>
            <button
              type="button"
              aria-label={expanded ? "Згорнути" : "Розгорнути"}
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={onToggle}
              className={roundIcon}
            >
              <ChevronDown size={18} aria-hidden="true" className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
          </span>
        </div>
        {expanded && (
          <div id={bodyId} className="border-t border-ink/8 px-5.5 pt-1.5 pb-6 max-[700px]:px-3.5 max-[700px]:pb-5">
            {children}
          </div>
        )}
      </section>
    </div>
  );
}

function DragHandle({
  setRef,
  attributes,
  listeners,
  name,
  dragging,
}: {
  setRef: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  name: string;
  dragging: boolean;
}) {
  return (
    <button
      ref={setRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Перетягнути блок «${name}»`}
      title="Перетягніть, щоб змінити порядок"
      // A "grab" hand (inline, so the site-wide "pointer on buttons" rule does not replace it)
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      className="flex size-8 shrink-0 touch-none items-center justify-center rounded-lg text-ink-soft hover:bg-ink/6"
    >
      <GripVertical size={20} aria-hidden="true" />
    </button>
  );
}

function BlockForm({
  categories,
  block,
  lang,
  onChange,
  upload,
  uploadFile,
  subcategories,
  categoryTitles,
  onCreateSubcategory,
  onEditSubcategory,
}: {
  /** The list of the brand's categories (brand pages) */
  categories: ReactNode;
  block: Block;
  lang: Lang;
  onChange: (b: Block) => void;
  upload: Uploader;
  uploadFile: FileUploader;
  subcategories: SubcategoryOption[];
  categoryTitles: Record<number, string>;
  onCreateSubcategory: () => void;
  onEditSubcategory: (id: number) => void;
}) {
  switch (block.type) {
    case "categories":
      return categories;
    case "slider":
      return <SliderEditor block={block} onChange={onChange} upload={upload} />;
    case "text":
      return <TextEditor block={block} lang={lang} onChange={onChange} upload={upload} />;
    case "gallery":
      return <GalleryEditor block={block} lang={lang} onChange={onChange} upload={upload} />;
    case "features":
      return <FeaturesEditor block={block} lang={lang} onChange={onChange} />;
    case "table":
      return <TableEditor block={block} lang={lang} onChange={onChange} />;
    case "video":
      return <VideoEditor block={block} lang={lang} onChange={onChange} />;
    case "subcategory":
      return (
        <SubcategoryEditor
          block={block}
          onChange={onChange}
          subcategories={subcategories}
          categoryTitles={categoryTitles}
          onCreate={onCreateSubcategory}
          onEdit={onEditSubcategory}
        />
      );
    case "photo":
      return <PhotoEditor block={block} onChange={onChange} upload={upload} />;
    case "catalogs":
      return <CatalogsEditor block={block} lang={lang} onChange={onChange} uploadFile={uploadFile} />;
  }
}

/** Brand page: the switch "all equipment with filters" and, when the brand has 2 or more categories
 *  on the site, a switch per filter chip (all on by default). A category hidden from the site is
 *  not in the list; a chip switched off goes away, its equipment stays under "All". */
function EquipmentFilters({
  meta,
  chips,
  onChange,
}: {
  meta: BrandMeta;
  chips: { id: number; title_uk: string }[];
  onChange: (meta: BrandMeta) => void;
}) {
  const hidden = new Set(meta.hidden_chips);
  return (
    <section className={`${panel} motion-safe:animate-fade-up motion-safe:[animation-delay:180ms]`}>
      <h2 className="mb-1.5 font-heading tracking-[-0.02em] text-[23px] font-extrabold text-ink">Обладнання з фільтрами</h2>
      <p className="mb-4 max-w-160 text-sm leading-normal text-ink-soft">
        Внизу сторінки на сайті: усе обладнання бренду і кнопки-фільтри за категоріями. Заповнюється само з категорій і
        підкатегорій.
      </p>
      <label className="flex items-center gap-3 text-[15px] font-bold text-ink">
        <Switch checked={meta.show_equipment} onChange={(show_equipment) => onChange({ ...meta, show_equipment })} />
        Показувати все обладнання на сторінці
      </label>

      {meta.show_equipment && chips.length >= 2 && (
        <div className="mt-5 border-t border-ink/8 pt-4">
          <p className="mb-3 text-[13px] font-extrabold text-ink-soft">Фільтри (вимкнений фільтр зникає, обладнання лишається у «Всі»)</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-[700px]:grid-cols-1">
            {chips.map((chip) => (
              <li key={chip.id}>
                <label className="flex items-center gap-3 text-[15px] text-ink">
                  <Switch
                    size="small"
                    checked={!hidden.has(chip.id)}
                    onChange={(on) =>
                      onChange({
                        ...meta,
                        hidden_chips: on ? meta.hidden_chips.filter((id) => id !== chip.id) : [...meta.hidden_chips, chip.id],
                      })
                    }
                  />
                  {chip.title_uk}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {meta.show_equipment && chips.length < 2 && (
        <p className="mt-4 text-[13px] text-hint">Фільтри з’являться, коли на сайті буде 2 і більше категорії цього бренду.</p>
      )}
    </section>
  );
}

/** Window "New subcategory": a name is enough, the rest is filled on its page */
function NewSubcategory({
  open,
  categoryTitle,
  onCancel,
  onCreate,
}: {
  open: boolean;
  categoryTitle: string;
  onCancel: () => void;
  onCreate: (title_uk: string, title_en: string) => Promise<void>;
}) {
  const [uk, setUk] = useState("");
  const [en, setEn] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!uk.trim() || busy) return;
    setBusy(true);
    await onCreate(uk.trim(), en.trim());
    setBusy(false);
    setUk("");
    setEn("");
  }

  return (
    <Modal
      title="Нова підкатегорія"
      open={open}
      okText="Створити"
      cancelText="Скасувати"
      okButtonProps={{ disabled: !uk.trim(), loading: busy }}
      onOk={submit}
      onCancel={onCancel}
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-ink-soft">
        Підкатегорія буде в категорії «{categoryTitle}». Після створення сторінку категорії збережемо, і ви перейдете до
        підкатегорії: там додасте її обладнання.
      </p>
      <Field label="Назва українською" className="mb-3.5">
        <Input
          autoFocus
          value={uk}
          maxLength={120}
          placeholder="Універсальні апарати"
          onChange={(e) => setUk(e.target.value)}
          onPressEnter={submit}
        />
      </Field>
      <Field label="Назва англійською (можна пізніше)">
        <Input value={en} maxLength={120} placeholder="Universal machines" onChange={(e) => setEn(e.target.value)} onPressEnter={submit} />
      </Field>
    </Modal>
  );
}
