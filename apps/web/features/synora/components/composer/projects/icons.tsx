/* ─────────────────────────────────────────
   Иконки project picker'а.
   Все 24×24 outlined, strokeWidth 1.6 —
   единая шкала с остальными иконками composer'а.
   ───────────────────────────────────────── */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function FolderIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

/* Folder с маленькой стрелкой / тегом — для
   project (отличается от workspace folder). */
export function ProjectFolderIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M7 12v5" />
      <path d="M7 12h2" />
    </svg>
  );
}

export function FolderPlusIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export function FolderXIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="m10 12 4 4" />
      <path d="m14 12-4 4" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...baseProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ExistingFolderIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      {...baseProps}
      strokeWidth={2.4}
    >
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...baseProps} strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg {...baseProps} strokeWidth={2}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
