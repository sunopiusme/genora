"use client";

import { PRODUCT_CATEGORY_FILTERS } from "../catalog";
import { useShowcaseStore } from "../stores/showcase-store";
import styles from "./showcase-filter.module.css";

export function ShowcaseFilter() {
  const categoryFilter = useShowcaseStore((state) => state.categoryFilter);
  const setCategoryFilter = useShowcaseStore(
    (state) => state.setCategoryFilter,
  );

  return (
    <nav className={styles.filter} aria-label="Категории товаров">
      <div className={styles.track} role="tablist" aria-orientation="horizontal">
        {PRODUCT_CATEGORY_FILTERS.map((category) => {
          const isActive = category.id === categoryFilter;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={styles.chip}
              data-active={isActive || undefined}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
