"use client";

import { useEffect, useRef, useState } from "react";
import { PixelBurst } from "./pixel-burst";
import styles from "./segmented-control.module.css";

export type SegmentedControlOption = {
  id: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** id элемента с подписью для aria-labelledby */
  labelledBy?: string;
  ariaLabel?: string;
  /** Фирменный цвет для пиксельного всплеска на максимальном значении */
  accentColor?: string;
};

/**
 * Сегментированный контрол со скользящим ползунком.
 *
 * Геометрия ползунка считается в целых пикселях: реальная ширина трека
 * измеряется через ResizeObserver, позиции сегментов округляются до
 * пиксельной сетки — края никогда не попадают «между пикселями»,
 * поэтому при анимации нет субпиксельного мерцания.
 */
export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
  labelledBy,
  ariaLabel,
  accentColor,
}: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<{ left: number; width: number } | null>(
    null,
  );

  // При выборе максимального значения внутри пилюли проигрывается
  // пиксельный всплеск: точки расходятся от центра к краям —
  // тот же пиксельный словарь, что у ползунка в tier-dither.
  const maxIndex = options.length - 1;
  const prevIndexRef = useRef(selectedIndex);
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = selectedIndex;
    if (selectedIndex === maxIndex && prev !== selectedIndex) {
      setBurstKey((key) => key + 1);
    }
  }, [selectedIndex, maxIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const style = getComputedStyle(track);
      const padLeft = parseFloat(style.paddingLeft);
      const padRight = parseFloat(style.paddingRight);
      const inner = track.clientWidth - padLeft - padRight;
      const count = options.length;
      if (count === 0 || inner <= 0) return;

      // Целые пиксельные границы: позиция каждого сегмента округляется,
      // ширина — разность соседних границ, чтобы не накапливать дробь
      const start = Math.round(padLeft + (inner * selectedIndex) / count);
      const end = Math.round(padLeft + (inner * (selectedIndex + 1)) / count);
      setMetrics({ left: start, width: end - start });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [options.length, selectedIndex]);

  return (
    <div
      ref={trackRef}
      className={styles.track}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
    >
      <span
        className={styles.thumb}
        aria-hidden="true"
        style={
          metrics
            ? {
                width: `${metrics.width}px`,
                transform: `translateX(${metrics.left}px)`,
                opacity: 1,
              }
            : { opacity: 0 }
        }
      >
        <PixelBurst
          playKey={burstKey}
          accentColor={accentColor}
          className={styles.burstCanvas}
        />
      </span>
      {options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={index === selectedIndex}
          className={
            index === selectedIndex ? styles.segmentSelected : styles.segment
          }
          onClick={() => onChange(index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
