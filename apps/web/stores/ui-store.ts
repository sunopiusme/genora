import { create } from "zustand";

type UiStore = {
  isSidebarOpen: boolean;
  /* Базовое состояние sidebar задаётся один раз при первом монтировании
     оболочки (открыт на десктопе, скрыт на мобильных). Флаг не даёт
     повторной инициализации перезаписать выбор пользователя при
     переходах между площадками (Genora ↔ Синора). */
  hasInitializedSidebar: boolean;
  isSearchOpen: boolean;
  initSidebar: (isOpen: boolean) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openSearch: () => void;
  closeSearch: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  isSidebarOpen: false,
  hasInitializedSidebar: false,
  isSearchOpen: false,
  initSidebar: (isOpen) =>
    set((state) =>
      state.hasInitializedSidebar
        ? state
        : { hasInitializedSidebar: true, isSidebarOpen: isOpen },
    ),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
