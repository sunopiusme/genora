"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { classifyFile } from "./classify";
import type { Attachment } from "./types";

/* ─────────────────────────────────────────
   Контроллер вложений composer'а.

   Принимает FileList (из <input type="file">
   или drag-drop), классифицирует, создаёт
   object-url'ы для картинок, складывает
   в state. Удаляет — освобождает url.
   ───────────────────────────────────────── */

type Controller = {
  attachments: Attachment[];
  add: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  reorder: (fromId: string, toId: string) => void;
  /** rejected — массив имён файлов, которые не приняли. */
  lastRejected: string[];
};

let nextId = 1;

export function useAttachments(): Controller {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [lastRejected, setLastRejected] = useState<string[]>([]);

  // Освобождаем object-url'ы при размонтировании,
  // чтобы не текла память.
  const urlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  const add = useCallback((files: FileList | File[]) => {
    const accepted: Attachment[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      const kind = classifyFile(file);
      if (!kind) {
        rejected.push(file.name);
        continue;
      }
      const id = `att-${nextId++}`;
      const attachment: Attachment = {
        id,
        kind,
        file,
        name: file.name,
        size: file.size,
      };
      if (kind === "image") {
        const previewUrl = URL.createObjectURL(file);
        urlsRef.current.push(previewUrl);
        attachment.previewUrl = previewUrl;
      }
      accepted.push(attachment);
    }

    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
    setLastRejected(rejected);
  }, []);

  const remove = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        urlsRef.current = urlsRef.current.filter((u) => u !== target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
    setAttachments([]);
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setAttachments((prev) => {
      const fromIdx = prev.findIndex((a) => a.id === fromId);
      const toIdx = prev.findIndex((a) => a.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      if (!moved) return prev;
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  return { attachments, add, remove, clear, reorder, lastRejected };
}
