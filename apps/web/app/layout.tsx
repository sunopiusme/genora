import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Genora Pro",
  description: "Магазин подписок на AI-сервисы",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
