import { create } from "zustand";
import type { ProductCategoryFilter, ShowcaseSort } from "../types";

type ShowcaseStore = {
  categoryFilter: ProductCategoryFilter;
  sort: ShowcaseSort;
  setCategoryFilter: (filter: ProductCategoryFilter) => void;
  setSort: (sort: ShowcaseSort) => void;
};

export const useShowcaseStore = create<ShowcaseStore>((set) => ({
  categoryFilter: "all",
  sort: "featured",
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setSort: (sort) => set({ sort }),
}));
