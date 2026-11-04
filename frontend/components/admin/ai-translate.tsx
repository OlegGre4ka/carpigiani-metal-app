"use client";

import { App, Button, Dropdown, Space } from "antd";
import { ChevronDown, Languages } from "lucide-react";
import { useState } from "react";

import { json, readError, useAdminCall } from "./admin-fetch";

// "Перекласти англійською (AI)" (5.11): one button in the language bar of a page of the admin
// panel. It takes the Ukrainian texts of the page (the title, the texts of the blocks, tables,
// captions, the short text of a news item...), Gemini translates them (POST /api/admin/ai/
// translate) and the English fields are filled. Nothing is saved: the admin reads the English
// version and presses "Save" as usual. By default only the empty English fields are filled
// (what was written by hand stays); "Перекласти все наново" translates every text again.

type Item = { id: string; text: string };

/** The texts to translate: every {uk, en} pair and every *_uk / *_en pair in the page */
function collect(value: unknown, all: boolean, path: string[] = [], found: Item[] = []): Item[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collect(item, all, [...path, String(index)], found));
    return found;
  }
  if (!value || typeof value !== "object") return found;
  const record = value as Record<string, unknown>;
  if (typeof record.uk === "string" && typeof record.en === "string") {
    if (record.uk.trim() && (all || !record.en.trim())) found.push({ id: [...path, "en"].join("/"), text: record.uk });
    return found;
  }
  for (const [key, inner] of Object.entries(record)) {
    const en = key.endsWith("_uk") ? `${key.slice(0, -3)}_en` : null;
    if (en && typeof inner === "string" && typeof record[en] === "string") {
      if (inner.trim() && (all || !(record[en] as string).trim())) found.push({ id: [...path, en].join("/"), text: inner });
    } else if (inner && typeof inner === "object") {
      collect(inner, all, [...path, key], found);
    }
  }
  return found;
}

/** A copy of the page with the translations put in their places */
function apply<T>(value: T, translations: Record<string, string>): T {
  const copy = structuredClone(value);
  for (const [id, text] of Object.entries(translations)) {
    const keys = id.split("/");
    let target: Record<string, unknown> | unknown[] = copy as Record<string, unknown>;
    for (const key of keys.slice(0, -1)) {
      target = (target as Record<string, unknown>)[key] as Record<string, unknown>;
      if (!target || typeof target !== "object") break;
    }
    if (target && typeof target === "object") (target as Record<string, unknown>)[keys[keys.length - 1]] = text;
  }
  return copy;
}

export function TranslateButton<T>({ value, onApply }: { value: T; onApply: (translated: T) => void }) {
  const { message } = App.useApp();
  const call = useAdminCall();
  const [busy, setBusy] = useState(false);

  async function translate(all: boolean) {
    const items = collect(value, all);
    if (items.length === 0) {
      message.info(all ? "На сторінці ще немає українського тексту." : "Усі англійські тексти вже заповнені. Щоб перекласти наново — стрілка поруч з кнопкою.");
      return;
    }
    setBusy(true);
    try {
      const response = await call("/api/admin/ai/translate", json("POST", { items }));
      if (!response.ok) {
        message.error(await readError(response));
        return;
      }
      const { items: translations }: { items: Record<string, string> } = await response.json();
      const count = Object.keys(translations).length;
      if (count === 0) {
        message.error("AI не повернув перекладу. Спробуйте ще раз.");
        return;
      }
      onApply(apply(value, translations));
      message.success(`Перекладено текстів: ${count}. Перевірте англійську версію і збережіть сторінку.`);
      if (count < items.length) message.warning(`Не перекладено: ${items.length - count}. Їх можна дописати вручну.`);
    } catch (error) {
      if (error instanceof Error && error.message !== "logged out") message.error("Не вдалося. Перевірте зв'язок.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space.Compact>
      <Button
        loading={busy}
        onClick={() => translate(false)}
        icon={<Languages size={16} aria-hidden="true" />}
        title="Заповнює порожні англійські поля перекладом українського тексту. Нічого не зберігає: перевірте і натисніть «Зберегти»."
      >
        {busy ? "Перекладаю…" : "Перекласти англійською (AI)"}
      </Button>
      <Dropdown
        disabled={busy}
        trigger={["click"]}
        menu={{
          items: [{ key: "all", label: "Перекласти все наново (замінить англійський текст)" }],
          onClick: () => translate(true),
        }}
      >
        <Button aria-label="Інші варіанти перекладу" icon={<ChevronDown size={16} />} />
      </Dropdown>
    </Space.Compact>
  );
}
