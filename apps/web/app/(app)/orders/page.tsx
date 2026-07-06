import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Заказы — Genora",
  description: "История ваших заказов",
};

export default function OrdersPage() {
  return (
    <SectionPlaceholder
      title="Заказы"
      icon="solar:bag-4-linear"
      description="Здесь будет история ваших покупок и заказов — статусы, чеки и детали оплаты."
    />
  );
}
