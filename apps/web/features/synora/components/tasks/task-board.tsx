"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

import { PageHeader } from "@/components/shared/page-header";
import { useTaskStore } from "../../stores/task-store";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "../../data/tasks";
import type { Task, TaskPriority, TaskStatus } from "../../types";
import styles from "./task-board.module.css";

const TASK_STATUS_SET = new Set<TaskStatus>(TASK_STATUS_ORDER);

function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUS_SET.has(value as TaskStatus);
}

export function TaskBoard() {
  const tasks = useTaskStore((state) => state.tasks);
  const moveTaskToStatus = useTaskStore((state) => state.moveTaskToStatus);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
  );

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const targetStatus = event.over?.id;
    if (isTaskStatus(targetStatus)) {
      moveTaskToStatus(String(event.active.id), targetStatus);
    }
  }

  return (
    <main className={styles.page}>
      <PageHeader title="Задачи" />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
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

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeTask ? <TaskCardContent task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function TaskColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      data-drop-active={isOver || undefined}
      aria-label={TASK_STATUS_LABELS[status]}
    >
      <header className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{TASK_STATUS_LABELS[status]}</h2>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className={styles.columnEmpty}>Нет задач</p>
      ) : (
        <ul className={styles.cardList}>
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DraggableTaskCard({ task }: { task: Task }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <li
      ref={setNodeRef}
      className={styles.cardSlot}
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
    >
      <TaskCardContent task={task} />
    </li>
  );
}

function TaskCardContent({
  task,
  isOverlay = false,
}: {
  task: Task;
  isOverlay?: boolean;
}) {
  const cycleTaskStatus = useTaskStore((state) => state.cycleTaskStatus);

  return (
    <div
      className={styles.card}
      data-status={task.status}
      data-overlay={isOverlay || undefined}
    >
      <span className={styles.cardTitle}>{task.title}</span>
      {task.project ? (
        <span className={styles.cardProject}>{task.project}</span>
      ) : null}
      <div className={styles.cardFooter}>
        <span
          className={styles.cardPriority}
          title={TASK_PRIORITY_LABELS[task.priority]}
        >
          <PriorityGlyph priority={task.priority} />
          <span className={styles.srOnly}>
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
        </span>
        {task.age ? <span className={styles.cardAge}>{task.age}</span> : null}
        <button
          type="button"
          className={styles.statusButton}
          data-status={task.status}
          onClick={() => cycleTaskStatus(task.id)}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`Изменить статус задачи «${task.title}»`}
          title={TASK_STATUS_LABELS[task.status]}
        >
          <StatusGlyph status={task.status} />
        </button>
      </div>
    </div>
  );
}

const PRIORITY_BAR_HEIGHTS = [4, 7, 10];

const PRIORITY_FILLED_BARS: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function PriorityGlyph({ priority }: { priority: TaskPriority }) {
  const filledBars = PRIORITY_FILLED_BARS[priority];

  return (
    <svg
      viewBox="0 0 14 12"
      className={styles.priorityIcon}
      data-priority={priority}
      aria-hidden="true"
    >
      {PRIORITY_BAR_HEIGHTS.map((height, index) => (
        <rect
          key={height}
          x={index * 5}
          y={11 - height}
          width="3"
          height={height}
          rx="1"
          className={index < filledBars ? styles.priorityBarFilled : styles.priorityBar}
        />
      ))}
    </svg>
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
        strokeDasharray="2.5 2.6"
        fill="none"
      />
    </svg>
  );
}
