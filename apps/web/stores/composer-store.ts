import { create } from "zustand";
import type { Product } from "@/features/products/types";

export type AttachedFile = {
  name: string;
  kind: "image" | "document";
};

type ComposerStore = {
  attachedProduct: Product | null;
  attachedFile: AttachedFile | null;
  /* Профиль пользователя, прикреплённый к вопросу через «@». */
  isProfileAttached: boolean;
  attach: (product: Product) => void;
  attachFile: (file: AttachedFile) => void;
  attachProfile: () => void;
  detach: () => void;
  detachFile: () => void;
  detachProfile: () => void;
};

export const useComposerStore = create<ComposerStore>((set) => ({
  attachedProduct: null,
  attachedFile: null,
  isProfileAttached: false,
  attach: (product) => set({ attachedProduct: product }),
  attachFile: (file) => set({ attachedFile: file }),
  attachProfile: () => set({ isProfileAttached: true }),
  detach: () => set({ attachedProduct: null }),
  detachFile: () => set({ attachedFile: null }),
  detachProfile: () => set({ isProfileAttached: false }),
}));
