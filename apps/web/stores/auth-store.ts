import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  email: string;
  name: string;
};

export type AuthView = "login" | "verify";

type AuthStore = {
  user: AuthUser | null;
  hasHydrated: boolean;
  view: AuthView | null;
  verifyEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  openLogin: () => void;
  openVerify: (email: string) => void;
  closeAuth: () => void;
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
      view: null,
      verifyEmail: null,
      login: (email) =>
        set({
          user: { email, name: nameFromEmail(email) },
          view: null,
          verifyEmail: null,
        }),
      logout: () => set({ user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      openLogin: () => set({ view: "login" }),
      openVerify: (email) => set({ view: "verify", verifyEmail: email }),
      closeAuth: () => set({ view: null, verifyEmail: null }),
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
