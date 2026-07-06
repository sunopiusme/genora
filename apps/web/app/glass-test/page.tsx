import type { Metadata } from "next";
import { GlassTestClient } from "./glass-test-client";

export const metadata: Metadata = {
  title: "Liquid Glass — тест",
  description: "Сравнение CSS+SVG и WebGL реализаций эффекта Liquid Glass",
};

export default function GlassTestPage() {
  return <GlassTestClient />;
}
