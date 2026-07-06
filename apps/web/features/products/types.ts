export type ProductCategory = "assistants" | "images" | "code";

export type ProductCategoryFilter = ProductCategory | "all";

export type ShowcaseSort = "featured" | "price-asc" | "price-desc" | "name";

export type ProductTier = {
  id: string;
  name: string;
  priceLabel: string;
  description: string;
};

export type Product = {
  id: string;
  name: string;
  provider: string;
  category: ProductCategory;
  logoSlug: string;
  brandColor: string;
  brandGlow: string;
  priceLabel: string;
  periodLabel: string;
  description: string;
  tiers: ProductTier[];
  defaultTierIndex: number;
};
