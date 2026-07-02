import type { Product } from "./types";

export function getBrandInitial(product: Product): string {
	const source = product.provider.trim() || product.name.trim();
	return source.charAt(0).toUpperCase();
}
