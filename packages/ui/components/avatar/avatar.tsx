import { forwardRef, useId, type ReactNode, type SVGProps } from "react";
import { cn } from "../../lib/cn";
import styles from "./avatar.module.css";

export interface AvatarProps extends SVGProps<SVGSVGElement> {
  /** Seed for the generative artwork (e.g. the user's name). */
  name: string;
  /** Rendered size, any CSS length. Defaults to 2rem. */
  size?: string | number;
}

/** Deep-space disc behind every shape. */
const SPACE = "#0a0a0f";

/** Vivid flat accents that pop on black. */
const COLORS = [
  "#4ade80", // aurora green
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#fb923c", // orange
  "#facc15", // yellow
  "#60a5fa", // blue
  "#fb7185", // coral
  "#5eead4", // mint
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

function polygonPoints(cx: number, cy: number, radius: number, sides: number) {
  const points: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = ((Math.PI * 2) / sides) * i - Math.PI / 2;
    points.push(
      `${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

/**
 * Flat bold shapes, one per avatar — sparkles, clovers, crescents,
 * flowers, stars, arches. All drawn in a 64x64 box around (32, 32).
 */
const SHAPES: Array<(color: string) => ReactNode> = [
  // Four-point sparkle with concave sides
  (color) => (
    <path
      d="M32 8 C34.5 24 40 29.5 56 32 C40 34.5 34.5 40 32 56 C29.5 40 24 34.5 8 32 C24 29.5 29.5 24 32 8 Z"
      fill={color}
    />
  ),
  // Quatrefoil clover (four overlapping lobes)
  (color) => (
    <g fill={color}>
      <circle cx={32} cy={21.5} r={10.5} />
      <circle cx={42.5} cy={32} r={10.5} />
      <circle cx={32} cy={42.5} r={10.5} />
      <circle cx={21.5} cy={32} r={10.5} />
      <rect x={24} y={24} width={16} height={16} />
    </g>
  ),
  // Scalloped flower (center + eight petals)
  (color) => (
    <g fill={color}>
      <circle cx={32} cy={32} r={13} />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = ((Math.PI * 2) / 8) * i - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={(32 + Math.cos(angle) * 13.5).toFixed(2)}
            cy={(32 + Math.sin(angle) * 13.5).toFixed(2)}
            r={7}
          />
        );
      })}
    </g>
  ),
  // Crescent moon
  (color) => (
    <path
      d="M39 9 A23.5 23.5 0 1 0 39 55 A19 19 0 1 1 39 9 Z"
      fill={color}
    />
  ),
  // Five-point star
  (color) => <polygon points={starPoints(32, 33.5, 24, 10, 5)} fill={color} />,
  // Hexagon
  (color) => <polygon points={polygonPoints(32, 32, 23, 6)} fill={color} />,
  // Arch (doorway)
  (color) => (
    <path
      d="M17 54 L17 31 A15 15 0 0 1 47 31 L47 54 Z"
      fill={color}
    />
  ),
  // Soft four-point diamond (rounded star)
  (color) => (
    <path
      d="M32 9 C36 22 42 28 55 32 C42 36 36 42 32 55 C28 42 22 36 9 32 C22 28 28 22 32 9 Z"
      fill={color}
    />
  ),
  // Half circle (rising sun)
  (color) => <path d="M10 43 A22 22 0 0 1 54 43 Z" fill={color} />,
];

export const Avatar = forwardRef<SVGSVGElement, AvatarProps>(function Avatar(
  { name, size = "2rem", className, ...props },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const seed = hashSeed(name.trim().toLowerCase());

  const shape = SHAPES[seed % SHAPES.length];
  const color = COLORS[(seed >>> 4) % COLORS.length];

  // Two tiny stars for the space vibe, tucked into opposite corners.
  const starAngle = ((seed >>> 8) % 360) * (Math.PI / 180);
  const starA = {
    x: CENTER + Math.cos(starAngle) * 25,
    y: CENTER + Math.sin(starAngle) * 25,
  };
  const starB = {
    x: CENTER + Math.cos(starAngle + Math.PI) * 26,
    y: CENTER + Math.sin(starAngle + Math.PI) * 26,
  };

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
        <rect width={SIZE} height={SIZE} fill={SPACE} />
        {shape(color)}
        <circle cx={starA.x} cy={starA.y} r={1.1} fill={color} opacity={0.6} />
        <circle cx={starB.x} cy={starB.y} r={0.8} fill={color} opacity={0.4} />
      </g>

      {/* Hairline rim so the disc reads as a solid object on black. */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={CENTER - 0.5}
        fill="none"
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth="1"
      />
    </svg>
  );
});
