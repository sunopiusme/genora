import { forwardRef, useId, type SVGProps } from "react";
import { cn } from "../../lib/cn";
import styles from "./avatar.module.css";

export interface AvatarProps extends SVGProps<SVGSVGElement> {
  /** Seed for the generative artwork (e.g. the user's name). */
  name: string;
  /** Rendered size, any CSS length. Defaults to 2rem. */
  size?: string | number;
}

type Palette = {
  /** Deep-space base, darkest point of the backdrop. */
  space: string;
  /** Slightly lifted tone at the edge of the backdrop. */
  horizon: string;
  /** Primary nebula blob. */
  nebulaA: string;
  /** Secondary nebula blob. */
  nebulaB: string;
  /** Orbit ring + star tint. */
  accent: string;
};

const PALETTES: Palette[] = [
  // Aurora — teal & green over deep petrol
  {
    space: "#03080f",
    horizon: "#0a1c26",
    nebulaA: "#22d3ee",
    nebulaB: "#34d399",
    accent: "#a5f3fc",
  },
  // Nebula — magenta & indigo dust
  {
    space: "#0b0413",
    horizon: "#1c0f2e",
    nebulaA: "#e879f9",
    nebulaB: "#6366f1",
    accent: "#f5d0fe",
  },
  // Solar — ember orange & rose flare
  {
    space: "#100502",
    horizon: "#2a0f0a",
    nebulaA: "#fb923c",
    nebulaB: "#f43f5e",
    accent: "#fde68a",
  },
  // Ion — electric blue & soft violet
  {
    space: "#04060f",
    horizon: "#0d142e",
    nebulaA: "#60a5fa",
    nebulaB: "#c084fc",
    accent: "#dbeafe",
  },
  // Plasma — teal & gold spark
  {
    space: "#020d0a",
    horizon: "#0a2019",
    nebulaA: "#2dd4bf",
    nebulaB: "#facc15",
    accent: "#ccfbf1",
  },
];

/** Small deterministic hash so the same name always yields the same art. */
function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Cheap seeded PRNG (mulberry32) — stable across renders and platforms. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 64;
const CENTER = SIZE / 2;

export const Avatar = forwardRef<SVGSVGElement, AvatarProps>(function Avatar(
  { name, size = "2rem", className, ...props },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const seed = hashSeed(name.trim().toLowerCase());
  const random = createRandom(seed);

  const palette = PALETTES[seed % PALETTES.length];

  // Nebula blobs — two soft radial glows drifting in opposite quadrants.
  const angleA = random() * Math.PI * 2;
  const angleB = angleA + Math.PI * (0.7 + random() * 0.6);
  const radiusA = 12 + random() * 8;
  const radiusB = 12 + random() * 8;
  const blobA = {
    cx: CENTER + Math.cos(angleA) * radiusA,
    cy: CENTER + Math.sin(angleA) * radiusA,
    r: 22 + random() * 8,
  };
  const blobB = {
    cx: CENTER + Math.cos(angleB) * radiusB,
    cy: CENTER + Math.sin(angleB) * radiusB,
    r: 18 + random() * 8,
  };

  // Orbit ring — a thin tilted ellipse with a bright "planet" on its path.
  const ringTilt = Math.round(random() * 180);
  const ringRx = 22 + random() * 4;
  const ringRy = 8 + random() * 4;
  const planetAngle = random() * Math.PI * 2;
  const planet = {
    x: Math.cos(planetAngle) * ringRx,
    y: Math.sin(planetAngle) * ringRy,
  };

  // Stars — a scatter of tiny points, sizes and brightness vary.
  const stars = Array.from({ length: 7 }, () => {
    const angle = random() * Math.PI * 2;
    const distance = 6 + random() * 22;
    return {
      x: CENTER + Math.cos(angle) * distance,
      y: CENTER + Math.sin(angle) * distance,
      r: 0.5 + random() * 0.9,
      opacity: 0.5 + random() * 0.5,
    };
  });

  const clipId = `av-clip-${uid}`;
  const bgId = `av-bg-${uid}`;
  const blobAId = `av-a-${uid}`;
  const blobBId = `av-b-${uid}`;
  const blurId = `av-blur-${uid}`;

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
        <radialGradient id={bgId} cx="35%" cy="30%" r="90%">
          <stop offset="0%" stopColor={palette.horizon} />
          <stop offset="100%" stopColor={palette.space} />
        </radialGradient>
        <radialGradient id={blobAId}>
          <stop offset="0%" stopColor={palette.nebulaA} stopOpacity="0.95" />
          <stop offset="55%" stopColor={palette.nebulaA} stopOpacity="0.35" />
          <stop offset="100%" stopColor={palette.nebulaA} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={blobBId}>
          <stop offset="0%" stopColor={palette.nebulaB} stopOpacity="0.9" />
          <stop offset="55%" stopColor={palette.nebulaB} stopOpacity="0.3" />
          <stop offset="100%" stopColor={palette.nebulaB} stopOpacity="0" />
        </radialGradient>
        <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width={SIZE} height={SIZE} fill={`url(#${bgId})`} />

        <circle
          cx={blobA.cx}
          cy={blobA.cy}
          r={blobA.r}
          fill={`url(#${blobAId})`}
          filter={`url(#${blurId})`}
        />
        <circle
          cx={blobB.cx}
          cy={blobB.cy}
          r={blobB.r}
          fill={`url(#${blobBId})`}
          filter={`url(#${blurId})`}
        />

        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={palette.accent}
            opacity={star.opacity}
          />
        ))}

        <g transform={`rotate(${ringTilt} ${CENTER} ${CENTER})`}>
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={ringRx}
            ry={ringRy}
            fill="none"
            stroke={palette.accent}
            strokeWidth="0.75"
            opacity="0.55"
          />
          <circle
            cx={CENTER + planet.x}
            cy={CENTER + planet.y}
            r="2"
            fill={palette.accent}
          />
          <circle
            cx={CENTER + planet.x}
            cy={CENTER + planet.y}
            r="3.5"
            fill={palette.accent}
            opacity="0.25"
          />
        </g>
      </g>

      {/* Hairline rim so the disc reads as a solid object on black. */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={CENTER - 0.5}
        fill="none"
        stroke={palette.accent}
        strokeOpacity="0.28"
        strokeWidth="1"
      />
    </svg>
  );
});
