import { create } from "zustand";

import { INITIAL_TASKS } from "../data/tasks";
import type { Task, TaskStatus } from "../types";

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

type TaskStore = {
  tasks: Task[];
  cycleTaskStatus: (id: string) => void;
  moveTask: (id: string, status: TaskStatus, targetId?: string) => void;
};

function placeTask(
  tasks: Task[],
  id: string,
  status: TaskStatus,
  targetId?: string,
): Task[] {
  const active = tasks.find((task) => task.id === id);
  if (!active || id === targetId) {
    return tasks;
  }

  const moved: Task = { ...active, status };
  const rest = tasks.filter((task) => task.id !== id);
  const targetIndex =
    targetId === undefined
      ? -1
      : rest.findIndex((task) => task.id === targetId);

  if (targetIndex === -1) {
    return [...rest, moved];
  }

  const activeIndex = tasks.indexOf(active);
  const originalTargetIndex = tasks.findIndex((task) => task.id === targetId);
  const movingDown =
    active.status === status && activeIndex < originalTargetIndex;
  const insertIndex = movingDown ? targetIndex + 1 : targetIndex;

  return [
    ...rest.slice(0, insertIndex),
    moved,
    ...rest.slice(insertIndex),
  ];
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: INITIAL_TASKS,
  cycleTaskStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: NEXT_STATUS[task.status] } : task,
      ),
    })),
  moveTask: (id, status, targetId) =>
    set((state) => ({
      tasks: placeTask(state.tasks, id, status, targetId),
    })),
}));
