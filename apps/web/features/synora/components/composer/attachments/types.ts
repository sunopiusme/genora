/* ─────────────────────────────────────────
   Типы для вложений composer'а.

   Поддерживаются image и audio. Видео и
   произвольные документы отклоняются на
   уровне classify().

   Attachment держит File-объект, превью-URL
   (для картинок), и набор полей для отображения.
   ───────────────────────────────────────── */

export type AttachmentKind = "image" | "audio";

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  file: File;
  /** object-url для thumbnail; есть только у image. */
  previewUrl?: string;
  /** название файла, как в проводнике. */
  name: string;
  /** размер в байтах для подписи под audio. */
  size: number;
};
