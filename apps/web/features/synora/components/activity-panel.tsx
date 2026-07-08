"use client";

import { useState } from "react";
import styles from "./activity-panel.module.css";
import {
  ACTIVITY_COLUMNS,
  ACTIVITY_PERIODS,
  DEFAULT_ACTIVITY_PERIOD,
  type ActivityPeriodId,
} from "../data/activity";

export function ActivityPanel() {
  const [periodId, setPeriodId] = useState<ActivityPeriodId>("all");
  const period =
    ACTIVITY_PERIODS.find((candidate) => candidate.id === periodId) ??
    DEFAULT_ACTIVITY_PERIOD;

  return (
    <section className={styles.panel} aria-label="Активность в Синоре">
      <header className={styles.header}>
        <h2 className={styles.title}>Активность</h2>
        <div
          className={styles.filters}
          role="tablist"
          aria-label="Период активности"
        >
          {ACTIVITY_PERIODS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              aria-selected={candidate.id === period.id}
              className={styles.filter}
              data-active={candidate.id === period.id}
              onClick={() => setPeriodId(candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      </header>

      <dl className={styles.stats}>
        {period.stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt className={styles.statLabel}>{stat.label}</dt>
            <dd className={styles.statValue}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div
        className={styles.grid}
        style={{ "--activity-columns": ACTIVITY_COLUMNS } as React.CSSProperties}
        role="img"
        aria-label="Карта активности по дням"
      >
        {period.cells.map((level, index) => (
          <span
            key={`${period.id}-${index}`}
            className={styles.cell}
            data-level={level}
          />
        ))}
      </div>

      <p className={styles.legend}>Каждый квадрат это день работы с Синорой</p>
    </section>
  );
}
