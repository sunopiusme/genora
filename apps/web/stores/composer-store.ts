import { create } from "zustand";
import type { Product } from "@/features/products/types";

type ComposerStore = {
  attachedProduct: Product | null;
  attach: (product: Product) => void;
  detach: () => void;
};

export const useComposerStore = create<ComposerStore>((set) => ({
  attachedProduct: null,
  attach: (product) => set({ attachedProduct: product }),
  detach: () => set({ attachedProduct: null }),
}));
