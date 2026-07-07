import { redirect } from "next/navigation";

/**
 * Главная страница платформы — песочница «Синора».
 * Витрина Genora переехала на /genora и доступна из меню Синоры.
 */
export default function RootPage() {
  redirect("/synora");
}
