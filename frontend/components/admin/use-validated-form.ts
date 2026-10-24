"use client";

import { useActionState, useState, type FormEvent } from "react";
import type { z } from "zod";

import { type FieldErrors, type FormState, fieldErrors } from "@/lib/admin/schemas";

/**
 * Form with a Server Action and instant checks in the browser.
 * Values are kept in state, so they don't disappear after a server error.
 */
export function useValidatedForm<T extends Record<string, string>>(
  schema: z.ZodType,
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  initialValues: T,
) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const [values, setValues] = useState<T>(initialValues);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [edited, setEdited] = useState<Record<string, boolean>>({});
  const [lastState, setLastState] = useState(state);

  // A new answer from the server: its field errors are shown again
  if (state !== lastState) {
    setLastState(state);
    setEdited({});
  }

  const errorFor = (name: keyof T & string) =>
    clientErrors[name] ?? (edited[name] ? undefined : state.fields?.[name]);

  const bind = (name: keyof T & string) => ({
    name,
    value: values[name],
    error: errorFor(name),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [name]: event.target.value }));
      setClientErrors((e) => ({ ...e, [name]: undefined }));
      setEdited((e) => ({ ...e, [name]: true }));
    },
  });

  // Check in the browser first; send to the server only when everything is filled in correctly
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(parsed.error));
    } else {
      setClientErrors({});
    }
  };

  return { state, formAction, values, bind, onSubmit };
}
