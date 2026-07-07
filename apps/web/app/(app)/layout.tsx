import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@/components/shared/app-shell";
import { SearchOverlay } from "@/components/shared/search-overlay";
import { AUTH_COOKIE_NAME, AuthOverlay, parseAuthCookie } from "@features/auth";

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
      <SearchOverlay />
    </>
  );
}
