"use client";

import Link from "next/link";

import { forgotAction } from "@/app/fofkas-adminpanel/actions";
import { forgotSchema } from "@/lib/admin/schemas";
import {
  AuthCard,
  AuthText,
  AuthTitle,
  Field,
  FormError,
  SubmitButton,
  SuccessMark,
  buttonClass,
  linkClass,
} from "./auth-ui";
import { useValidatedForm } from "./use-validated-form";

export function ForgotForm() {
  const { state, formAction, bind, onSubmit } = useValidatedForm(forgotSchema, forgotAction, { email: "" });

  if (state.ok) {
    return (
      <AuthCard mark={false}>
        <SuccessMark />
        <AuthTitle>Лист надіслано</AuthTitle>
        <AuthText>
          Перевірте пошту й перейдіть за посиланням, щоб створити новий пароль. Якщо листа немає, зазирніть у «Спам».
        </AuthText>
        <Link href="/fofkas-adminpanel/login" className={buttonClass}>
          Повернутися до входу
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form action={formAction} onSubmit={onSubmit} noValidate>
        <AuthTitle>Відновлення пароля</AuthTitle>
        <AuthText>
          Вкажіть пошту, з якою ви входите. Ми надішлемо лист із посиланням, щоб створити новий пароль.
        </AuthText>
        <FormError message={state.error} />
        <Field {...bind("email")} label="Електронна пошта" icon="email" type="email" autoComplete="username" />
        <div className="mt-1.5">
          <SubmitButton pendingText="Надсилаємо…">Надіслати посилання</SubmitButton>
        </div>
        <div className="mt-4.5 text-center">
          <Link href="/fofkas-adminpanel/login" className={`${linkClass} border-0`}>
            ← Повернутися до входу
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
