import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  email: string;
  name: string;
};

type AuthStore = {
  user: AuthUser | null;
  hasHydrated: boolean;
  login: (email: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
};

function nameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const words = localPart.replace(/[._-]+/g, " ").trim();
  if (!words) return "Пользователь";
  return words
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      login: (email) => set({ user: { email, name: nameFromEmail(email) } }),
      logout: () => set({ user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "genora-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
