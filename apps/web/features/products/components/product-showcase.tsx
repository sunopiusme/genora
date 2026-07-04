"use client";

import { useState } from "react";
import { getFeaturedProducts } from "../queries/featured-products";
import type { Product } from "../types";
import { ProductCard, type CoverVariant } from "./product-card";

const COVER_VARIANTS: CoverVariant[] = ["horizon", "backlit", "mist"];
import { ProductDetail } from "./product-detail";
import styles from "./product-showcase.module.css";

export function ProductShowcase() {
	const featuredProducts = getFeaturedProducts();
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
				{featuredProducts.map((product, index) => (
					<ProductCard
						key={product.id}
						product={product}
						coverVariant={COVER_VARIANTS[index % COVER_VARIANTS.length]}
						onOpen={() => openProductDetail(product)}
					/>
				))}
			</div>
			<ProductDetail product={selectedProduct} onClose={closeProductDetail} />
		</section>
	);
}
