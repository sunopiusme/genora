import { create } from "zustand";
import type { Product } from "../types";

export type AttachedFile = {
  name: string;
  kind: "image" | "document";
};

type ComposerStore = {
  attachedProduct: Product | null;
  attachedFile: AttachedFile | null;
  isProfileAttached: boolean;
  /** Monotonic counter: bump it to ask the composer editor to grab focus */
  focusSignal: number;
  attachProduct: (product: Product) => void;
  attachFile: (file: AttachedFile) => void;
  attachProfile: () => void;
  detachProduct: () => void;
  detachFile: () => void;
  detachProfile: () => void;
  requestFocus: () => void;
};

export const useComposerStore = create<ComposerStore>((set) => ({
  attachedProduct: null,
  attachedFile: null,
  isProfileAttached: false,
  focusSignal: 0,
  attachProduct: (product) => set({ attachedProduct: product }),
  attachFile: (file) => set({ attachedFile: file }),
  attachProfile: () => set({ isProfileAttached: true }),
  detachProduct: () => set({ attachedProduct: null }),
  detachFile: () => set({ attachedFile: null }),
  detachProfile: () => set({ isProfileAttached: false }),
  requestFocus: () =>
    set((state) => ({ focusSignal: state.focusSignal + 1 })),
}));
