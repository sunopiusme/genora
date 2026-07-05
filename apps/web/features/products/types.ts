export type ProductTier = {
  id: string;
  /* Название уровня подписки: «Plus», «Pro», «Max» и т.д. */
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
  /* Уровни подписки, выбираемые слайдером в детальном просмотре.
     Порядок — от базового к максимальному. */
  tiers: ProductTier[];
  /* Индекс тира, выбранного по умолчанию (обычно тот, что на карточке). */
  defaultTierIndex: number;
};
