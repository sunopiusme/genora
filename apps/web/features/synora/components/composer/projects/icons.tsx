/* ─────────────────────────────────────────
   Иконки project picker'а — стиль Solar Linear.
   24×24, stroke 1.5, скруглённая геометрия —
   единая шкала с lib/icon.tsx и composer/icons.
   Инлайн-SVG: без сетевых загрузок и мигания.
   ───────────────────────────────────────── */

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Solar folder-linear. */
const FOLDER_PATH =
  "M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h.643c.981 0 1.472 0 1.911.183c.44.183.786.53 1.48 1.224L15 6.37c.694.694 1.04 1.04 1.48 1.223c.439.183.93.183 1.911.183h.859c1.712 0 2.569 0 3.104.535c.646.646.646 1.526.646 3.688c0 3.771 0 5.657-1.172 6.829C20.657 20 18.771 20 15 20H10c-3.771 0-5.657 0-6.828-1.171C2 17.657 2 15.771 2 12Z";

export function FolderIcon() {
  return (
    <svg {...base}>
      <path d={FOLDER_PATH} />
    </svg>
  );
}

/* Folder с «биркой» — активный проект. */
export function ProjectFolderIcon() {
  return (
    <svg {...base}>
      <path d={FOLDER_PATH} />
      <path d="M8 12.5v4" />
      <path d="M8 12.5h2.5" />
    </svg>
  );
}

/* Solar add-folder-linear. */
export function FolderPlusIcon() {
  return (
    <svg {...base}>
      <path d={FOLDER_PATH} />
      <path d="M12 11v5" />
      <path d="M9.5 13.5h5" />
    </svg>
  );
}

/* Folder с крестиком — «без проекта». */
export function FolderXIcon() {
  return (
    <svg {...base}>
      <path d={FOLDER_PATH} />
      <path d="m10.25 11.75 3.5 3.5" />
      <path d="m13.75 11.75-3.5 3.5" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ExistingFolderIcon() {
  return (
    <svg {...base}>
      <path d={FOLDER_PATH} />
    </svg>
  );
}

/* Solar magnifer-linear. */
export function SearchIcon() {
  return (
    <svg {...base}>
      <circle cx="11.5" cy="11.5" r="8" />
      <path d="M17.5 17.5 21 21" />
    </svg>
  );
}

/* Solar check-read-linear (одиночная галочка). */
export function CheckIcon() {
  return (
    <svg {...base} strokeWidth={1.8}>
      <path d="m4.5 12.75 4.5 4.5L19.5 6.75" />
    </svg>
  );
}

/* Solar alt-arrow-down-linear. */
export function ChevronDownIcon() {
  return (
    <svg {...base}>
      <path d="m19 9-7 6-7-6" />
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
