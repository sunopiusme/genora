export const palette = {
  neutral: {
    0: "#ffffff",
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    450: "#8a8a8a",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    750: "#303030",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
    1000: "#000000",
  },
  green: {
    300: "#bbf7d0",
    500: "#22c55e",
    950: "#0e2417",
  },
  red: {
    300: "#fecaca",
    500: "#ef4444",
    950: "#2a1212",
  },
  blue: {
    400: "#5eb0ee",
  },
  amber: {
    400: "#eab873",
    500: "#dd9a4b",
  },
} as const;

export const colors = {
  background: palette.neutral[1000],
  input: palette.neutral[950],
  surface: palette.neutral[900],
  surfaceElevated: palette.neutral[800],
  // Поверхности над чёрным фоном сайдбара — «высота» через светлоту
  surfaceRaised: palette.neutral[750],
  // Hover для элементов на raised-поверхности — ступень светлоты вместо обводки
  surfaceRaisedHover: palette.neutral[700],
  border: palette.neutral[800],
  borderStrong: palette.neutral[600],
  foreground: palette.neutral[50],
  foregroundMuted: palette.neutral[400],
  foregroundSubtle: palette.neutral[450],
  primary: palette.neutral[0],
  primaryForeground: palette.neutral[950],

  success: palette.green[500],
  successForeground: palette.green[300],
  successSurface: palette.green[950],
  danger: palette.red[500],
  dangerForeground: palette.red[300],
  dangerSurface: palette.red[950],

  warm: palette.amber[400],
  warmStrong: palette.amber[500],
  warmForeground: palette.neutral[0],

  avatar: palette.blue[400],
  avatarForeground: palette.neutral[0],

  overlay: "rgba(0, 0, 0, 0.72)",
} as const;

export type ColorToken = keyof typeof colors;
