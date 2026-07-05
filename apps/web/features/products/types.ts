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
  logoSlug: string;
  brandColor: string;
  brandGlow: string;
  priceLabel: string;
  periodLabel: string;
  description: string;
  tiers: ProductTier[];
  defaultTierIndex: number;
};
