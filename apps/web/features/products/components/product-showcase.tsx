"use client";

import { useState } from "react";
import { getFeaturedProducts } from "../catalog";
import { useShowcaseStore } from "../stores/showcase-store";
import type { Product } from "../types";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";
import styles from "./product-showcase.module.css";

export function ProductShowcase() {
  const categoryFilter = useShowcaseStore((state) => state.categoryFilter);
  const featuredProducts = getFeaturedProducts().filter(
    (product) =>
      categoryFilter === "all" || product.category === categoryFilter,
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
