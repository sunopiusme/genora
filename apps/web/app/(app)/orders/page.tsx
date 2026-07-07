import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Заказы",
  description: "Ваши заказы и покупки",
};

export default function OrdersPage() {
  return (
    <SectionPlaceholder
      title="Заказы"
      icon="solar:bag-4-linear"
      emptyTitle="Нет заказов"
      description="Ваши покупки появятся здесь."
    />
  );
}
