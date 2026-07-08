import { create } from "zustand";

type UiStore = {
  /* По умолчанию true: SSR-разметка сразу рисует раскрытый sidebar
     (десктопный дефолт), без «доезжания» после гидратации. На мобильных
     drawer до инициализации прячется CSS-классом shellPreInit, а
     initSidebar затем выставляет корректное состояние до первой отрисовки. */
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
  isSidebarOpen: true,
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
