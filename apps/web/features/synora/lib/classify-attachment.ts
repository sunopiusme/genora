import type { AttachmentKind } from "../types";

const IMAGE_PREFIX = "image/";
const AUDIO_PREFIX = "audio/";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"];
const AUDIO_EXTS = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];

export function classifyFile(file: File): AttachmentKind | null {
  const type = file.type.toLowerCase();
  if (type.startsWith(IMAGE_PREFIX)) return "image";
  if (type.startsWith(AUDIO_PREFIX)) return "audio";

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (AUDIO_EXTS.includes(ext)) return "audio";

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
