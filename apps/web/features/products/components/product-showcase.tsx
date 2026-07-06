"use client";

import { useState } from "react";
import { getFeaturedProducts } from "../catalog";
import { useShowcaseStore } from "../stores/showcase-store";
import type { Product, ShowcaseSort } from "../types";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";
import styles from "./product-showcase.module.css";

function parsePrice(priceLabel: string): number {
  return Number(priceLabel.replace(/[^\d]/g, "")) || 0;
}

function sortProducts(products: Product[], sort: ShowcaseSort): Product[] {
  if (sort === "featured") return products;

  return [...products].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return parsePrice(a.priceLabel) - parsePrice(b.priceLabel);
      case "price-desc":
        return parsePrice(b.priceLabel) - parsePrice(a.priceLabel);
      case "name":
        return a.name.localeCompare(b.name, "ru");
      default:
        return 0;
    }
  });
}

export function ProductShowcase() {
  const categoryFilter = useShowcaseStore((state) => state.categoryFilter);
  const sort = useShowcaseStore((state) => state.sort);
  const featuredProducts = sortProducts(
    getFeaturedProducts().filter(
      (product) =>
        categoryFilter === "all" || product.category === categoryFilter,
    ),
    sort,
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function openProductDetail(product: Product) {
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    setSelectedProduct(null);
  }

  return (
    <section className={styles.showcase}>
      <div className={styles.grid}>
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => openProductDetail(product)}
          />
        ))}
      </div>
      <ProductDetail product={selectedProduct} onClose={closeProductDetail} />
    </section>
  );
}
