import { forwardRef, useId, type ReactNode, type SVGProps } from "react";
import { cn } from "../../lib/cn";
import styles from "./avatar.module.css";

export interface AvatarProps extends SVGProps<SVGSVGElement> {
  /** Seed for the generative artwork (e.g. the user's name). */
  name: string;
  /** Rendered size, any CSS length. Defaults to 2rem. */
  size?: string | number;
}

/** Near-black ink for the flat glyph inside the disc. */
const INK = "#101014";

/** Muted, earthy accents that sit nicely on a dark UI. */
const COLORS = [
  "#98a25f", // olive
  "#d98551", // terracotta
  "#d9b16f", // amber
  "#7ba7bc", // steel blue
  "#c98d9c", // dusty rose
  "#74ac9a", // sage teal
  "#c3776b", // clay
  "#a9b2b8", // fog gray
];

const SIZE = 64;
const CENTER = SIZE / 2;

/** Small deterministic hash so the same name always yields the same art. */
function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  count: number,
) {
  const points: string[] = [];
  for (let i = 0; i < count * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / count) * i - Math.PI / 2;
    points.push(
      `${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

/**
 * One bold flat ink glyph per avatar, drawn in a 64x64 box.
 * Several are anchored to the bottom edge and get cropped by the
 * circular clip, like an object resting inside the disc.
 */
const SHAPES: Array<() => ReactNode> = [
  // Rounded steps rising to the right, resting on the bottom edge
  () => (
    <path
      d="M12 64 L12 46 Q12 42 16 42 L25 42 L25 32 Q25 28 29 28 L38 28 L38 18 Q38 14 42 14 L48 14 Q52 14 52 18 L52 64 Z"
      fill={INK}
    />
  ),
  // Crescent moon
  () => (
    <path d="M38 12 A21 21 0 1 0 38 52 A17 17 0 1 1 38 12 Z" fill={INK} />
  ),
  // Arch (doorway) resting on the bottom edge
  () => <path d="M19 64 L19 33 A13 13 0 0 1 45 33 L45 64 Z" fill={INK} />,
  // Four-point sparkle with concave sides
  () => (
    <path
      d="M32 11 C34.2 25 39 29.8 53 32 C39 34.2 34.2 39 32 53 C29.8 39 25 34.2 11 32 C25 29.8 29.8 25 32 11 Z"
      fill={INK}
    />
  ),
  // Half circle rising from the bottom edge
  () => <path d="M11 64 A21 21 0 0 1 53 64 Z" fill={INK} />,
  // Five-point star
  () => <polygon points={starPoints(32, 33.5, 21, 9, 5)} fill={INK} />,
  // Quatrefoil clover
  () => (
    <g fill={INK}>
      <circle cx={32} cy={23} r={9} />
      <circle cx={41} cy={32} r={9} />
      <circle cx={32} cy={41} r={9} />
      <circle cx={23} cy={32} r={9} />
      <rect x={25} y={25} width={14} height={14} />
    </g>
  ),
  // Leaning quarter-circle leaf, cropped at the bottom-left
  () => <path d="M14 64 L14 24 A40 40 0 0 1 54 64 Z" fill={INK} />,
  // Scalloped flower (center + six petals)
  () => (
    <g fill={INK}>
      <circle cx={32} cy={32} r={11} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={(32 + Math.cos(angle) * 11.5).toFixed(2)}
            cy={(32 + Math.sin(angle) * 11.5).toFixed(2)}
            r={6.5}
          />
        );
      })}
    </g>
  ),
  // Rolling hills on the bottom edge
  () => (
    <path
      d="M4 64 L4 52 A14 14 0 0 1 31 48 A13 13 0 0 1 56 51 L60 64 Z"
      fill={INK}
    />
  ),
];

export const Avatar = forwardRef<SVGSVGElement, AvatarProps>(function Avatar(
  { name, size = "2rem", className, ...props },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const seed = hashSeed(name.trim().toLowerCase());

  const shape = SHAPES[seed % SHAPES.length];
  const color = COLORS[(seed >>> 4) % COLORS.length];

  const clipId = `av-clip-${uid}`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      role="img"
      aria-label={name}
      className={cn(styles.avatar, className)}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER} cy={CENTER} r={CENTER} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <circle cx={CENTER} cy={CENTER} r={CENTER} fill={color} />
        {shape()}
      </g>
    </svg>
  );
});
