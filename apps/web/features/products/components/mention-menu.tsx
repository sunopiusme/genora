"use client";

import { Avatar } from "@genora/ui";
import { PROFILE } from "@features/profile";
import { getBrandLogoCssUrl } from "../brand-logos";
import { getFeaturedProducts } from "../queries/featured-products";
import type { Product } from "../types";
import styles from "./mention-menu.module.css";

export type MentionItem = {
  id: string;
  label: string;
  hint: string;
  kind: "profile" | "product";
  logoSlug?: string;
  product?: Product;
};

function buildMentionItems(): MentionItem[] {
  const profile: MentionItem = {
    id: "self",
    label: PROFILE.name,
    hint: "Мой профиль",
    kind: "profile",
  };
  const products: MentionItem[] = getFeaturedProducts().map((product) => ({
    id: product.id,
    label: product.name,
    hint: "Товар",
    kind: "product",
    logoSlug: product.logoSlug,
    product,
  }));
  return [profile, ...products];
}

export function getMentionItems(query: string): MentionItem[] {
  const items = buildMentionItems();
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.hint.toLowerCase().includes(normalized),
  );
}

type MentionMenuProps = {
  id: string;
  items: MentionItem[];
  activeIndex: number;
  onSelect: (item: MentionItem) => void;
  onHover: (index: number) => void;
};

export function MentionMenu({
  id,
  items,
  activeIndex,
  onSelect,
  onHover,
}: MentionMenuProps) {
  return (
    <div id={id} role="listbox" aria-label="Упоминания" className={styles.menu}>
      <div className={styles.list}>
        {items.length === 0 ? (
          <p className={styles.emptyState}>Ничего не найдено</p>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={styles.item}
              data-active={index === activeIndex || undefined}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
              onPointerEnter={() => onHover(index)}
            >
              {item.kind === "profile" ? (
                <Avatar
                  name={item.label}
                  size="1.5rem"
                  className={styles.itemAvatar}
                  aria-hidden="true"
                />
              ) : (
                <span className={styles.itemLogoWrap} aria-hidden="true">
                  <span
                    className={styles.itemLogo}
                    style={
                      {
                        "--logo-url": getBrandLogoCssUrl(item.logoSlug ?? ""),
                      } as React.CSSProperties
                    }
                  />
                </span>
              )}
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemHint}>{item.hint}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
