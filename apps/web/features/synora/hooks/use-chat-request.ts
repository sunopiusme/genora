"use client";

import { useCallback, useEffect, useRef } from "react";

import type { ChatRequest } from "../schemas/chat";
import { useChatStore } from "../stores/chat-store";

export function useChatRequest() {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const streamResponse = useCallback(
    async (request: ChatRequest, controller: AbortController): Promise<boolean> => {
      const { appendChunk, finishStream, failStream } = useChatStore.getState();

      try {
        const response = await fetch("/api/synora/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          failStream();
          return false;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          appendChunk(decoder.decode(value, { stream: true }));
        }
        const finalChunk = decoder.decode();
        if (finalChunk) {
          appendChunk(finalChunk);
        }
        finishStream();
        return true;
      } catch (error) {
        // Остановка пользователем: частичный ответ уже сохранён в cancel().
        if (controller.signal.aborted) return true;
        console.error("Chat request failed", error);
        failStream();
        return false;
      }
    },
    [],
  );

  const send = useCallback(
    async (request: ChatRequest): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      useChatStore.getState().startStream(request.prompt);
      return streamResponse(request, controller);
    },
    [streamResponse],
  );

  const retry = useCallback(
    async (request: ChatRequest): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      useChatStore.getState().beginRetry();
      return streamResponse(request, controller);
    },
    [streamResponse],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    useChatStore.getState().stopStream();
  }, []);

  return { send, retry, cancel };
}
