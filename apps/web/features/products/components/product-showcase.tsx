"use client";

import { useState } from "react";
import { getFeaturedProducts } from "../queries/featured-products";
import type { Product } from "../types";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";
import styles from "./product-showcase.module.css";

export function ProductShowcase() {
  const products = getFeaturedProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function closeDetail() {
    setSelectedProduct(null);
  }

  return (
    <section className={styles.showcase}>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      <ProductDetail product={selectedProduct} onClose={closeDetail} />
    </section>
  );
}
