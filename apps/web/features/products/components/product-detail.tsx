"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@genora/ui";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@/stores/composer-store";
import type { Product } from "../types";
import styles from "./product-detail.module.css";

const SURFACE_ELEMENT_ID = "dashboardSurface";

type ProductDetailProps = {
  product: Product | null;
  onClose: () => void;
};

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [surface, setSurface] = useState<HTMLElement | null>(null);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const attach = useComposerStore((state) => state.attach);

  useEffect(() => {
    setSurface(document.getElementById(SURFACE_ELEMENT_ID));
  }, []);

  useEffect(() => {
    if (!product) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  useEffect(() => {
    if (product) {
      const id = requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [product]);

  useEffect(() => {
    if (!isShareOpen) {
      return;
    }

    function handleClickOutside(event: globalThis.MouseEvent) {
      const target = event.target as Node;
      if (shareMenuRef.current && !shareMenuRef.current.contains(target)) {
        setShareOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isShareOpen]);

  if (!product || !surface) {
    return null;
  }

  const currentProduct = product;

  function stopBackdropClose(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  function handleAttach() {
    attach(currentProduct);
    onClose();
  }

  function buildShareUrl() {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/products?id=${currentProduct.id}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setShareOpen(false);
      }, 1500);
    } catch {
      setShareOpen(false);
    }
  }

  function handleShareTelegram() {
    const url = buildShareUrl();
    const text = `${currentProduct.name} — ${currentProduct.priceLabel}/${currentProduct.periodLabel}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareOpen(false);
  }

  function toggleShare() {
    setShareOpen((prev) => !prev);
  }

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        tabIndex={-1}
        className={styles.panel}
        onClick={stopBackdropClose}
      >
        <div className={styles.actions}>
          <div className={styles.actionGroup} ref={shareMenuRef}>
            <button
              type="button"
              className={isShareOpen ? styles.iconButtonActive : styles.iconButton}
              onClick={toggleShare}
              aria-label="Поделиться"
              title="Поделиться"
              aria-haspopup="true"
              aria-expanded={isShareOpen}
            >
              <Icon icon="solar:share-linear" aria-hidden="true" />
            </button>

            {isShareOpen && (
              <div className={styles.shareMenu} role="menu">
                <button
                  type="button"
                  className={styles.shareItem}
                  onClick={handleCopyLink}
                  role="menuitem"
                >
                  {isCopied ? (
                    <Icon
                      icon="solar:check-read-linear"
                      className={styles.shareIconSuccess}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon icon="solar:link-linear" className={styles.shareIcon} aria-hidden="true" />
                  )}
                  <span>{isCopied ? "Скопировано" : "Копировать ссылку"}</span>
                </button>

                <button
                  type="button"
                  className={styles.shareItem}
                  onClick={handleShareTelegram}
                  role="menuitem"
                >
                  <Icon icon="solar:plain-linear" className={styles.shareIcon} aria-hidden="true" />
                  <span>Поделиться в Telegram</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={handleAttach}
            aria-label="Прикрепить к чату"
            title="Прикрепить к чату"
          >
            <Icon icon="solar:paperclip-linear" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Закрыть"
            title="Закрыть"
          >
            <Icon icon="solar:close-linear" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.layout}>
          <div className={styles.cover}>
            <span className={styles.wordmark}>{currentProduct.provider}</span>
          </div>

          <div className={styles.summary}>
            <p className={styles.provider}>{currentProduct.provider}</p>
            <h2 id="product-detail-title" className={styles.name}>
              {currentProduct.name}
            </h2>
            <p className={styles.description}>{currentProduct.description}</p>

            <div className={styles.purchase}>
              <p className={styles.price}>
                <span className={styles.amount}>{currentProduct.priceLabel}</span>
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
                <span className={styles.period}>{currentProduct.periodLabel}</span>
              </p>

              <Button variant="primary" size="lg" className={styles.buy}>
                Купить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, surface);
}
