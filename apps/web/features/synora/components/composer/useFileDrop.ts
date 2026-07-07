"use client";

import { useRef, useState, type DragEvent } from "react";

type DivDragEvent = DragEvent<HTMLDivElement>;

export type FileDrop = {
  dragOver: boolean;
  handlers: {
    onDragEnter: (event: DivDragEvent) => void;
    onDragLeave: (event: DivDragEvent) => void;
    onDragOver: (event: DivDragEvent) => void;
    onDrop: (event: DivDragEvent) => void;
  };
};

export function useFileDrop(onDrop: (files: FileList) => void): FileDrop {
  const [dragOver, setDragOver] = useState(false);
  // dragenter/dragleave стреляют на каждом вложенном элементе;
  // счётчик отличает уход курсора из карточки от перехода между детьми.
  const depth = useRef(0);

  const hasFiles = (event: DivDragEvent) => event.dataTransfer.types.includes("Files");

  const handlers = {
    onDragEnter: (event: DivDragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragOver(true);
    },
    onDragLeave: (event: DivDragEvent) => {
      event.preventDefault();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragOver(false);
    },
    onDragOver: (event: DivDragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    },
    onDrop: (event: DivDragEvent) => {
      event.preventDefault();
      depth.current = 0;
      setDragOver(false);
      if (event.dataTransfer.files.length > 0) onDrop(event.dataTransfer.files);
    },
  };

  return { dragOver, handlers };
}
