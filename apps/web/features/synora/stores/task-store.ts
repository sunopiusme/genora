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
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: INITIAL_TASKS,
  cycleTaskStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: NEXT_STATUS[task.status] } : task,
      ),
    })),
}));
