import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Подписки — Genora",
  description: "Ваши активные подписки на AI-сервисы",
};

export default function SubscriptionsPage() {
  return (
    <SectionPlaceholder
      title="Подписки"
      icon="solar:card-2-linear"
      description="Когда вы оформите подписку на AI-сервис, она появится здесь — со сроком действия и управлением оплатой."
    />
  );
}
