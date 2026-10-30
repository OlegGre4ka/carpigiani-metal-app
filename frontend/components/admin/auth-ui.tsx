"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { AdminMark } from "@/components/brand-logo";

// Building blocks of the login forms, styled as in the approved design.

export function AuthCard({ children, mark = true }: { children: ReactNode; mark?: boolean }) {
  return (
    <div className="w-full max-w-115 rounded-[36px] border border-white/70 bg-[rgb(var(--paper-rgb)/0.82)] px-10 pt-10 pb-8.5 shadow-[0_30px_70px_rgb(var(--shadow-rgb)/0.2)] backdrop-blur-[14px] max-[820px]:max-w-none max-[820px]:rounded-[30px] max-[820px]:px-5.5 max-[820px]:pt-7 max-[820px]:pb-6">
      {mark && (
        <div className="mb-5.5 flex items-center gap-3.5">
          <AdminMark className="h-14 w-auto" />
          <div className="text-xs font-extrabold tracking-[2px] text-steel uppercase">Адмін-панель</div>
        </div>
      )}
      {children}
    </div>
  );
}

export function AuthTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-2 font-heading tracking-[-0.02em] text-[38px] leading-none font-extrabold text-ink max-[820px]:text-[33px]">
      {children}
    </h1>
  );
}

export function AuthText({ children }: { children: ReactNode }) {
  return <p className="mb-6 text-[15px] leading-normal text-ink-soft">{children}</p>;
}

export function SuccessMark() {
  return (
    <div className="mb-4.5 flex size-16 items-center justify-center rounded-full bg-tag">
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-tag-ink"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12.5l5 5L20 6.5" />
      </svg>
    </div>
  );
}

const icons = {
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="3" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  icon: keyof typeof icons;
  error?: string;
};

/** Input with an icon on the left, an error under it, and an eye button for passwords. */
export function Field({ name, label, icon, error, type = "text", ...input }: FieldProps) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const errorId = `${name}-error`;

  return (
    <div className="mb-3.5">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 flex -translate-y-1/2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="stroke-steel"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icons[icon]}
          </svg>
        </span>
        <input
          id={name}
          name={name}
          type={isPassword && shown ? "text" : type}
          aria-label={label}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-[18px] border bg-white px-12 py-4 text-base font-semibold text-ink outline-none placeholder:font-semibold placeholder:text-ink-soft/70 focus:border-brand-light focus:shadow-[0_0_0_4px_rgb(var(--brand-light-rgb)/0.2)] ${
            error ? "border-danger" : "border-ink/16"
          }`}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Сховати пароль" : "Показати пароль"}
            aria-pressed={shown}
            className="absolute top-1/2 right-3.5 flex -translate-y-1/2 p-1"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-steel"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {shown && <path d="M4 4l16 16" />}
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 pl-2 text-[13px] font-semibold text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export const buttonClass =
  "btn-shine block w-full rounded-full bg-[image:var(--grad-btn)] px-8 py-4.25 text-center text-base font-extrabold text-white shadow-[0_12px_26px_rgb(var(--brand-rgb)/0.35)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0";

/** Main button of a form; shows a waiting text while the form is being sent. */
export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Error from the server (wrong password, too many attempts...) */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-2xl bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-ink">
      {message}
    </p>
  );
}

export const linkClass =
  "cursor-pointer border-b border-brand/35 text-sm font-semibold text-brand hover:text-ink";
