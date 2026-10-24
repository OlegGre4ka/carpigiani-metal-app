"use client";

import Link from "next/link";

import { loginAction } from "@/app/fofkas-adminpanel/actions";
import { loginSchema } from "@/lib/admin/schemas";
import { AuthCard, AuthText, AuthTitle, Field, FormError, SubmitButton, linkClass } from "./auth-ui";
import { useValidatedForm } from "./use-validated-form";

export function LoginForm() {
  const { state, formAction, bind, onSubmit } = useValidatedForm(loginSchema, loginAction, {
    email: "",
    password: "",
  });

  return (
    <AuthCard>
      <form action={formAction} onSubmit={onSubmit} noValidate>
        <AuthTitle>Вхід</AuthTitle>
        <AuthText>Керування сайтом Carpigiani: слайди, обладнання, сторінки.</AuthText>
        <FormError message={state.error} />
        <Field {...bind("email")} label="Електронна пошта" icon="email" type="email" autoComplete="username" />
        <Field {...bind("password")} label="Пароль" icon="lock" type="password" autoComplete="current-password" />
        <div className="mt-0.5 mb-5 flex justify-end">
          <Link href="/fofkas-adminpanel/forgot-password" className={linkClass}>
            Забули пароль?
          </Link>
        </div>
        <SubmitButton pendingText="Входимо…">Увійти</SubmitButton>
      </form>
    </AuthCard>
  );
}
