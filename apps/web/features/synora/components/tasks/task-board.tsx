"use client";

import { PageHeader } from "@/components/shared/page-header";
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

  return (
    <main className={styles.page}>
      <PageHeader title="Задачи" />

      <div className={styles.scroll}>
        <div className={styles.board}>
          {TASK_STATUS_ORDER.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function TaskColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  return (
    <section className={styles.column} aria-label={TASK_STATUS_LABELS[status]}>
      <header className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{TASK_STATUS_LABELS[status]}</h2>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className={styles.columnEmpty}>Нет задач</p>
      ) : (
        <ul className={styles.cardList}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  const cycleTaskStatus = useTaskStore((state) => state.cycleTaskStatus);

  return (
    <li className={styles.card} data-status={task.status}>
      <span className={styles.cardTitle}>{task.title}</span>
      {task.project ? (
        <span className={styles.cardProject}>{task.project}</span>
      ) : null}
      <div className={styles.cardFooter}>
        <span className={styles.cardPriority}>
          <span
            className={styles.priorityDot}
            data-priority={task.priority}
            aria-hidden="true"
          />
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
        {task.age ? <span className={styles.cardAge}>{task.age}</span> : null}
        <button
          type="button"
          className={styles.statusBadge}
          data-status={task.status}
          onClick={() => cycleTaskStatus(task.id)}
          aria-label={`Изменить статус задачи «${task.title}»`}
        >
          <StatusGlyph status={task.status} />
          {TASK_STATUS_LABELS[task.status]}
        </button>
      </div>
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
