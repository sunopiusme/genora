export const spacing = {
  0: "0rem",
  px: "1px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

export const borderRadius = {
  none: "0rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
} as const;

export const boxShadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.24)",
  md: "0 4px 12px 0 rgba(0, 0, 0, 0.32)",
  lg: "0 12px 32px 0 rgba(0, 0, 0, 0.44)",
} as const;

export const zIndex = {
  base: 0,
  overlay: 60,
} as const;
