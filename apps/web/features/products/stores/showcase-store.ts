import { create } from "zustand";
import type { ProductCategoryFilter } from "../types";

type ShowcaseStore = {
  categoryFilter: ProductCategoryFilter;
  setCategoryFilter: (filter: ProductCategoryFilter) => void;
};

export const useShowcaseStore = create<ShowcaseStore>((set) => ({
  categoryFilter: "all",
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
}));
