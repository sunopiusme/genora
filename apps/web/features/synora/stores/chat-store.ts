import { create } from "zustand";

import type { ChatMessage, ChatMessageRole, ChatStatus } from "../types";

type ChatStore = {
  status: ChatStatus;
  messages: ChatMessage[];
  startStream: (prompt: string) => void;
  beginRetry: () => void;
  appendChunk: (chunk: string) => void;
  finishStream: () => void;
  stopStream: () => void;
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
  beginRetry: () =>
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const baseMessages =
        lastMessage && lastMessage.role === "assistant"
          ? state.messages.slice(0, -1)
          : state.messages;
      return {
        status: "streaming",
        messages: [
          ...baseMessages,
          {
            id: createMessageId("assistant"),
            role: "assistant",
            content: "",
            status: "streaming",
            createdAt: Date.now(),
          },
        ],
      };
    }),
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
  stopStream: () =>
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (!lastMessage || lastMessage.role !== "assistant") {
        return { status: "done" };
      }
      // Пустой частичный ответ убираем; вопрос пользователя остаётся,
      // чтобы его можно было повторить.
      if (!lastMessage.content) {
        return { status: "done", messages: state.messages.slice(0, -1) };
      }
      return {
        status: "done",
        messages: state.messages.map((message, index) =>
          index === state.messages.length - 1
            ? { ...message, status: "done" as const }
            : message,
        ),
      };
    }),
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
