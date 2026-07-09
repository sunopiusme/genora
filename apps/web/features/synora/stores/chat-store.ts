import { create } from "zustand";

export type ChatStatus = "idle" | "streaming" | "done" | "error";

type ChatStore = {
  status: ChatStatus;
  reply: string;
  startStream: () => void;
  appendChunk: (chunk: string) => void;
  finishStream: () => void;
  failStream: () => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  status: "idle",
  reply: "",
  startStream: () => set({ status: "streaming", reply: "" }),
  appendChunk: (chunk) => set((state) => ({ reply: state.reply + chunk })),
  finishStream: () => set({ status: "done" }),
  failStream: () => set({ status: "error" }),
  reset: () => set({ status: "idle", reply: "" }),
}));
