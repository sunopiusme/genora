import type { Profile } from "./types";

export const PROFILE: Profile = {
  name: "Иван Петров",
  username: "Иван",
  email: "ivan.petrov@example.com",
  plan: "Бесплатный",
  balance: 1250,
};

export function formatBalance(balance: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(balance);
}
