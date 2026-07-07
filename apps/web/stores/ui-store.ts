import { create } from "zustand";

type UiStore = {
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openSearch: () => void;
  closeSearch: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  isSidebarOpen: false,
  isSearchOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
