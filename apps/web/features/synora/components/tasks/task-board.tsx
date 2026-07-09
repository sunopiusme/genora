"use client";

import { useState, type KeyboardEvent } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/lib/icon";
import { useTaskStore } from "../../stores/task-store";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "../../data/tasks";
import type { Task, TaskStatus } from "../../types";
import styles from "./task-board.module.css";

export function TaskBoard() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const [draftTitle, setDraftTitle] = useState("");

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
    if (event.key !== "Enter" || isComposing) {
      return;
    }
    const title = draftTitle.trim();
    if (!title) {
      return;
    }
    addTask(title);
    setDraftTitle("");
  }

  return (
    <main className={styles.page}>
      <PageHeader title="Задачи" />

      <div className={styles.scroll}>
        <div className={styles.inner}>
          <div className={styles.quickAdd}>
            <Icon
              icon="solar:add-circle-linear"
              className={styles.quickAddIcon}
              aria-hidden="true"
            />
            <input
              type="text"
              className={styles.quickAddInput}
              placeholder="Новая задача"
              aria-label="Новая задача"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleDraftKeyDown}
            />
          </div>

          {tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon
                icon="solar:checklist-minimalistic-linear"
                className={styles.emptyIcon}
                aria-hidden="true"
              />
              <h2 className={styles.emptyTitle}>Нет задач</h2>
              <p className={styles.emptyText}>
                Добавьте первую задачу, чтобы спланировать работу над
                проектами.
              </p>
            </div>
          ) : (
            TASK_STATUS_ORDER.map((status) => (
              <TaskGroup
                key={status}
                status={status}
                tasks={tasks.filter((task) => task.status === status)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function TaskGroup({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.group}
      aria-label={TASK_STATUS_LABELS[status]}
    >
      <header className={styles.groupHeader}>
        <h2 className={styles.groupTitle}>{TASK_STATUS_LABELS[status]}</h2>
        <span className={styles.groupCount}>{tasks.length}</span>
      </header>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}

function TaskRow({ task }: { task: Task }) {
  const cycleTaskStatus = useTaskStore((state) => state.cycleTaskStatus);
  const removeTask = useTaskStore((state) => state.removeTask);

  return (
    <li className={styles.row} data-status={task.status}>
      <button
        type="button"
        className={styles.statusButton}
        data-status={task.status}
        onClick={() => cycleTaskStatus(task.id)}
        aria-label={`Изменить статус задачи «${task.title}»`}
      >
        <StatusGlyph status={task.status} />
      </button>
      <div className={styles.rowBody}>
        <span className={styles.rowTitle}>{task.title}</span>
        <span className={styles.rowMeta}>
          <span
            className={styles.priorityDot}
            data-priority={task.priority}
            aria-hidden="true"
          />
          {TASK_PRIORITY_LABELS[task.priority]}
          {task.project ? ` · ${task.project}` : null}
        </span>
      </div>
      <button
        type="button"
        className={styles.removeButton}
        onClick={() => removeTask(task.id)}
        aria-label={`Удалить задачу «${task.title}»`}
      >
        <Icon
          icon="solar:trash-bin-minimalistic-linear"
          className={styles.removeIcon}
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

function StatusGlyph({ status }: { status: TaskStatus }) {
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" className={styles.statusIcon} aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path
          d="m5.1 8.3 2 2 3.8-4.4"
          stroke="var(--color-background)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (status === "in-progress") {
    return (
      <svg viewBox="0 0 16 16" className={styles.statusIcon} aria-hidden="true">
        <circle
          cx="8"
          cy="8"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M8 4.5a3.5 3.5 0 0 1 0 7Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className={styles.statusIcon} aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
