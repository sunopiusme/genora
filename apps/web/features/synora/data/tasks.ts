import type { Task, TaskPriority, TaskStatus } from "../types";

export const TASK_STATUS_ORDER: TaskStatus[] = ["in-progress", "todo", "done"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  "in-progress": "В работе",
  todo: "К выполнению",
  done: "Готово",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-profile-sheet",
    title: "Шторка профиля на мобильных",
    status: "in-progress",
    priority: "high",
    project: "Genora",
  },
  {
    id: "task-project-branch-sync",
    title: "Синхронизация проекта и ветки",
    status: "in-progress",
    priority: "medium",
    project: "Synora",
  },
  {
    id: "task-modal-radius",
    title: "Единый радиус модальных окон",
    status: "todo",
    priority: "medium",
    project: "Genora",
  },
  {
    id: "task-composer-picker",
    title: "Picker проектов в композере",
    status: "todo",
    priority: "low",
    project: "Synora",
  },
  {
    id: "task-design-tokens",
    title: "Токены радиусов и теней",
    status: "todo",
    priority: "low",
    project: "@genora/ui",
  },
  {
    id: "task-email-truncation",
    title: "Усечение email в строке профиля",
    status: "done",
    priority: "medium",
    project: "Genora",
  },
];
