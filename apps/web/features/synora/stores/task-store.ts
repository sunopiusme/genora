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
  addTask: (title: string) => void;
  cycleTaskStatus: (id: string) => void;
  removeTask: (id: string) => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: INITIAL_TASKS,
  addTask: (title) =>
    set((state) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        status: "todo",
        priority: "medium",
      };
      return { tasks: [newTask, ...state.tasks] };
    }),
  cycleTaskStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: NEXT_STATUS[task.status] } : task,
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
}));
