import { sequentialScale } from "./scales";

const CATEGORICAL_SLOTS = 8;

function clamp01(t: number): number {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

let cachedRamp: ((t: number) => string) | null = null;

export function magnitudeRamp(t: number): string {
  if (!cachedRamp) cachedRamp = sequentialScale([0, 1]);
  return cachedRamp(clamp01(t));
}

const CATEGORICAL_TOKEN_NAMES = [
  "--accent",
  "--success",
  "--warning",
  "--danger",
  "--info",
  "--accent-hover",
  "--text-muted",
  "--text-faint"
] as const;

const CATEGORICAL_FALLBACKS = [
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
  "#67e8f9",
  "#8a96a8",
  "#5a6478"
];

export function categoricalColor(index: number): string {
  const i = ((index % CATEGORICAL_SLOTS) + CATEGORICAL_SLOTS) % CATEGORICAL_SLOTS;
  if (typeof window !== "undefined" && document?.documentElement) {
    const cs = getComputedStyle(document.documentElement);
    const v = cs.getPropertyValue(CATEGORICAL_TOKEN_NAMES[i]).trim();
    if (v) return v;
  }
  return CATEGORICAL_FALLBACKS[i];
}

let cachedMask: string | null = null;

export function maskedColor(): string {
  if (cachedMask) return cachedMask;
  let v = "#1f2840";
  if (typeof window !== "undefined" && document?.documentElement) {
    const cs = getComputedStyle(document.documentElement);
    const fromVar = cs.getPropertyValue("--border-subtle").trim();
    if (fromVar) v = fromVar;
  }
  cachedMask = v;
  return v;
}

export function __resetColorCaches(): void {
  cachedRamp = null;
  cachedMask = null;
}
