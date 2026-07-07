import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export const metadata: Metadata = {
  title: "Подписки",
  description: "Ваши подписки на AI-сервисы",
};

export default function SubscriptionsPage() {
  return (
    <SectionPlaceholder
      title="Подписки"
      icon="solar:card-2-linear"
      emptyTitle="Нет подписок"
      description="Ваши подписки появятся здесь."
    />
  );
}
