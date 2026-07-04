import { create } from "zustand";
import type { Product } from "@/features/products/types";

export type AttachedFile = {
  name: string;
  kind: "image" | "document";
};

type ComposerStore = {
  attachedProduct: Product | null;
  attachedFile: AttachedFile | null;
  attach: (product: Product) => void;
  attachFile: (file: AttachedFile) => void;
  detach: () => void;
  detachFile: () => void;
};

export const useComposerStore = create<ComposerStore>((set) => ({
  attachedProduct: null,
  attachedFile: null,
  attach: (product) => set({ attachedProduct: product }),
  attachFile: (file) => set({ attachedFile: file }),
  detach: () => set({ attachedProduct: null }),
  detachFile: () => set({ attachedFile: null }),
}));
