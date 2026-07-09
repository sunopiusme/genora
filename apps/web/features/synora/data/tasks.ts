import type { Task, TaskPriority, TaskStatus } from "../types";

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "in-progress",
  "todo",
  "done",
  "archived",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  "in-progress": "В работе",
  todo: "К выполнению",
  done: "Готово",
  archived: "Архив",
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
    description: "Довести жесты закрытия и отступ безопасной зоны",
    status: "in-progress",
    priority: "high",
    project: "Genora",
    age: "2д",
  },
  {
    id: "task-project-branch-sync",
    title: "Синхронизация проекта и ветки",
    description: "Единый выбор в композере и сайдбаре",
    status: "in-progress",
    priority: "medium",
    project: "Synora",
    age: "5д",
  },
  {
    id: "task-modal-radius",
    title: "Единый радиус модальных окон",
    description: "Выровнять скругления по токенам дизайна",
    status: "todo",
    priority: "medium",
    project: "Genora",
    age: "1д",
  },
  {
    id: "task-composer-picker",
    title: "Picker проектов в композере",
    description: "Поповер с поиском и подменю добавления",
    status: "todo",
    priority: "low",
    project: "Synora",
    age: "8д",
  },
  {
    id: "task-design-tokens",
    title: "Токены радиусов и теней",
    description: "Согласовать масштаб теней между пакетами",
    status: "todo",
    priority: "low",
    project: "@genora/ui",
    age: "12д",
  },
  {
    id: "task-email-truncation",
    title: "Усечение email в строке профиля",
    description: "Многоточие вместо переноса длинных адресов",
    status: "done",
    priority: "medium",
    project: "Genora",
    age: "36д",
  },
];
