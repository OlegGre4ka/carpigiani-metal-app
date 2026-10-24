"use client";

import Link from "next/link";

import { resetAction } from "@/app/fofkas-adminpanel/actions";
import { resetSchema } from "@/lib/admin/schemas";
import {
  AuthCard,
  AuthText,
  AuthTitle,
  Field,
  FormError,
  SubmitButton,
  SuccessMark,
  buttonClass,
} from "./auth-ui";
import { useValidatedForm } from "./use-validated-form";

export function ResetForm({ token }: { token: string }) {
  const { state, formAction, bind, onSubmit } = useValidatedForm(resetSchema, resetAction, {
    password: "",
    confirm: "",
  });

  if (state.ok) {
    return (
      <AuthCard mark={false}>
        <SuccessMark />
        <AuthTitle>Пароль змінено</AuthTitle>
        <AuthText>Тепер ви можете увійти в адмін-панель з новим паролем.</AuthText>
        <Link href="/fofkas-adminpanel/login" className={buttonClass}>
          Увійти
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form action={formAction} onSubmit={onSubmit} noValidate>
        <input type="hidden" name="token" value={token} />
        <AuthTitle>Новий пароль</AuthTitle>
        <AuthText>Придумайте новий пароль для входу. Він має містити щонайменше 8 символів.</AuthText>
        <FormError message={state.error} />
        <Field {...bind("password")} label="Новий пароль" icon="lock" type="password" autoComplete="new-password" />
        <Field {...bind("confirm")} label="Повторіть пароль" icon="lock" type="password" autoComplete="new-password" />
        <div className="mt-1.5">
          <SubmitButton pendingText="Зберігаємо…">Зберегти пароль</SubmitButton>
        </div>
      </form>
    </AuthCard>
  );
}

/** The link from the email is wrong, already used or older than 1 hour */
export function InvalidLink() {
  return (
    <AuthCard>
      <AuthTitle>Посилання застаріло</AuthTitle>
      <AuthText>
        Посилання з листа вже використане або діяло понад годину. Надішліть новий лист, щоб створити пароль.
      </AuthText>
      <Link href="/fofkas-adminpanel/forgot-password" className={buttonClass}>
        Надіслати новий лист
      </Link>
    </AuthCard>
  );
}
