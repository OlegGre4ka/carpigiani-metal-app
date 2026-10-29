"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { App, Input, Modal, Select } from "antd";
import {
  AlignCenter,
  Bold,
  CodeXml,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  PanelLeft,
  PanelRight,
  Underline,
  Unlink,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

// Text editor "like Word" for the "Text" block: paragraphs, headings, bold, italic, underline,
// lists, links and photos. It gives HTML; the backend keeps only these tags when saving.
// A photo in the text: a click on it shows its buttons — on the left / in the middle / on the
// right (left and right: the text flows around it, as on the old site) and small / medium / large.
// The look is the same as on the site (.rich in globals.css).
// "HTML" (29.10, the client asked): the same text as HTML code to correct by hand; back to the
// usual view with the same button. The site keeps only the tags of the editor (see the hint).

type Align = "left" | "center" | "right";
type Size = "s" | "m" | "l";

/** Photo of the text with its place and size (data-align, data-size in the HTML) */
const TextPhoto = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-align"),
        renderHTML: (attributes) => (attributes.align ? { "data-align": attributes.align } : {}),
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes) => (attributes.size ? { "data-size": attributes.size } : {}),
      },
    };
  },
});

/** HTML code easy to read: each paragraph, heading, list and list item on its own line */
const readableHtml = (html: string) =>
  html
    .replace(/(<\/(p|h2|h3|li|blockquote)>|<(ul|ol)>|<\/(ul|ol)>)/g, "$1\n")
    .replace(/<li>/g, "  <li>")
    .trim();

/** The text without empty lines at its end (the editor adds one after a list or a photo) */
const withoutEmptyEnd = (html: string) => html.replace(/(<p><\/p>)+$/, "");

const places: { value: Align; label: string; icon: ReactNode }[] = [
  { value: "left", label: "Ліворуч, текст обтікає справа", icon: <PanelLeft size={16} /> },
  { value: "center", label: "По центру", icon: <AlignCenter size={16} /> },
  { value: "right", label: "Праворуч, текст обтікає зліва", icon: <PanelRight size={16} /> },
];
const sizes: { value: Size; label: string; text: string }[] = [
  { value: "s", label: "Маленьке фото", text: "S" },
  { value: "m", label: "Середнє фото", text: "M" },
  { value: "l", label: "Велике фото", text: "L" },
];

const toolButton =
  "inline-flex h-8.5 min-w-8.5 items-center justify-center gap-1 rounded-[10px] px-2 text-ink transition-colors hover:bg-white/80 disabled:opacity-40 aria-pressed:bg-white aria-pressed:shadow-[0_1px_3px_rgb(var(--ink-rgb)/0.15)]";

function Separator() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-ink/20" />;
}

export function RichTextEditor({
  value,
  onChange,
  uploadImage,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Uploads a photo and gives back its address, or null if it failed */
  uploadImage: (file: File) => Promise<string | null>;
}) {
  // The last text given to the page (to tell a real change from the editor's own tidying)
  const saved = useRef(withoutEmptyEnd(value));
  const editor = useEditor({
    // The admin panel page is drawn in the browser; this avoids a mismatch on first draw
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextPhoto,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich min-h-36 max-w-none px-5 py-4.5 text-base outline-none",
        "aria-label": "Текст блоку",
      },
    },
    onUpdate: ({ editor }) => {
      // The editor adds an empty line after a list or a photo at the end, so the cursor can go
      // below it. That alone is not a change: the page must not say "changes not saved".
      const html = editor.isEmpty ? "" : editor.getHTML();
      if (withoutEmptyEnd(html) !== saved.current) {
        saved.current = withoutEmptyEnd(html);
        onChange(html);
      }
    },
  });

  // HTML code instead of the usual view (null: the usual view)
  const [code, setCode] = useState<string | null>(null);

  function toggleCode() {
    if (!editor) return;
    if (code === null) {
      setCode(readableHtml(editor.isEmpty ? "" : editor.getHTML()));
      return;
    }
    // Back to the usual view: the editor reads the code (what it cannot show is left out, and
    // the page gets the text as it is now)
    editor.commands.setContent(code.replace(/>\s*\n\s*</g, "><"), { emitUpdate: true });
    setCode(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/18 bg-white focus-within:border-brand-light focus-within:shadow-[0_0_0_4px_rgb(var(--brand-light-rgb)/0.2)]">
      {editor && <Toolbar editor={editor} uploadImage={uploadImage} codeMode={code !== null} onToggleCode={toggleCode} />}
      {code === null ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="bg-[#f6f8fc]">
          <textarea
            value={code}
            spellCheck={false}
            aria-label="HTML-код тексту"
            onChange={(event) => {
              setCode(event.target.value);
              saved.current = withoutEmptyEnd(event.target.value);
              onChange(event.target.value);
            }}
            className="block min-h-64 w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-[1.65] text-ink outline-none"
          />
          <p className="border-t border-ink/10 px-5 py-2.5 text-xs leading-normal text-ink-soft">
            Сайт залишає тільки оформлення редактора: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;ul&gt;/&lt;ol&gt;/&lt;li&gt;,
            &lt;a href&gt;, &lt;img&gt;, &lt;blockquote&gt;, &lt;br&gt;. Скрипти, стилі й інші теги прибираються для безпеки. Натисніть «HTML» ще раз, щоб
            повернутись до звичайного вигляду.
          </p>
        </div>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  uploadImage,
  codeMode,
  onToggleCode,
}: {
  editor: Editor;
  uploadImage: (file: File) => Promise<string | null>;
  /** The HTML code is shown: the other buttons wait */
  codeMode: boolean;
  onToggleCode: () => void;
}) {
  const { message } = App.useApp();
  const fileInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");

  // Which buttons are "on" where the cursor is
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      kind: editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p",
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      link: editor.isActive("link"),
      photo: editor.isActive("image"),
      align: editor.getAttributes("image").align as Align | null,
      size: editor.getAttributes("image").size as Size | null,
    }),
  });

  function setKind(kind: string) {
    const chain = editor.chain().focus();
    if (kind === "p") chain.setParagraph().run();
    else chain.setHeading({ level: kind === "h2" ? 2 : 3 }).run();
  }

  function openLink() {
    setLink(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }

  function saveLink() {
    const href = link.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!href) chain.unsetLink().run();
    else chain.setLink({ href, target: href.startsWith("http") ? "_blank" : null }).run();
    setLinkOpen(false);
  }

  /** Place of the selected photo; a photo on the left / right gets the medium size at first */
  function setPlace(align: Align) {
    const size = state.size ?? (align === "center" ? null : "m");
    editor.chain().focus().updateAttributes("image", { align, size }).run();
  }

  async function addImage(file: File) {
    const url = await uploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url, alt: "" }).run();
    else message.error("Не вдалося завантажити фото");
  }

  return (
    <div role="toolbar" aria-label="Оформлення тексту" className="flex flex-wrap items-center gap-1 border-b border-ink/12 bg-mist px-2.5 py-2">
      {/* The usual buttons (hidden while the HTML code is edited) */}
      <div className={`contents ${codeMode ? "[&>*]:hidden" : ""}`}>
      <Select
        size="small"
        value={state.kind}
        onChange={setKind}
        aria-label="Вид тексту"
        className="w-32"
        options={[
          { value: "p", label: "Абзац" },
          { value: "h2", label: "Заголовок" },
          { value: "h3", label: "Підзаголовок" },
        ]}
      />
      <Separator />
      <button type="button" aria-label="Жирний" aria-pressed={state.bold} className={toolButton} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </button>
      <button type="button" aria-label="Курсив" aria-pressed={state.italic} className={toolButton} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </button>
      <button type="button" aria-label="Підкреслений" aria-pressed={state.underline} className={toolButton} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline size={16} />
      </button>
      <Separator />
      <button type="button" aria-label="Список" aria-pressed={state.bullet} className={toolButton} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={17} />
      </button>
      <button type="button" aria-label="Нумерований список" aria-pressed={state.ordered} className={toolButton} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={17} />
      </button>
      <Separator />
      <button type="button" aria-label="Посилання" aria-pressed={state.link} className={toolButton} onClick={openLink}>
        <Link2 size={17} />
      </button>
      {state.link && (
        <button type="button" aria-label="Прибрати посилання" className={toolButton} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink size={16} />
        </button>
      )}
      <button type="button" aria-label="Фото в тексті" className={toolButton} onClick={() => fileInput.current?.click()}>
        <ImagePlus size={17} />
      </button>
      {/* Buttons of the selected photo */}
      {state.photo && (
        <>
          <Separator />
          <span className="px-1 text-xs font-bold text-ink-soft">Фото:</span>
          {places.map((place) => (
            <button
              key={place.value}
              type="button"
              title={place.label}
              aria-label={place.label}
              aria-pressed={(state.align ?? "center") === place.value}
              className={toolButton}
              onClick={() => setPlace(place.value)}
            >
              {place.icon}
            </button>
          ))}
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              title={size.label}
              aria-label={size.label}
              aria-pressed={state.size === size.value}
              className={`${toolButton} text-xs font-extrabold`}
              onClick={() => editor.chain().focus().updateAttributes("image", { size: size.value }).run()}
            >
              {size.text}
            </button>
          ))}
        </>
      )}
      </div>
      {/* Right: the HTML code of the text */}
      <button
        type="button"
        title={codeMode ? "Звичайний вигляд" : "Редагувати HTML-код"}
        aria-pressed={codeMode}
        className={`${toolButton} ml-auto px-2.5 text-xs font-extrabold`}
        onClick={onToggleCode}
      >
        <CodeXml size={16} />
        HTML
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) addImage(file);
        }}
      />

      <Modal
        title="Посилання"
        open={linkOpen}
        okText="Готово"
        cancelText="Скасувати"
        onOk={saveLink}
        onCancel={() => setLinkOpen(false)}
        destroyOnHidden
      >
        <p className="mb-3 text-sm text-ink-soft">
          Сторінка сайту (наприклад /carpigiani-gelato-university) або повна адреса (https://...). Порожнє поле прибирає
          посилання.
        </p>
        <Input autoFocus value={link} onChange={(e) => setLink(e.target.value)} onPressEnter={saveLink} placeholder="/carpigiani-gelato-university" />
      </Modal>
    </div>
  );
}
