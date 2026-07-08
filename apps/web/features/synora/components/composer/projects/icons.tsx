/* ─────────────────────────────────────────
   Иконки project picker'а — тонкие обёртки над
   единым offline-реестром проекта (lib/icon.tsx,
   Solar Linear). Тот же механизм, что у sidebar:
   SSR-рендер из локального реестра, без сетевых
   загрузок и мерцания при перезагрузке.
   ───────────────────────────────────────── */

import { Icon } from "@/lib/icon";

export function FolderIcon() {
  return <Icon icon="solar:folder-linear" />;
}

/* Folder с «биркой» — активный проект. */
export function ProjectFolderIcon() {
  return <Icon icon="solar:folder-tag-linear" />;
}

export function FolderPlusIcon() {
  return <Icon icon="solar:add-folder-linear" />;
}

/* Folder с крестиком — «без проекта». */
export function FolderXIcon() {
  return <Icon icon="solar:folder-x-linear" />;
}

export function PlusIcon() {
  return <Icon icon="solar:plus-linear" />;
}

export function ExistingFolderIcon() {
  return <Icon icon="solar:folder-linear" />;
}

export function SearchIcon() {
  return <Icon icon="solar:magnifer-linear" />;
}

export function CheckIcon() {
  return <Icon icon="solar:check-single-linear" />;
}

export function ChevronDownIcon() {
  return <Icon icon="solar:alt-arrow-down-linear" />;
}

export function ChevronRightIcon() {
  return <Icon icon="solar:alt-arrow-right-linear" />;
}
