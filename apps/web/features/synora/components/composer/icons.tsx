/* ─────────────────────────────────────────
   Иконки композера — стиль Solar Linear.

   Единая шкала со всем приложением (lib/icon.tsx):
   24×24, stroke 1.5, скруглённые окончания.
   Инлайн-SVG, без сетевых загрузок — иконки
   отрисовываются мгновенно и при SSR, и после
   обновления страницы.
   ───────────────────────────────────────── */

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlusIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* Solar microphone-2-linear. */
export function MicIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="2.75" width="6" height="11.5" rx="3" />
      <path d="M5 11v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 19v2.25" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

export function SpinnerIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <circle cx="12" cy="12" r="8" opacity="0.18" />
      <path d="M20 12a8 8 0 0 1-8 8" />
    </svg>
  );
}

/* Solar arrow-up-linear (жирнее — primary-кнопка). */
export function ArrowUpIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <path d="M12 20V4m0 0 6 6m-6-6-6 6" />
    </svg>
  );
}

/* Solar paperclip-linear. */
export function ClipIcon() {
  return (
    <svg {...base}>
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

/* Solar checklist-minimalistic-linear. */
export function ListChecksIcon() {
  return (
    <svg {...base}>
      <path d="m4 6 1.5 1.5L8 5" />
      <path d="m4 13 1.5 1.5L8 11" />
      <path d="m4 20 1.5 1.5L8 18" />
      <path d="M11.5 6.5H20" />
      <path d="M11.5 13.5H20" />
      <path d="M11.5 20.5H20" />
    </svg>
  );
}

/* Solar widget-linear. */
export function GridIcon() {
  return (
    <svg {...base}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

/* Solar alt-arrow-right-linear. */
export function ChevronRightIcon() {
  return (
    <svg {...base}>
      <path d="m9 5 6 7-6 7" />
    </svg>
  );
}

/* Solar close-linear. */
export function CloseIcon() {
  return (
    <svg {...base}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SlashIcon() {
  return (
    <svg {...base} strokeWidth={2}>
      <path d="M16 7 8 17" />
    </svg>
  );
}
