"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type TransitionEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useComposerStore } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import styles from "./assistant-bar.module.css";

export function AssistantBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const attachedProduct = useComposerStore((state) => state.attachedProduct);
  const detach = useComposerStore((state) => state.detach);
  const hasQuery = query.trim().length > 0;

  const [visibleProduct, setVisibleProduct] = useState(attachedProduct);
  const [isOpen, setIsOpen] = useState(Boolean(attachedProduct));

  useEffect(() => {
    if (attachedProduct) {
      setVisibleProduct(attachedProduct);
      const frame = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(frame);
    }
    setIsOpen(false);
  }, [attachedProduct]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasQuery) {
      return;
    }
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && query.length === 0 && attachedProduct) {
      detach();
    }
  }

  function handleSlotTransitionEnd(event: TransitionEvent<HTMLSpanElement>) {
    if (event.propertyName === "opacity" && !attachedProduct) {
      setVisibleProduct(null);
    }
  }

  return (
    <form className={styles.bar} onSubmit={handleSubmit}>
      <span className={styles.lead}>
        <span className={attachedProduct ? styles.slot : `${styles.slot} ${styles.slotOpen}`}>
          <span className={styles.slotInner}>
            <span className={styles.searchIcon}>
              <Icon icon="solar:magnifer-linear" className={styles.searchGlyph} aria-hidden="true" />
            </span>
          </span>
        </span>

        {visibleProduct && (
          <span
            className={isOpen ? `${styles.slot} ${styles.slotOpen}` : styles.slot}
            onTransitionEnd={handleSlotTransitionEnd}
          >
            <span className={styles.slotInner}>
              <span className={styles.attachment} role="status" aria-label={`Прикреплён: ${visibleProduct.name}`}>
                <span className={styles.attachmentIcon}>
                  <Icon icon="solar:pin-linear" className={styles.attachmentGlyph} aria-hidden="true" />
                </span>
                <span className={styles.attachmentLabel}>{visibleProduct.name}</span>
              </span>
            </span>
          </span>
        )}
      </span>

      <input
        name="query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={attachedProduct ? "Спросите…" : "Спросите что угодно"}
        autoComplete="off"
        className={styles.input}
        aria-label="Поиск по товарам"
      />

      <button
        type="submit"
        className={styles.submit}
        disabled={!hasQuery}
        aria-label="Отправить"
      >
        <Icon icon="solar:arrow-up-linear" className={styles.icon} />
      </button>
    </form>
  );
}
