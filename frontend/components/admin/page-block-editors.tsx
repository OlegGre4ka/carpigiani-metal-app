"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Alert, App, Button, Checkbox, Input, Select } from "antd";
import { ArrowDown, ArrowUp, FileText, Info, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { readError, useAdminCall } from "./admin-fetch";
import { RichTextEditor } from "./rich-text-editor";

import { Spinner } from "@/components/cone-loader";

// Forms of the nine kinds of blocks of a page (category or equipment). Each form gets its
// block and gives back a changed copy through onChange; the page builder keeps them and saves.
// Every text has two languages; the form shows the language picked in the builder (lang).
// In English the Ukrainian text is shown greyed in empty fields, as a hint what to translate.

export type Lang = "uk" | "en";
export type Text = { uk: string; en: string };
export const emptyText = (): Text => ({ uk: "", en: "" });

export type SliderBlock = { id: string; type: "slider"; visible: boolean; images: string[]; autoplay: boolean };
export type TextBlock = { id: string; type: "text"; visible: boolean; title: Text; html: Text };
export type GalleryPhoto = { image: string; caption: Text; link: string };
export type GalleryBlock = {
  id: string;
  type: "gallery";
  visible: boolean;
  photos: GalleryPhoto[];
  per_row: 3 | 4 | 6;
  captions: boolean;
  zoom: boolean;
};
export type FeaturesBlock = {
  id: string;
  type: "features";
  visible: boolean;
  title: Text;
  items: { title: Text; text: Text }[];
};
export type TableBlock = { id: string; type: "table"; visible: boolean; title: Text; header: Text[]; rows: Text[][] };
export type VideoBlock = { id: string; type: "video"; visible: boolean; url: string; caption: Text };
export type SubcategoryBlock = {
  id: string;
  type: "subcategory";
  visible: boolean;
  subcategory_id: number | null;
  show_title: boolean;
};

/** Main photo of an equipment page: one big photo of the machine in the middle */
export type PhotoBlock = { id: string; type: "photo"; visible: boolean; image: string | null };

/** An uploaded PDF: address, the name shown on the site, size in bytes */
export type CatalogFile = { url: string; name: string; size: number };
/** A catalog to download: button text and a PDF per language (one is enough for both) */
export type Catalog = { id: string; label: Text; file_uk: CatalogFile | null; file_en: CatalogFile | null };
export type CatalogsBlock = { id: string; type: "catalogs"; visible: boolean; items: Catalog[] };

/** Brand pages: the cards of the brand's categories (they are managed right in the block) */
export type CategoriesBlock = { id: string; type: "categories"; visible: boolean };

export type Block =
  | CategoriesBlock
  | SliderBlock
  | TextBlock
  | GalleryBlock
  | FeaturesBlock
  | TableBlock
  | VideoBlock
  | SubcategoryBlock
  | PhotoBlock
  | CatalogsBlock;
export type BlockType = Block["type"];

/** Uploads a photo for the page; gives back its address or null */
export type Uploader = (file: File) => Promise<string | null>;
/** Uploads a PDF catalog for the page; gives back the file or null */
export type FileUploader = (file: File) => Promise<CatalogFile | null>;

/** A subcategory as the "Subcategory" block lists them */
export type SubcategoryOption = { id: number; category_id: number; title_uk: string };

const MAX_SLIDES = 6;
const MAX_PHOTOS = 24;

// ---------- Small shared pieces ----------

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-extrabold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="my-2.5 text-[13px] leading-normal text-hint">{children}</p>;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-[18px] bg-mist px-4 py-3.5 text-sm leading-relaxed text-body">
      <Info size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Label of a field with the language it is written in */
const inLang = (label: string, lang: Lang) => `${label} (${lang === "uk" ? "UA" : "EN"})`;

/** Input of one language of a two-language text */
export function TextInput({
  value,
  lang,
  onChange,
  maxLength = 200,
  area = false,
  ...rest
}: {
  value: Text;
  lang: Lang;
  onChange: (value: Text) => void;
  maxLength?: number;
  area?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  size?: "small" | "middle";
}) {
  // English: the Ukrainian text as a grey hint, so it is clear what to translate
  const placeholder = lang === "en" && value.uk ? value.uk : rest.placeholder;
  const props = {
    ...rest,
    placeholder,
    value: value[lang],
    maxLength,
    onChange: (event: { target: { value: string } }) => onChange({ ...value, [lang]: event.target.value }),
  };
  return area ? <Input.TextArea {...props} autoSize={{ minRows: 2, maxRows: 6 }} /> : <Input {...props} />;
}

export const smallButton =
  "btn-shine inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-mist px-4 py-2.5 text-sm font-extrabold text-brand transition-colors hover:bg-mist-strong disabled:cursor-not-allowed disabled:opacity-50";

/** "Add photo" tile: picks one or more files and uploads them one after another */
export function AddPhotos({
  label,
  left,
  upload,
  onAdded,
  multiple = true,
}: {
  label: string;
  /** How many more photos may be added */
  left: number;
  upload: Uploader;
  onAdded: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const { message } = App.useApp();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (left <= 0) return null;

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, left);
    if (files.length > left) message.warning(`Можна додати ще ${left} фото`);
    setBusy(true);
    const urls: string[] = [];
    for (const file of chosen) {
      const url = await upload(file);
      if (url) urls.push(url);
    }
    setBusy(false);
    if (urls.length) onAdded(urls);
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-brand/40 bg-mist/50 p-1.5 text-center text-xs font-extrabold text-brand transition-colors hover:bg-mist disabled:cursor-wait"
      >
        {busy ? <Spinner dark /> : <Plus size={22} aria-hidden="true" />}
        <span>{busy ? "Завантажуємо фото…" : label}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        hidden
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />
    </>
  );
}

/** One photo tile: number, cross; dragged by itself (mouse, finger, or keyboard: Space, arrows) */
function PhotoTile({
  id,
  src,
  number,
  onRemove,
  children,
}: {
  id: string;
  src: string;
  number: number;
  onRemove: () => void;
  children?: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`min-w-0 ${isDragging ? "relative z-10 opacity-80 shadow-[0_16px_34px_rgb(var(--shadow-rgb)/0.25)]" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={`Фото ${number}: перетягніть, щоб змінити порядок`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        className="relative aspect-square touch-none overflow-hidden rounded-[18px] border border-ink/12 bg-white focus-visible:outline-2 focus-visible:outline-brand"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small preview of an uploaded photo */}
        <img src={src} alt="" draggable={false} className="size-full object-cover" />
        <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-ink/80 text-xs font-extrabold text-white">
          {number}
        </span>
        <button
          type="button"
          aria-label={`Прибрати фото ${number}`}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 flex size-6.5 items-center justify-center rounded-full bg-ink/75 text-white transition-colors hover:bg-danger"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Grid of photo tiles that can be put in another order by dragging */
function PhotoTiles<T>({
  items,
  imageOf,
  onChange,
  below,
  addTile,
}: {
  items: T[];
  imageOf: (item: T) => string;
  onChange: (items: T[]) => void;
  below?: (item: T, index: number) => ReactNode;
  addTile: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Every uploaded photo has its own address, so it can be the tile's id
  const ids = items.map(imageOf);

  function end({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="my-4 grid grid-cols-6 gap-3 max-[1100px]:grid-cols-4 max-[700px]:grid-cols-3">
          {items.map((item, index) => (
            <PhotoTile
              key={ids[index]}
              id={ids[index]}
              src={imageOf(item)}
              number={index + 1}
              onRemove={() => onChange(items.filter((_, i) => i !== index))}
            >
              {below?.(item, index)}
            </PhotoTile>
          ))}
          {addTile}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ---------- 1. Slider ----------

export function SliderEditor({ block, onChange, upload }: { block: SliderBlock; onChange: (b: SliderBlock) => void; upload: Uploader }) {
  return (
    <>
      <Hint>
        Великі фото під заголовком сторінки, однакові для обох мов. До {MAX_SLIDES} фото; якщо додати одне, воно
        покажеться без стрілок. Порядок змінюється перетягуванням. Найкраще підходять широкі фото (приблизно 16:6).
      </Hint>
      <PhotoTiles
        items={block.images}
        imageOf={(url) => url}
        onChange={(images) => onChange({ ...block, images })}
        addTile={
          <AddPhotos
            label={`Додати фото (${block.images.length} з ${MAX_SLIDES})`}
            left={MAX_SLIDES - block.images.length}
            upload={upload}
            onAdded={(urls) => onChange({ ...block, images: [...block.images, ...urls] })}
          />
        }
      />
      <Checkbox checked={block.autoplay} onChange={(e) => onChange({ ...block, autoplay: e.target.checked })}>
        Автоперемикання кожні 4 секунди (як на головній)
      </Checkbox>
    </>
  );
}

// ---------- 2. Text ----------

export function TextEditor({
  block,
  lang,
  onChange,
  upload,
}: {
  block: TextBlock;
  lang: Lang;
  onChange: (b: TextBlock) => void;
  upload: Uploader;
}) {
  return (
    <>
      <Field label={inLang("Заголовок блоку, необов'язково", lang)} className="mt-4 mb-3.5">
        <TextInput value={block.title} lang={lang} onChange={(title) => onChange({ ...block, title })} />
      </Field>
      {lang === "en" && !block.html.en && block.html.uk && (
        <Hint>Англійського тексту ще немає: на /en покажеться український. Напишіть переклад нижче.</Hint>
      )}
      {/* A new editor for each language, so it starts with that language's text */}
      <RichTextEditor
        key={lang}
        value={block.html[lang]}
        onChange={(html) => onChange({ ...block, html: { ...block.html, [lang]: html } })}
        uploadImage={upload}
      />
      <Hint>
        Редактор як у Word: заголовки, жирний, списки, посилання, фото. Таких блоків на сторінці може бути скільки завгодно.
      </Hint>
    </>
  );
}

// ---------- 3. Photos (gallery) ----------

export function GalleryEditor({
  block,
  lang,
  onChange,
  upload,
}: {
  block: GalleryBlock;
  lang: Lang;
  onChange: (b: GalleryBlock) => void;
  upload: Uploader;
}) {
  const setPhoto = (index: number, change: Partial<GalleryPhoto>) =>
    onChange({ ...block, photos: block.photos.map((p, i) => (i === index ? { ...p, ...change } : p)) });

  return (
    <>
      <PhotoTiles
        items={block.photos}
        imageOf={(photo) => photo.image}
        onChange={(photos) => onChange({ ...block, photos })}
        below={(photo, index) => (
          <div className="mt-1.5 flex flex-col gap-1">
            {block.captions && (
              <TextInput
                size="small"
                placeholder={inLang("Підпис", lang)}
                aria-label={inLang(`Підпис фото ${index + 1}`, lang)}
                value={photo.caption}
                lang={lang}
                onChange={(caption) => setPhoto(index, { caption })}
              />
            )}
            <Input
              size="small"
              placeholder="Посилання (необов'язково)"
              aria-label={`Посилання фото ${index + 1}`}
              value={photo.link}
              onChange={(e) => setPhoto(index, { link: e.target.value })}
            />
          </div>
        )}
        addTile={
          <AddPhotos
            label="Додати фото"
            left={MAX_PHOTOS - block.photos.length}
            upload={upload}
            onAdded={(urls) =>
              onChange({
                ...block,
                photos: [...block.photos, ...urls.map((image) => ({ image, caption: emptyText(), link: "" }))],
              })
            }
          />
        }
      />
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 [&>.ant-checkbox-wrapper]:pb-2.5">
        <Field label="Скільки в ряд" className="w-40">
          <Select
            value={block.per_row}
            onChange={(per_row) => onChange({ ...block, per_row })}
            options={[3, 4, 6].map((n) => ({ value: n, label: String(n) }))}
          />
        </Field>
        <Checkbox checked={block.captions} onChange={(e) => onChange({ ...block, captions: e.target.checked })}>
          Підписи під фото
        </Checkbox>
        <Checkbox checked={block.zoom} onChange={(e) => onChange({ ...block, zoom: e.target.checked })}>
          Збільшувати по кліку (гортати стрілками)
        </Checkbox>
      </div>
      <Hint>
        Фото з посиланням не збільшується, а відкриває посилання: так робиться, наприклад, логотип бренду. На телефоні фото
        завжди по 3 в ряд.
      </Hint>
    </>
  );
}

// ---------- 4. Features ----------

export function FeaturesEditor({ block, lang, onChange }: { block: FeaturesBlock; lang: Lang; onChange: (b: FeaturesBlock) => void }) {
  const setItem = (index: number, change: Partial<FeaturesBlock["items"][number]>) =>
    onChange({ ...block, items: block.items.map((item, i) => (i === index ? { ...item, ...change } : item)) });

  return (
    <>
      <Field label={inLang("Заголовок блоку", lang)} className="mt-4 mb-3.5">
        <TextInput value={block.title} lang={lang} onChange={(title) => onChange({ ...block, title })} />
      </Field>
      <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
        {block.items.map((item, index) => (
          <div key={index} className="relative grid gap-1.5 rounded-[18px] bg-mist px-3.5 py-3">
            <TextInput
              placeholder="Назва"
              aria-label={inLang(`Назва комірки ${index + 1}`, lang)}
              value={item.title}
              lang={lang}
              className="pr-9! font-extrabold"
              onChange={(title) => setItem(index, { title })}
            />
            <TextInput
              area
              placeholder="Опис"
              aria-label={inLang(`Опис комірки ${index + 1}`, lang)}
              value={item.text}
              lang={lang}
              maxLength={600}
              onChange={(text) => setItem(index, { text })}
            />
            <button
              type="button"
              aria-label={`Видалити комірку ${index + 1}`}
              onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
              className="absolute top-4.5 right-5.5 flex size-6.5 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-danger/12 hover:text-danger"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
        {block.items.length < 24 && (
          <button
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, { title: emptyText(), text: emptyText() }] })}
            className="flex min-h-27.5 flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed border-brand/40 bg-mist/50 text-[13px] font-extrabold text-brand transition-colors hover:bg-mist"
          >
            <Plus size={20} aria-hidden="true" />
            Додати комірку
          </button>
        )}
      </div>
      <Hint>Плитки у два стовпці (на телефоні в один): коротка назва й опис.</Hint>
    </>
  );
}

// ---------- 5. Table ----------

const cellInput =
  "w-full min-w-28 border-0 bg-transparent px-3.5 py-3 text-sm font-semibold text-ink outline-none placeholder:text-ink/35 focus:bg-focus-bg focus:shadow-[inset_0_0_0_2px_var(--brand-light)]";

/** "Fill from a picture" (29.10): a screenshot or a photo of a table goes to the server, Google
 *  Gemini reads it (backend/app/routers/ai_router.py) and the table gets its cells in both
 *  languages. A picture can also be pasted (Ctrl+V) anywhere in the table form. Nothing is saved
 *  until "Save page": the admin checks the cells first. */
function useTableFromPicture(block: TableBlock, onChange: (b: TableBlock) => void) {
  const { message, modal } = App.useApp();
  const call = useAdminCall();
  const [reading, setReading] = useState(false);
  // The table was filled by AI in this visit: a warning stays above it
  const [filled, setFilled] = useState(false);

  async function read(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      message.error("Потрібна картинка: JPG, PNG або WebP");
      return;
    }
    setReading(true);
    try {
      const form = new FormData();
      form.append("picture", file);
      const response = await call("/api/admin/ai/table", { method: "POST", body: form });
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      const table: { header: Text[]; rows: Text[][] } = await response.json();
      onChange({ ...block, header: table.header, rows: table.rows });
      setFilled(true);
      message.success(`Готово: ${table.rows.length} рядків. Перевірте цифри перед збереженням.`);
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося. Перевірте зв'язок.");
    } finally {
      setReading(false);
    }
  }

  /** The table already has text: ask before it is replaced */
  function start(file: File) {
    const filled = [...block.header, ...block.rows.flat()].some((cell) => cell.uk || cell.en);
    if (!filled) return void read(file);
    modal.confirm({
      title: "Замінити таблицю?",
      content: "Зараз у таблиці вже є дані. AI заповнить її заново з картинки.",
      okText: "Замінити",
      cancelText: "Скасувати",
      onOk: () => read(file),
    });
  }

  return { reading, filled, start };
}

export function TableEditor({ block, lang, onChange }: { block: TableBlock; lang: Lang; onChange: (b: TableBlock) => void }) {
  const columns = Math.max(block.header.length, 1);
  const picture = useTableFromPicture(block, onChange);
  const pictureInput = useRef<HTMLInputElement>(null);
  const hint = (cell: Text) => (lang === "en" && cell.uk ? cell.uk : undefined);

  const setHeader = (index: number, value: string) =>
    onChange({ ...block, header: block.header.map((cell, i) => (i === index ? { ...cell, [lang]: value } : cell)) });
  const setCell = (row: number, column: number, value: string) =>
    onChange({
      ...block,
      rows: block.rows.map((cells, r) =>
        r === row ? cells.map((cell, c) => (c === column ? { ...cell, [lang]: value } : cell)) : cells,
      ),
    });
  // New rows and columns appear in both languages at once
  const addRow = () => onChange({ ...block, rows: [...block.rows, Array.from({ length: columns }, emptyText)] });
  const addColumn = () =>
    onChange({ ...block, header: [...block.header, emptyText()], rows: block.rows.map((cells) => [...cells, emptyText()]) });
  const removeColumn = (index: number) =>
    onChange({
      ...block,
      header: block.header.filter((_, i) => i !== index),
      rows: block.rows.map((cells) => cells.filter((_, i) => i !== index)),
    });

  return (
    <div
      onPaste={(event) => {
        // A picture from the clipboard (a screenshot): fill the table from it; text is pasted as usual
        const file = Array.from(event.clipboardData.files).find((f) => f.type.startsWith("image/"));
        if (!file || picture.reading) return;
        event.preventDefault();
        picture.start(file);
      }}
    >
      <Field label={inLang("Назва таблиці", lang)} className="mt-4 mb-3.5">
        <TextInput value={block.title} lang={lang} onChange={(title) => onChange({ ...block, title })} />
      </Field>
      {/* AI: the table from a screenshot */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-navbar/25 bg-mist/60 px-4 py-3">
        <button type="button" className={smallButton} disabled={picture.reading} onClick={() => pictureInput.current?.click()}>
          {picture.reading ? <Spinner /> : <Sparkles size={16} aria-hidden="true" />}
          {picture.reading ? "AI читає таблицю…" : "Заповнити зі скріна"}
        </button>
        <span className="text-[13px] leading-snug text-ink-soft">
          Завантажте скрін або фото таблиці (або вставте його сюди Ctrl+V) — AI заповнить клітинки українською й англійською.{" "}
          <b className="text-ink">Таблиця заповнюється за допомогою AI, тому рекомендуємо перевірити всі цифри перед тим, як зберегти.</b>
        </span>
        <input
          ref={pictureInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) picture.start(file);
          }}
        />
      </div>
      {picture.filled && (
        <Alert
          type="warning"
          showIcon
          className="mb-3!"
          title="Таблицю заповнив AI"
          description="AI може помилитися в цифрах, одиницях чи перекладі. Рекомендуємо перевірити всі значення (українською й англійською) перед тим, як зберегти сторінку."
        />
      )}
      <div className="my-1.5 overflow-x-auto rounded-2xl border border-ink/18 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {block.header.map((cell, index) => (
                <th key={index} className="relative border border-ink/12 bg-mist p-0">
                  <input
                    value={cell[lang]}
                    maxLength={300}
                    placeholder={hint(cell) ?? (index === 0 ? "—" : "Назва стовпця")}
                    aria-label={inLang(`Назва стовпця ${index + 1}`, lang)}
                    onChange={(e) => setHeader(index, e.target.value)}
                    className={`${cellInput} pr-8 font-extrabold text-brand`}
                  />
                  {block.header.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Видалити стовпець ${index + 1}`}
                      onClick={() => removeColumn(index)}
                      className="absolute top-1/2 right-1.5 flex size-5.5 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-soft hover:text-danger"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                </th>
              ))}
              <th className="w-10 border border-ink/12 bg-mist" aria-label="Дії" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((cells, row) => (
              <tr key={row}>
                {cells.map((cell, column) => (
                  <td key={column} className="border border-ink/12 p-0">
                    <input
                      value={cell[lang]}
                      maxLength={300}
                      placeholder={hint(cell)}
                      aria-label={inLang(`Рядок ${row + 1}, стовпець ${column + 1}`, lang)}
                      onChange={(e) => setCell(row, column, e.target.value)}
                      className={`${cellInput} ${column === 0 ? "font-extrabold" : ""}`}
                    />
                  </td>
                ))}
                <td className="w-10 border border-ink/12 text-center">
                  <button
                    type="button"
                    aria-label={`Видалити рядок ${row + 1}`}
                    onClick={() => onChange({ ...block, rows: block.rows.filter((_, i) => i !== row) })}
                    className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-danger/12 hover:text-danger"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <button type="button" className={smallButton} onClick={addRow} disabled={block.rows.length >= 80}>
          <Plus size={16} aria-hidden="true" /> Рядок
        </button>
        <button type="button" className={smallButton} onClick={addColumn} disabled={block.header.length >= 12}>
          <Plus size={16} aria-hidden="true" /> Стовпець
        </button>
        <span className="ml-auto text-[13px] text-hint max-[700px]:ml-0">
          Клікніть у клітинку й пишіть, як в Excel. Tab переходить далі. Рядки й стовпці спільні для обох мов.
        </span>
      </div>
    </div>
  );
}

// ---------- 6. Video ----------

/** The video code from a YouTube link (the backend checks it the same way) */
export function youtubeId(url: string): string | null {
  try {
    const parts = new URL(url.trim());
    const host = parts.hostname.replace(/^(www\.|m\.)/, "");
    let id: string | null = null;
    if (host === "youtu.be") id = parts.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parts.pathname === "/watch") id = parts.searchParams.get("v");
      else {
        const [kind, code] = parts.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live"].includes(kind)) id = code ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function VideoEditor({ block, lang, onChange }: { block: VideoBlock; lang: Lang; onChange: (b: VideoBlock) => void }) {
  const id = block.url.trim() ? youtubeId(block.url) : null;
  const wrong = Boolean(block.url.trim()) && !id;

  return (
    <>
      <Field label="Посилання на відео YouTube (одне для обох мов)" className="mt-4 mb-3.5">
        <Input
          value={block.url}
          status={wrong ? "error" : undefined}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => onChange({ ...block, url: e.target.value })}
        />
        {wrong && <span className="mt-1 block text-[13px] text-danger">Це не схоже на посилання на відео YouTube</span>}
      </Field>
      <Field label={inLang("Підпис під відео, необов'язково", lang)} className="mb-3.5">
        <TextInput
          value={block.caption}
          lang={lang}
          placeholder="Наприклад: як працює Maestro"
          onChange={(caption) => onChange({ ...block, caption })}
        />
      </Field>
      <div className="relative mt-1.5 flex aspect-[16/7] max-w-160 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,var(--brand),var(--dark))]">
        {id && (
          // eslint-disable-next-line @next/next/no-img-element -- picture of the video straight from YouTube
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            onError={(event) => (event.currentTarget.style.visibility = "hidden")}
            className="absolute inset-0 size-full object-cover opacity-85"
          />
        )}
        <span className="relative flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="#fff" className="ml-0.5 size-6">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </div>
      <Hint>{id ? "Так відео виглядатиме на сайті до натискання." : "Вставте посилання, і тут з'явиться картинка відео."}</Hint>
    </>
  );
}

// ---------- 7. Subcategory ----------

export function SubcategoryEditor({
  block,
  onChange,
  subcategories,
  categoryTitles,
  onCreate,
  onEdit,
}: {
  block: SubcategoryBlock;
  onChange: (b: SubcategoryBlock) => void;
  /** All subcategories of all categories (one may be shown on several pages) */
  subcategories: SubcategoryOption[];
  categoryTitles: Record<number, string>;
  /** Opens the window "New subcategory"; the new one is chosen in this block */
  onCreate: () => void;
  /** Goes to the page of the chosen subcategory (the page is saved first) */
  onEdit: (id: number) => void;
}) {
  const chosen = subcategories.find((s) => s.id === block.subcategory_id);
  const missing = block.subcategory_id !== null && !chosen;

  if (subcategories.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3 rounded-[18px] border-2 border-dashed border-brand/40 bg-mist/50 px-5 py-5">
        <p className="text-[15px] text-body">
          У вас ще не створено жодної підкатегорії. Створіть першу: наприклад, «Універсальні апарати».
        </p>
        <Button type="primary" icon={<Plus size={17} />} onClick={onCreate}>
          Створити першу підкатегорію
        </Button>
      </div>
    );
  }

  // Grouped by category, so it is clear where each one lives
  const groups = Object.entries(
    subcategories.reduce<Record<number, SubcategoryOption[]>>((all, s) => {
      (all[s.category_id] ??= []).push(s);
      return all;
    }, {}),
  ).map(([categoryId, list]) => ({
    label: categoryTitles[Number(categoryId)] ?? "Категорія",
    title: categoryTitles[Number(categoryId)],
    options: list.map((s) => ({ value: s.id, label: s.title_uk })),
  }));

  return (
    <>
      <Field label="Яку підкатегорію показати тут" className="mt-4 mb-3.5 max-w-120">
        <Select
          value={chosen?.id}
          status={missing ? "error" : undefined}
          onChange={(subcategory_id: number) => onChange({ ...block, subcategory_id })}
          placeholder={missing ? "Цю підкатегорію видалено, виберіть іншу" : "Виберіть підкатегорію"}
          options={groups}
          className="w-full"
        />
      </Field>
      <Checkbox checked={block.show_title} onChange={(e) => onChange({ ...block, show_title: e.target.checked })}>
        Показувати заголовок підкатегорії
      </Checkbox>
      <div className="mt-3.5 flex flex-wrap gap-3">
        <button type="button" className={smallButton} disabled={!chosen} onClick={() => chosen && onEdit(chosen.id)}>
          <Pencil size={15} aria-hidden="true" /> Редагувати обладнання підкатегорії
        </button>
        <button type="button" className={smallButton} onClick={onCreate}>
          <Plus size={16} aria-hidden="true" /> Створити нову підкатегорію
        </button>
      </div>
      <Note>
        Підкатегорія — це перелік обладнання: на сайті тут з&apos;явиться її назва і картки обладнання (по 4 в ряд). Одну
        підкатегорію можна поставити на кількох сторінках, а на одній сторінці їх може бути кілька. Обладнання додається
        в самій підкатегорії (меню зліва або кнопка «Редагувати обладнання підкатегорії»). Поки в неї немає обладнання,
        блок на сайті не показується.
      </Note>
    </>
  );
}

// ---------- Catalogs (PDF to download; only on equipment pages) ----------

export const MAX_CATALOGS = 4;

/** "4.59 МБ" */
export function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

export function CatalogsEditor({
  block,
  lang,
  onChange,
  uploadFile,
}: {
  block: CatalogsBlock;
  lang: Lang;
  onChange: (b: CatalogsBlock) => void;
  uploadFile: FileUploader;
}) {
  const items = block.items;
  const setItems = (next: Catalog[]) => onChange({ ...block, items: next });
  const setItem = (index: number, item: Catalog) => setItems(items.map((x, i) => (i === index ? item : x)));
  const move = (index: number, to: number) => setItems(arrayMove(items, index, to));
  const add = () =>
    setItems([...items, { id: Math.random().toString(36).slice(2, 10), label: emptyText(), file_uk: null, file_en: null }]);

  return (
    <div className="pt-3">
      <Hint>
        До {MAX_CATALOGS} каталогів у PDF (до 20 МБ кожен). На сайті кожен каталог — картка з кнопкою, назвою файлу й
        розміром. Досить одного файлу: якщо файл є лише для однієї мови, сайт покаже його на обох мовах.
      </Hint>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <CatalogCard
            key={item.id}
            item={item}
            number={index + 1}
            lang={lang}
            first={index === 0}
            last={index === items.length - 1}
            onChange={(next) => setItem(index, next)}
            onMove={(step) => move(index, index + step)}
            onRemove={() => setItems(items.filter((x) => x.id !== item.id))}
            uploadFile={uploadFile}
          />
        ))}
      </div>
      {items.length < MAX_CATALOGS ? (
        <button type="button" onClick={add} className={`${smallButton} mt-3.5`}>
          <Plus size={16} aria-hidden="true" /> Додати каталог
        </button>
      ) : (
        <Hint>Додано найбільше — {MAX_CATALOGS} каталоги.</Hint>
      )}
    </div>
  );
}

function CatalogCard({
  item,
  number,
  lang,
  first,
  last,
  onChange,
  onMove,
  onRemove,
  uploadFile,
}: {
  item: Catalog;
  number: number;
  lang: Lang;
  first: boolean;
  last: boolean;
  onChange: (item: Catalog) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
  uploadFile: FileUploader;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const key = lang === "uk" ? "file_uk" : "file_en";
  const other = lang === "uk" ? item.file_en : item.file_uk;
  const file = item[key];
  const icon = "flex size-8 items-center justify-center rounded-full text-ink hover:bg-ink/7 disabled:opacity-30";

  async function pick(files: FileList | null) {
    const chosen = files?.[0];
    if (!chosen) return;
    setBusy(true);
    const uploaded = await uploadFile(chosen);
    setBusy(false);
    if (uploaded) onChange({ ...item, [key]: uploaded });
  }

  return (
    <div className="rounded-[20px] border border-ink/12 bg-white p-4 max-[700px]:p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-mist text-[13px] font-extrabold text-brand">
          {number}
        </span>
        <b className="mr-auto text-sm">Каталог</b>
        <button type="button" aria-label="Вище" disabled={first} onClick={() => onMove(-1)} className={icon}>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Нижче" disabled={last} onClick={() => onMove(1)} className={icon}>
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Видалити каталог"
          onClick={onRemove}
          className={`${icon} hover:bg-danger/12 hover:text-danger`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <Field label={inLang("Текст кнопки", lang)} className="mb-3">
        <TextInput
          value={item.label}
          lang={lang}
          maxLength={80}
          placeholder={lang === "uk" ? "Скачати каталог HCD" : "Download HCD catalog"}
          onChange={(label) => onChange({ ...item, label })}
        />
      </Field>

      <span className="mb-1.5 block text-[13px] font-extrabold text-ink-soft">{inLang("Файл PDF", lang)}</span>
      {file ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-mist/60 px-3.5 py-2.5">
          <FileText size={20} className="shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <a href={file.url} target="_blank" rel="noopener" className="block truncate text-sm font-bold text-ink hover:underline">
              {file.name}
            </a>
            <span className="text-xs text-ink-soft">{fileSize(file.size)}</span>
          </span>
          <Button size="small" loading={busy} onClick={() => input.current?.click()}>
            Замінити
          </Button>
          <Button size="small" type="text" danger onClick={() => onChange({ ...item, [key]: null })}>
            Прибрати
          </Button>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={smallButton}>
          {busy ? <Spinner dark /> : <Upload size={16} aria-hidden="true" />} {busy ? "Завантажуємо PDF…" : "Завантажити PDF"}
        </button>
      )}
      {!file && other && (
        <Note>
          {lang === "en"
            ? `Англійського файлу немає: на /en буде український «${other.name}». Завантажте англійський, якщо він є.`
            : `Українського файлу немає: на сайті українською буде англійський «${other.name}». Завантажте український, якщо він є.`}
        </Note>
      )}
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

// ---------- Main photo (only on equipment pages) ----------

/** hint: the text above the photo (a news item says it in its own words) */
export function PhotoEditor({
  block,
  onChange,
  upload,
  hint,
}: {
  block: PhotoBlock;
  onChange: (b: PhotoBlock) => void;
  upload: Uploader;
  hint?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    const chosen = files?.[0];
    if (!chosen) return;
    setBusy(true);
    const url = await upload(chosen);
    setBusy(false);
    if (url) onChange({ ...block, image: url });
  }

  return (
    <div className="pt-3">
      <Hint>
        {hint ??
          "Одне велике фото апарата по центру сторінки, без обрізання (як на старому сайті). Найкраще — апарат на білому фоні, від 1200 px заввишки чи завширшки: сайт сам стисне фото. Ставте цей блок першим."}
      </Hint>
      {block.image ? (
        <div className="flex flex-wrap items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded photo */}
          <img src={block.image} alt="" className="h-60 w-auto max-w-full rounded-[20px] border border-ink/10 bg-white object-contain p-3" />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className={smallButton}>
              {busy ? <Spinner dark /> : <Pencil size={16} aria-hidden="true" />} {busy ? "Завантажуємо фото…" : "Замінити фото"}
            </button>
            <button type="button" onClick={() => onChange({ ...block, image: null })} className={`${smallButton} text-danger`}>
              <Trash2 size={16} aria-hidden="true" /> Прибрати
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={smallButton}>
          {busy ? <Spinner dark /> : <Plus size={16} aria-hidden="true" />} {busy ? "Завантажуємо фото…" : "Додати фото"}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
