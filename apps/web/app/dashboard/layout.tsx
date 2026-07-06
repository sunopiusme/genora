import type { ReactNode } from "react";
import { DashboardShell } from "@components/shared/dashboard-shell";
import { AuthOverlay } from "@features/auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <AuthOverlay />
    </>
  );
}
