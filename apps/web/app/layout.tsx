import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Genora Pro",
  description: "Магазин подписок на AI-сервисы",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
