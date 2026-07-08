import { create } from "zustand";

import { DEFAULT_BRANCH } from "../data/branches";

type BranchStore = {
  branch: string;
  setBranch: (branch: string) => void;
};

export const useBranchStore = create<BranchStore>((set) => ({
  branch: DEFAULT_BRANCH,
  setBranch: (branch) => set({ branch }),
}));
