import { create } from "zustand";

import type { ChatMessage, ChatMessageRole, ChatStatus } from "../types";

type ChatStore = {
  status: ChatStatus;
  messages: ChatMessage[];
  startStream: (prompt: string) => void;
  appendChunk: (chunk: string) => void;
  finishStream: () => void;
  failStream: () => void;
  updateUserMessage: (messageId: string, content: string) => void;
  reset: () => void;
};

let messageSequence = 0;

function createMessageId(role: ChatMessageRole): string {
  messageSequence += 1;
  return `${role}-${Date.now()}-${messageSequence}`;
}

export const useChatStore = create<ChatStore>((set) => ({
  status: "idle",
  messages: [],
  startStream: (prompt) =>
    set((state) => ({
      status: "streaming",
      messages: [
        ...state.messages,
        {
          id: createMessageId("user"),
          role: "user",
          content: prompt,
          status: "done",
          createdAt: Date.now(),
        },
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: "",
          status: "streaming",
          createdAt: Date.now(),
        },
      ],
    })),
  appendChunk: (chunk) =>
    set((state) => ({
      messages: state.messages.map((message, index) =>
        index === state.messages.length - 1 && message.role === "assistant"
          ? { ...message, content: message.content + chunk }
          : message,
      ),
    })),
  finishStream: () =>
    set((state) => ({
      status: "done",
      messages: state.messages.map((message, index) =>
        index === state.messages.length - 1 && message.role === "assistant"
          ? { ...message, status: "done" }
          : message,
      ),
    })),
  failStream: () =>
    set((state) => ({
      status: "error",
      messages: state.messages.map((message, index) =>
        index === state.messages.length - 1 && message.role === "assistant"
          ? { ...message, status: "error" }
          : message,
      ),
    })),
  updateUserMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId && message.role === "user"
          ? { ...message, content }
          : message,
      ),
    })),
  reset: () => set({ status: "idle", messages: [] }),
}));
