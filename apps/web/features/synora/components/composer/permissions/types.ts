/* ─────────────────────────────────────────
   Типы для permission picker.

   Три уровня доступа агента:
     standard — обычный sandbox-режим (рука),
     review   — авто-ревью с человеком в петле,
     full     — полный доступ к окружению (warning).
   ───────────────────────────────────────── */

export type PermissionLevel = "standard" | "review" | "full";
