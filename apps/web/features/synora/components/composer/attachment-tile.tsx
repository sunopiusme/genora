"use client";

import { useState } from "react";

import { formatBytes } from "../../lib/classify-attachment";
import type { Attachment } from "../../types";
import styles from "./attachment-tile.module.css";

type Props = {
  attachment: Attachment;
  onRemove: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
};

export function AttachmentTile({ attachment, onRemove, onReorder }: Props) {
  const { id, kind, name, size, previewUrl } = attachment;
  const [over, setOver] = useState(false);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={styles.tile}
      data-over={over}
      data-dragging={dragging}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/x-attachment-id", id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        setOver(false);
      }}
      onDragOver={(event) => {
        const types = Array.from(event.dataTransfer.types);
        if (!types.includes("text/x-attachment-id")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        const fromId = event.dataTransfer.getData("text/x-attachment-id");
        if (!fromId) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onReorder(fromId, id);
      }}
    >
      {kind === "image" ? (
        <div className={styles.imageTile}>
          {previewUrl ? <img src={previewUrl} alt={name} /> : null}
        </div>
      ) : (
        <div className={styles.audioTile}>
          <span className={styles.audioIcon} aria-hidden="true">
            <AudioIcon />
          </span>
          <div className={styles.audioMeta}>
            <span className={styles.audioName} title={name}>
              {name}
            </span>
            <span className={styles.audioSize}>
              Audio · {formatBytes(size)}
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        className={styles.remove}
        aria-label={`Убрать ${name}`}
        onClick={() => onRemove(id)}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function AudioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}
