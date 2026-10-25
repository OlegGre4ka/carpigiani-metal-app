"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// A small round "Copy" button next to an email or a phone (on a computer a click on them may
// open nothing: no mail program or phone is set up there). "Copied" shows for 2 seconds.

export function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslations("ContactsPage");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Old browsers / no permission: copy through a hidden field
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${t("copy")}: ${label}`}
      title={copied ? t("copied") : t("copy")}
      className={`relative inline-flex size-7.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
        copied ? "border-tag bg-tag text-tag-ink" : "border-ink/12 bg-white text-brand hover:bg-mist"
      }`}
    >
      {copied ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : <Copy size={14} strokeWidth={2.2} aria-hidden="true" />}
      {/* "Copied" next to the button */}
      <span
        role="status"
        className={`pointer-events-none absolute left-full ml-2 rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap text-white transition-opacity duration-200 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        {copied ? t("copied") : ""}
      </span>
    </button>
  );
}
