"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type FormEvent, type Ref } from "react";

import { Spinner } from "@/components/cone-loader";
import { contactSchema, type ContactValues } from "@/lib/contact-schema";
import { usePhones } from "@/lib/contacts-store";

// THE contact form of the site: one form in two places.
// - variant "page": on equipment pages, in the right column (it sticks while scrolling);
//   the title is "Get a quote" and the line "Inquiry about: <equipment>" is shown.
// - variant "popup": inside the "Contact us" window of the floating button (on phones, on
//   equipment pages it also shows "Inquiry about").
// Email is required, the rest is optional; no "I am not a robot" (a hidden trap field instead).
// States: error in a field, sending, sent, sending failed (entered data is kept).
// Look and motion: claude/equipment-page-design.md and equipment-page-animation.md.

type Status = "idle" | "sending" | "sent" | "failed" | "tooMany";
const empty: ContactValues = { name: "", email: "", phone: "", message: "" };

export function ContactForm({
  variant,
  subject = "",
  page = "",
  firstFieldRef,
  heading,
}: {
  variant: "page" | "popup";
  /** The equipment the request is about ("Carpigiani Maestro") */
  subject?: string;
  /** Address of the page it is sent from */
  page?: string;
  /** The window puts the cursor here when it opens */
  firstFieldRef?: Ref<HTMLInputElement>;
  /** "contact": the title "Contact us" also in the right column (news pages) */
  heading?: "quote" | "contact";
}) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  // From the admin panel ("Contacts")
  const contactPhones = usePhones();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactValues, string>>>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // A new number restarts the "shake" of the email field
  const [shake, setShake] = useState(0);
  const trap = useRef<HTMLInputElement>(null);

  const schema = contactSchema({ email: t("emailError"), phone: t("phoneError") });
  const sending = status === "sending";

  function check(next: ContactValues) {
    const result = schema.safeParse(next);
    const found: typeof errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactValues;
        found[key] ??= issue.message;
      }
    }
    setErrors(found);
    return found;
  }

  function change(field: keyof ContactValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // After the first try the hints update while typing
    if (tried) check(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setTried(true);
    const found = check(values);
    if (Object.keys(found).length) {
      if (found.email) setShake((n) => n + 1);
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          subject,
          page,
          lang: locale === "en" ? "en" : "uk",
          website: trap.current?.value ?? "",
        }),
      });
      if (response.status === 429) return setStatus("tooMany");
      if (!response.ok) return setStatus("failed");
      setStatus("sent");
      setValues(empty);
      setTried(false);
    } catch {
      setStatus("failed");
    }
  }

  const title = (heading ?? (variant === "page" ? "quote" : "contact")) === "quote" ? t("quoteTitle") : t("title");
  const inquiry = subject ? (
    <p className="mb-2.5 inline-flex max-w-full items-center gap-1.75 rounded-full bg-mist px-3 py-1.5 text-[12.5px] font-extrabold text-brand">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="M3 12V4h8l10 10-8 8z" />
        <circle cx="7.5" cy="8.5" r="1.2" />
      </svg>
      <span className="truncate">
        {t("inquiry")} <span className="text-ink">{subject}</span>
      </span>
    </p>
  ) : null;
  const phones = (
    <p className="mt-2.5 text-center text-[12.5px] leading-normal text-ink-soft">
      {t("orCall")}
      <br />
      {contactPhones.map((phone, index) => (
        <a key={phone.href} href={phone.href} className={`font-extrabold whitespace-nowrap text-brand hover:text-ink ${index ? "ml-3" : ""}`}>
          {phone.label}
        </a>
      ))}
    </p>
  );

  if (status === "sent") {
    return (
      <div role="status" className="cf-swap px-1 pt-2.5 pb-1 text-center">
        <div className="cf-pop mx-auto mt-0.5 mb-3.5 flex size-16 items-center justify-center rounded-full bg-tag">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="stroke-tag-ink" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="cf-draw" d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h3 className="mb-2 font-heading tracking-[-0.02em] text-[23px] leading-none font-extrabold metal-text-dark">{t("thanksTitle")}</h3>
        <p className="mb-3.5 text-sm leading-normal text-ink-soft">{t("thanksText")}</p>
        {inquiry}
        {phones}
      </div>
    );
  }

  const field = (error?: string) =>
    `mb-2 block w-full resize-none rounded-[15px] border bg-white px-3.75 py-2.75 text-[14.5px] font-semibold text-ink outline-none transition-[border-color,box-shadow] placeholder:font-semibold placeholder:text-hint focus:border-brand-light focus:shadow-[0_0_0_4px_rgb(var(--brand-light-rgb)/0.2)] ${
      error ? "border-danger bg-danger-pale shadow-[0_0_0_3px_rgb(var(--danger-rgb)/0.12)]" : "border-ink/16"
    }`;
  const fieldIds = { email: "contact-email-error", phone: "contact-phone-error" };

  return (
    <form onSubmit={submit} noValidate className="text-ink">
      <h3 className={`mb-1 font-heading tracking-[-0.02em] text-[23px] leading-[1.02] font-extrabold metal-text-dark ${variant === "popup" ? "pr-10" : ""}`}>{title}</h3>
      <p className="mb-2.5 text-[13px] leading-[1.45] text-ink-soft">{t("text")}</p>
      {inquiry}

      {(status === "failed" || status === "tooMany") && (
        <p role="alert" className="cf-drop mb-2.5 flex items-start gap-2.5 rounded-2xl bg-danger-bg px-3.25 py-2.75 text-[13px] leading-snug font-bold text-danger-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className="mt-px shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
          {status === "tooMany" ? t("tooMany") : t("sendFailed")}
        </p>
      )}

      {/* Spam trap: people do not see it, bots fill it */}
      <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <fieldset disabled={sending} className={`transition-opacity ${sending ? "opacity-60" : ""}`}>
        <input
          ref={firstFieldRef}
          name="name"
          autoComplete="name"
          placeholder={t("name")}
          aria-label={t("name")}
          value={values.name}
          onChange={(e) => change("name", e.target.value)}
          className={field()}
        />
        <input
          key={`email-${shake}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("email")}
          aria-label={t("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? fieldIds.email : undefined}
          value={values.email}
          onChange={(e) => change("email", e.target.value)}
          className={`${field(errors.email)} ${shake ? "cf-shake" : ""}`}
        />
        {errors.email && <FieldError id={fieldIds.email} text={errors.email} />}
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phone")}
          aria-label={t("phone")}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? fieldIds.phone : undefined}
          value={values.phone}
          onChange={(e) => change("phone", e.target.value)}
          className={field(errors.phone)}
        />
        {errors.phone && <FieldError id={fieldIds.phone} text={errors.phone} />}
        <textarea
          name="message"
          rows={2}
          placeholder={t("message")}
          aria-label={t("message")}
          value={values.message}
          onChange={(e) => change("message", e.target.value)}
          className={field()}
        />
      </fieldset>

      <button
        type="submit"
        disabled={sending}
        className="btn-shine mt-0.5 flex w-full items-center justify-center gap-2.5 rounded-full bg-[image:var(--grad-btn)] p-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_22px_rgb(var(--brand-rgb)/0.3)] transition hover:brightness-108 disabled:cursor-default disabled:saturate-70"
      >
        {sending && <Spinner />}
        {sending ? t("sending") : status === "failed" ? t("retry") : t("send")}
      </button>
      {phones}
    </form>
  );
}

function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} className="cf-fade -mt-1 mb-2 pl-1 text-xs font-bold text-danger-ink">
      {text}
    </p>
  );
}
