"use client";

import { SegmentedControl } from "@/components/shared/segmented-control";
import type { Product } from "../types";
import styles from "./tier-segments.module.css";

type TierSegmentsProps = {
  product: Product;
  tierIndex: number;
  onTierChange: (index: number) => void;
};

/**
 * Выбор уровня товара: подпись + общий SegmentedControl
 * со скользящим пиксельно-выровненным ползунком.
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
      <SegmentedControl
        options={product.tiers.map((tier) => ({
          id: tier.id,
          label: tier.name,
        }))}
        selectedIndex={tierIndex}
        onChange={onTierChange}
        labelledBy={captionId}
        accentColor={product.brandColor}
      />
    </div>
  );
}
