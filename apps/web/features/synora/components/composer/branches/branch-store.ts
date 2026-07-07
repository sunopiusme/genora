import { create } from "zustand";

import { DEFAULT_BRANCH } from "./data";

/* ─────────────────────────────────────────
   Общее состояние текущей ветки.

   Ветку можно менять из двух мест: из drawer'а
   композера (BranchPicker) и из десктопного
   заголовка главной /synora (SynoraHeading).
   Стор держит их синхронными.
   ───────────────────────────────────────── */

type BranchStore = {
  branch: string;
  setBranch: (branch: string) => void;
};

export const useBranchStore = create<BranchStore>((set) => ({
  branch: DEFAULT_BRANCH,
  setBranch: (branch) => set({ branch }),
}));
