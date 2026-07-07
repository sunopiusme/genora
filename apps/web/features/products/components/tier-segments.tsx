"use client";

import type { Product } from "../types";
import styles from "./tier-segments.module.css";

type TierSegmentsProps = {
  product: Product;
  tierIndex: number;
  onTierChange: (index: number) => void;
};

/**
 * Статичный сегментированный выбор уровня: все опции видны сразу,
 * без выпадающего меню и без сдвигов макета при переключении.
 */
export function TierSegments({
  product,
  tierIndex,
  onTierChange,
}: TierSegmentsProps) {
  const captionId = `tier-caption-${product.id}`;

  return (
    <div className={styles.root}>
      <span className={styles.caption} id={captionId}>
        Уровень
      </span>
      <div className={styles.track} role="radiogroup" aria-labelledby={captionId}>
        {product.tiers.map((tier, index) => (
          <button
            key={tier.id}
            type="button"
            role="radio"
            aria-checked={index === tierIndex}
            className={
              index === tierIndex ? styles.segmentSelected : styles.segment
            }
            onClick={() => onTierChange(index)}
          >
            {tier.name}
          </button>
        ))}
      </div>
    </div>
  );
}
