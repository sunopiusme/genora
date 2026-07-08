/* ─────────────────────────────────────────
   Иконки композера — тонкие обёртки над единым
   offline-реестром проекта (lib/icon.tsx, Solar
   Linear). Тот же механизм, что у sidebar:
   иконки зарегистрированы локально, рендерятся
   при SSR и не ходят в сеть — мгновенная
   отрисовка без мерцания при перезагрузке.

   Размер задаётся CSS-селекторами родителей
   (например .iconBtn svg), как и раньше.
   ───────────────────────────────────────── */

import { Icon } from "@/lib/icon";

export function PlusIcon() {
  return <Icon icon="solar:plus-bold-stroke" />;
}

export function MicIcon() {
  return <Icon icon="solar:microphone-2-linear" />;
}

export function StopIcon() {
  return <Icon icon="solar:stop-bold" />;
}

export function SpinnerIcon() {
  return <Icon icon="solar:spinner-bold-stroke" />;
}

export function ArrowUpIcon() {
  return <Icon icon="solar:arrow-up-bold-stroke" />;
}

export function ClipIcon() {
  return <Icon icon="solar:paperclip-linear" />;
}

export function ListChecksIcon() {
  return <Icon icon="solar:checklist-minimalistic-linear" />;
}

export function GridIcon() {
  return <Icon icon="solar:widget-linear" />;
}

export function ChevronRightIcon() {
  return <Icon icon="solar:alt-arrow-right-linear" />;
}

export function CloseIcon() {
  return <Icon icon="solar:close-linear" />;
}

export function SlashIcon() {
  return <Icon icon="solar:slash-bold-stroke" />;
}
