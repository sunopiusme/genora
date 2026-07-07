import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: {
    default: "Genora Pro",
    template: "%s · Genora",
  },
  description: "Магазин подписок на AI-сервисы",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  interactiveWidget: "resizes-content" as const,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
