import type { Metadata } from "next";
import { TaskBoard } from "@features/synora";

export const metadata: Metadata = {
  title: "Задачи",
  description: "Задачи по проектам песочницы Синора",
};

export default function SynoraTasksPage() {
  return <TaskBoard />;
}
