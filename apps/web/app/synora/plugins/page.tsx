import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Плагины",
  description: "Плагины и расширения песочницы Синора",
};

export default function SynoraPluginsPage() {
  return (
    <SectionPlaceholder
      title="Плагины"
      icon="solar:widget-add-linear"
      emptyTitle="Нет плагинов"
      description="Установленные плагины и расширения песочницы появятся здесь."
    />
  );
}
