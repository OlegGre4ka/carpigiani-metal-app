import { Suspense } from "react";

import { InvalidLink, ResetForm } from "@/components/admin/reset-form";
import { backendFetch } from "@/lib/admin/backend";

type Props = { searchParams: Promise<{ token?: string }> };

// The page from the "forgot password" email: /fofkas-adminpanel/reset-password?token=...
export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <ResetContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetContent({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  if (!(await isValidToken(token))) return <InvalidLink />;
  return <ResetForm token={token} />;
}

async function isValidToken(token: string): Promise<boolean> {
  if (token.length < 20) return false;
  try {
    const response = await backendFetch(`/api/auth/reset-password/check?token=${encodeURIComponent(token)}`);
    if (!response.ok) return false;
    return Boolean(((await response.json()) as { valid?: boolean }).valid);
  } catch {
    return false;
  }
}
