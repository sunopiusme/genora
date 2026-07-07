import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { SearchOverlay } from "@/components/shared/search-overlay";
import { AUTH_COOKIE_NAME, AuthOverlay, parseAuthCookie } from "@features/auth";
import { SynoraShell } from "@features/synora";

export const metadata: Metadata = {
  title: {
    default: "Синора",
    template: "%s · Синора",
  },
  description: "Песочница для написания кода на платформе Genora",
};

export default async function SynoraLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialUser = parseAuthCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return (
    <>
      <SynoraShell initialUser={initialUser}>{children}</SynoraShell>
      <AuthOverlay />
      <SearchOverlay />
    </>
  );
}
