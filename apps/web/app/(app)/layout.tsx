import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@components/shared/app-shell";
import { AuthOverlay } from "@features/auth";
import { AUTH_COOKIE_NAME, type AuthUser } from "@/stores/auth-store";

function parseAuthCookie(value: string | undefined): AuthUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<AuthUser>;
    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") {
      return null;
    }
    return { email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialUser = parseAuthCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return (
    <>
      <AppShell initialUser={initialUser}>{children}</AppShell>
      <AuthOverlay />
    </>
  );
}
