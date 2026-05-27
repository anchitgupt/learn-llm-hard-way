# Educational Viz Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five reusable SVG-based educational viz components (`TokenFlow`, `AttentionMap`, `LossCurve`, `SamplingPlot`, `EmbeddingSpace`) plus shared primitives at `apps/web/src/viz/`, with a `/viz` showcase route inside the app shell.

**Architecture:** All viz are pure presentational React components. D3 is used only for scales (`d3-scale`) and path generators (`d3-shape`); React owns the SVG DOM. Motion-for-React handles animation. Every component wraps in `<VizFrame>` so accessibility (`role="img"`, `<title>`, `<desc>`) is mandatory by construction. Colors come from token-aware helpers; no literal hex.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 3.4, shadcn/ui, Motion-for-React, `d3` (already installed at ^7.9.0 — we use `d3-scale` and `d3-shape` sub-modules), lucide-react, vitest, react-router-dom@^6.

**Spec:** [docs/superpowers/specs/2026-05-27-educational-viz-library-design.md](../specs/2026-05-27-educational-viz-library-design.md)

---

## Pre-flight

- [ ] **Pre-flight Step 1: Create a feature branch from `main`**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout main
git pull --ff-only
git checkout -b viz-library
git status
```

Expected: branch `viz-library` checked out, working tree clean.

- [ ] **Pre-flight Step 2: Commit the spec to the branch**

```bash
git add docs/superpowers/specs/2026-05-27-educational-viz-library-design.md \
        docs/superpowers/plans/2026-05-27-educational-viz-library.md
git commit -m "docs: educational viz library spec and plan

Sub-project 3 of the 7-part UI overhaul. Adds five reusable SVG-based
viz components (TokenFlow, AttentionMap, LossCurve, SamplingPlot,
EmbeddingSpace) at apps/web/src/viz/ with a /viz showcase route.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Pre-flight Step 3: Capture baseline test counts**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -2
npm run api:test  2>&1 | tail -2
npm --prefix apps/web test 2>&1 | tail -4
npm run e2e 2>&1 | tail -3
```

Expected: labs 40, api 25, web 54, e2e 4.

---

## Task 1: Shared primitives

Build the shared primitives that every viz uses. TDD for `VizFrame`, `Axes`, `scales.ts`, and `colors.ts`.

**Files:**
- Create: `apps/web/src/viz/data/types.ts`
- Create: `apps/web/src/viz/primitives/useResizeObserver.ts`
- Create: `apps/web/src/viz/primitives/VizFrame.tsx`
- Create: `apps/web/src/viz/primitives/Axes.tsx`
- Create: `apps/web/src/viz/primitives/Tooltip.tsx`
- Create: `apps/web/src/viz/primitives/Legend.tsx`
- Create: `apps/web/src/viz/primitives/scales.ts`
- Create: `apps/web/src/viz/primitives/colors.ts`
- Create: `apps/web/src/viz/__tests__/primitives/VizFrame.test.tsx`
- Create: `apps/web/src/viz/__tests__/primitives/Axes.test.tsx`
- Create: `apps/web/src/viz/__tests__/primitives/scales.test.ts`
- Create: `apps/web/src/viz/__tests__/primitives/colors.test.ts`
- Modify: `apps/web/vitest.setup.ts` (add `ResizeObserver` polyfill if missing)

### 1a. Shared types

- [ ] **Step 1a.1: Create `apps/web/src/viz/data/types.ts`**

```ts
export interface TokenItem {
  id: number | string;
  text: string;
  bytes?: number[];
}

export interface EmbeddingPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  cluster?: string;
}

export interface LossSeries {
  label: string;
  values: number[];
}

export interface AttentionMatrix {
  tokens: string[];
  scores: number[][]; // -Infinity entries are masked
}
```

### 1b. `scales.ts` (TDD)

- [ ] **Step 1b.1: Write the failing test** at `apps/web/src/viz/__tests__/primitives/scales.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { bandScale, linearScale, sequentialScale } from "../../primitives/scales";

describe("scales", () => {
  it("linearScale maps domain to range with d3-scale semantics", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });

  it("bandScale maps discrete domain to evenly spaced bands", () => {
    const s = bandScale(["a", "b", "c"], [0, 90], 0);
    expect(s("a")).toBe(0);
    expect(s("c")).toBe(60);
    expect(s.bandwidth()).toBe(30);
  });

  it("sequentialScale interpolates a CSS color string", () => {
    const s = sequentialScale([0, 1]);
    const at0 = s(0);
    const at1 = s(1);
    expect(typeof at0).toBe("string");
    expect(typeof at1).toBe("string");
    expect(at0).not.toBe(at1);
  });
});
```

- [ ] **Step 1b.2: Run and confirm FAIL**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
npm --prefix apps/web test -- scales 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 1b.3: Implement** `apps/web/src/viz/primitives/scales.ts`

```ts
import { scaleBand, scaleLinear, scaleSequential, type ScaleBand, type ScaleLinear, type ScaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

export function linearScale(domain: [number, number], range: [number, number]): ScaleLinear<number, number> {
  return scaleLinear<number, number>().domain(domain).range(range);
}

export function bandScale(domain: string[], range: [number, number], padding = 0.08): ScaleBand<string> {
  return scaleBand<string>().domain(domain).range(range).padding(padding);
}

/**
 * Token-aware sequential ramp. Resolves at component-render time against
 * computed styles on `:root`, falling back to two literal hex stops if
 * the CSS variables can't be read (server-side / earliest paint).
 */
export function sequentialScale(domain: [number, number]): ScaleSequential<string> {
  let low = "#0b1220";
  let high = "#22d3ee";
  if (typeof window !== "undefined" && document?.documentElement) {
    const cs = getComputedStyle(document.documentElement);
    const v1 = cs.getPropertyValue("--bg-inset").trim();
    const v2 = cs.getPropertyValue("--accent").trim();
    if (v1) low = v1;
    if (v2) high = v2;
  }
  const interp = interpolateRgb(low, high);
  return scaleSequential<string>(interp).domain(domain);
}
```

Note: `d3-interpolate` is included transitively with `d3` v7. If the import fails because the package isn't directly accessible, install it explicitly with `npm --prefix apps/web install d3-interpolate@^3`.

- [ ] **Step 1b.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- scales 2>&1 | tail -8
```

Expected: 3 assertions pass. If the `d3-interpolate` import fails, install the package and re-run.

### 1c. `colors.ts` (TDD)

- [ ] **Step 1c.1: Write the failing test** at `apps/web/src/viz/__tests__/primitives/colors.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { categoricalColor, magnitudeRamp, maskedColor } from "../../primitives/colors";

describe("colors", () => {
  it("magnitudeRamp returns a non-empty string for 0 and 1", () => {
    const lo = magnitudeRamp(0);
    const hi = magnitudeRamp(1);
    expect(typeof lo).toBe("string");
    expect(typeof hi).toBe("string");
    expect(lo.length).toBeGreaterThan(0);
    expect(hi).not.toBe(lo);
  });

  it("magnitudeRamp clamps inputs outside 0..1", () => {
    expect(magnitudeRamp(-1)).toBe(magnitudeRamp(0));
    expect(magnitudeRamp(2)).toBe(magnitudeRamp(1));
  });

  it("categoricalColor cycles deterministically", () => {
    expect(categoricalColor(0)).toBe(categoricalColor(0));
    expect(categoricalColor(0)).not.toBe(categoricalColor(1));
    expect(categoricalColor(0)).toBe(categoricalColor(8)); // 8-slot palette → wraps
  });

  it("maskedColor returns a deterministic CSS color string", () => {
    expect(maskedColor()).toBe(maskedColor());
    expect(typeof maskedColor()).toBe("string");
  });
});
```

- [ ] **Step 1c.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- colors 2>&1 | tail -10
```

- [ ] **Step 1c.3: Implement** `apps/web/src/viz/primitives/colors.ts`

```ts
import { sequentialScale } from "./scales";

const CATEGORICAL_SLOTS = 8;

function clamp01(t: number): number {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

let cachedRamp: ((t: number) => string) | null = null;

export function magnitudeRamp(t: number): string {
  if (!cachedRamp) {
    cachedRamp = sequentialScale([0, 1]);
  }
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
  "#22d3ee", "#34d399", "#fbbf24", "#f87171",
  "#60a5fa", "#67e8f9", "#8a96a8", "#5a6478"
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
  let v = "#1f2840"; // --border-subtle fallback
  if (typeof window !== "undefined" && document?.documentElement) {
    const cs = getComputedStyle(document.documentElement);
    const fromVar = cs.getPropertyValue("--border-subtle").trim();
    if (fromVar) v = fromVar;
  }
  cachedMask = v;
  return v;
}

// Test-only helper to clear caches between tests.
export function __resetColorCaches(): void {
  cachedRamp = null;
  cachedMask = null;
}
```

- [ ] **Step 1c.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- colors 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 1d. `useResizeObserver` + jsdom polyfill

- [ ] **Step 1d.1: Add a `ResizeObserver` polyfill to `vitest.setup.ts`**

Read the current file first, then append at the end:

```ts
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
```

- [ ] **Step 1d.2: Implement** `apps/web/src/viz/primitives/useResizeObserver.ts`

```ts
import { useEffect, useRef, useState } from "react";

export function useResizeObserver<T extends Element>(): {
  ref: React.RefObject<T | null>;
  width: number;
  height: number;
} {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, width: size.width, height: size.height };
}
```

### 1e. `VizFrame` (TDD)

- [ ] **Step 1e.1: Write the failing test** at `apps/web/src/viz/__tests__/primitives/VizFrame.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VizFrame } from "../../primitives/VizFrame";

describe("VizFrame", () => {
  it("renders an svg with role=img and the provided title/desc", () => {
    render(
      <VizFrame title="Demo viz" description="A demo viz for tests">
        <rect x={0} y={0} width={10} height={10} />
      </VizFrame>
    );
    const svg = screen.getByRole("img");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelector("title")?.textContent).toBe("Demo viz");
    expect(svg.querySelector("desc")?.textContent).toBe("A demo viz for tests");
  });

  it("renders its children inside the svg", () => {
    render(
      <VizFrame title="t" description="d">
        <rect data-testid="child" x={0} y={0} width={1} height={1} />
      </VizFrame>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
```

- [ ] **Step 1e.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- VizFrame 2>&1 | tail -10
```

- [ ] **Step 1e.3: Implement** `apps/web/src/viz/primitives/VizFrame.tsx`

```tsx
import { type ReactNode } from "react";
import { useResizeObserver } from "./useResizeObserver";
import { cn } from "@/lib/cn";

interface VizFrameProps {
  title: string;
  description: string;
  aspect?: number;
  className?: string;
  /** Inner padding in viewBox units. Defaults to 24. */
  padding?: number;
  children: ReactNode;
}

/**
 * Outer SVG wrapper. Owns responsive sizing (via useResizeObserver),
 * the role/aria-labelling, and inner padding. The viewBox is normalized
 * to 1000×(1000/aspect) units so children can use stable coordinates
 * regardless of container size.
 */
export function VizFrame({
  title,
  description,
  aspect = 16 / 10,
  className,
  padding = 24,
  children
}: VizFrameProps) {
  const { ref, width } = useResizeObserver<HTMLDivElement>();
  const viewW = 1000;
  const viewH = Math.round(1000 / aspect);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <svg
        role="img"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: width === 0 ? "auto" : undefined }}
      >
        <title>{title}</title>
        <desc>{description}</desc>
        <g transform={`translate(${padding} ${padding})`}>{children}</g>
      </svg>
    </div>
  );
}

/** Inner content dimensions (viewBox units minus padding on both sides). */
export function frameInner(padding = 24, aspect = 16 / 10): { width: number; height: number } {
  const viewW = 1000;
  const viewH = Math.round(1000 / aspect);
  return { width: viewW - padding * 2, height: viewH - padding * 2 };
}
```

- [ ] **Step 1e.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- VizFrame 2>&1 | tail -8
```

Expected: 2 assertions pass.

### 1f. `Axes` (TDD)

- [ ] **Step 1f.1: Write the failing test** at `apps/web/src/viz/__tests__/primitives/Axes.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Axes } from "../../primitives/Axes";
import { linearScale } from "../../primitives/scales";

describe("Axes", () => {
  it("renders the requested number of x ticks", () => {
    const { container } = render(
      <svg viewBox="0 0 800 400">
        <Axes
          xScale={linearScale([0, 10], [0, 800])}
          yScale={linearScale([0, 1], [400, 0])}
          width={800}
          height={400}
          xTicks={5}
          yTicks={4}
        />
      </svg>
    );
    expect(container.querySelectorAll("[data-axis='x'] [data-tick]").length).toBe(5);
    expect(container.querySelectorAll("[data-axis='y'] [data-tick]").length).toBe(4);
  });

  it("renders x and y axis labels when provided", () => {
    const { getByText } = render(
      <svg viewBox="0 0 800 400">
        <Axes
          xScale={linearScale([0, 10], [0, 800])}
          yScale={linearScale([0, 1], [400, 0])}
          width={800}
          height={400}
          xLabel="step"
          yLabel="loss"
        />
      </svg>
    );
    expect(getByText("step")).toBeInTheDocument();
    expect(getByText("loss")).toBeInTheDocument();
  });
});
```

- [ ] **Step 1f.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- Axes 2>&1 | tail -10
```

- [ ] **Step 1f.3: Implement** `apps/web/src/viz/primitives/Axes.tsx`

```tsx
import type { ScaleLinear } from "d3-scale";

interface AxesProps {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  xTicks?: number;
  yTicks?: number;
  xLabel?: string;
  yLabel?: string;
}

function nice(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export function Axes({
  xScale,
  yScale,
  width,
  height,
  xTicks = 5,
  yTicks = 5,
  xLabel,
  yLabel
}: AxesProps) {
  const xValues = xScale.ticks(xTicks);
  const yValues = yScale.ticks(yTicks);

  return (
    <g data-component="axes">
      {/* X axis baseline */}
      <line
        data-axis="x"
        x1={0}
        x2={width}
        y1={height}
        y2={height}
        stroke="var(--border)"
        strokeWidth={1}
      />
      <g data-axis="x">
        {xValues.map((v) => {
          const x = xScale(v);
          return (
            <g key={`x-${v}`} data-tick transform={`translate(${x} ${height})`}>
              <line y2={4} stroke="var(--border-subtle)" />
              <text y={16} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {nice(v)}
              </text>
            </g>
          );
        })}
      </g>

      {/* Y axis baseline */}
      <line
        data-axis="y"
        x1={0}
        x2={0}
        y1={0}
        y2={height}
        stroke="var(--border)"
        strokeWidth={1}
      />
      <g data-axis="y">
        {yValues.map((v) => {
          const y = yScale(v);
          return (
            <g key={`y-${v}`} data-tick transform={`translate(0 ${y})`}>
              <line x2={-4} stroke="var(--border-subtle)" />
              <text x={-8} y={4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                {nice(v)}
              </text>
            </g>
          );
        })}
      </g>

      {xLabel ? (
        <text
          x={width / 2}
          y={height + 36}
          textAnchor="middle"
          fontSize={12}
          fill="var(--text-primary)"
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          transform={`translate(-36 ${height / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill="var(--text-primary)"
        >
          {yLabel}
        </text>
      ) : null}
    </g>
  );
}
```

- [ ] **Step 1f.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- Axes 2>&1 | tail -8
```

Expected: 2 assertions pass.

### 1g. `Tooltip` and `Legend` (no own tests; covered by consumer tests later)

- [ ] **Step 1g.1: Implement** `apps/web/src/viz/primitives/Tooltip.tsx`

```tsx
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface TooltipProps {
  /** Mouse/pointer position relative to the document. Tooltip is hidden when null. */
  position: { x: number; y: number } | null;
  children: React.ReactNode;
}

export function Tooltip({ position, children }: TooltipProps) {
  // Defer portal until after mount so SSR/initial render is safe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left: position.x + 12,
        top: position.y + 12,
        pointerEvents: "none",
        zIndex: 50
      }}
      className="rounded-md bg-bg-elevated border border-border-subtle text-text-primary text-[12px] leading-[16px] px-2 py-1 shadow-md"
    >
      {children}
    </div>,
    document.body
  );
}
```

- [ ] **Step 1g.2: Implement** `apps/web/src/viz/primitives/Legend.tsx`

```tsx
interface LegendItem {
  swatch: string;     // CSS color (from colors.ts)
  label: string;
}

interface LegendProps {
  items: LegendItem[];
  title?: string;
  className?: string;
}

export function Legend({ items, title, className }: LegendProps) {
  return (
    <div className={className}>
      {title ? (
        <p className="text-[12px] uppercase tracking-wide text-text-muted mb-1">{title}</p>
      ) : null}
      <ul className="flex flex-wrap gap-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-[12px] text-text-muted"
          >
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm border border-border-subtle"
              style={{ background: item.swatch }}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 1h. Index, verify, commit

- [ ] **Step 1h.1: Create `apps/web/src/viz/index.ts` (empty so far; viz exports added in later tasks)**

```ts
// Public viz exports. Each viz component is added here as it lands.
export {};
```

- [ ] **Step 1h.2: Verify full suite and build**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: baseline 54 + 4 primitive tests (scales 3, colors 4, VizFrame 2, Axes 2 = 11 new assertions across 4 files) = 65 tests passing. Build clean.

Note: actual test count may differ slightly. The important thing: no regressions, all primitive tests green.

- [ ] **Step 1h.3: Commit Task 1**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/web/src/viz/data/ apps/web/src/viz/primitives/ \
        apps/web/src/viz/__tests__/primitives/ \
        apps/web/src/viz/index.ts \
        apps/web/vitest.setup.ts
git status -s
git commit -m "feat(viz): shared primitives (VizFrame, Axes, scales, colors, tooltip)

Builds the substrate every viz component will use: responsive
<VizFrame> with role=img + title/desc, <Axes>, <Tooltip>, <Legend>,
useResizeObserver, plus typed scales and token-aware color helpers.
No public viz components yet; those land in Tasks 2-4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: AttentionMap

First public viz. Highest pedagogical value and exercises the full primitive set.

**Files:**
- Create: `apps/web/src/viz/AttentionMap.tsx`
- Create: `apps/web/src/viz/__tests__/AttentionMap.test.tsx`
- Modify: `apps/web/src/viz/index.ts` (re-export)

### 2a. Failing test

- [ ] **Step 2a.1: Write** `apps/web/src/viz/__tests__/AttentionMap.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionMap } from "../AttentionMap";
import type { AttentionMatrix } from "../data/types";

const causal: AttentionMatrix = {
  tokens: ["a", "b", "c"],
  scores: [
    [1.0, -Infinity, -Infinity],
    [0.5, 0.5, -Infinity],
    [0.34, 0.33, 0.33]
  ]
};

describe("AttentionMap", () => {
  it("renders one cell per (row, col) pair", () => {
    const { container } = render(<AttentionMap data={causal} />);
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells.length).toBe(9);
  });

  it("marks masked cells with aria-label containing 'masked'", () => {
    const { container } = render(<AttentionMap data={causal} />);
    const masked = container.querySelectorAll("[data-cell][data-masked='true']");
    expect(masked.length).toBe(3); // upper triangle
    masked.forEach((cell) => {
      expect(cell.getAttribute("aria-label") ?? "").toMatch(/masked/i);
    });
  });

  it("renders row labels and column labels for each token", () => {
    render(<AttentionMap data={causal} />);
    for (const token of causal.tokens) {
      // Each token label appears twice (once as a row label, once as a column label).
      expect(screen.getAllByText(token).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("renders row sums when showRowSums=true", () => {
    const { container } = render(<AttentionMap data={causal} showRowSums />);
    const sums = container.querySelectorAll("[data-row-sum]");
    expect(sums.length).toBe(3);
  });
});
```

- [ ] **Step 2a.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- AttentionMap 2>&1 | tail -10
```

### 2b. Implementation

- [ ] **Step 2b.1: Create** `apps/web/src/viz/AttentionMap.tsx`

```tsx
import { useMemo } from "react";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { Legend } from "./primitives/Legend";
import { bandScale } from "./primitives/scales";
import { magnitudeRamp, maskedColor } from "./primitives/colors";
import type { AttentionMatrix } from "./data/types";

interface AttentionMapProps {
  data: AttentionMatrix;
  highlightedToken?: string | null;
  showRowSums?: boolean;
}

function isMasked(score: number): boolean {
  return !Number.isFinite(score);
}

export function AttentionMap({ data, highlightedToken, showRowSums }: AttentionMapProps) {
  const { tokens, scores } = data;
  const { width: innerW, height: innerH } = frameInner(24, 1.1);
  // Reserve label gutter on left and top.
  const labelGutter = 80;
  const sumGutter = showRowSums ? 80 : 0;
  const gridW = innerW - labelGutter - sumGutter;
  const gridH = innerH - labelGutter;

  const x = useMemo(() => bandScale(tokens, [0, gridW], 0.05), [tokens, gridW]);
  const y = useMemo(() => bandScale(tokens, [0, gridH], 0.05), [tokens, gridH]);
  const cellW = x.bandwidth();
  const cellH = y.bandwidth();

  const rowSums = useMemo(
    () =>
      scores.map((row) =>
        row.reduce((acc, v) => (Number.isFinite(v) ? acc + v : acc), 0)
      ),
    [scores]
  );

  return (
    <div>
      <VizFrame title="Attention map" description="A heatmap of attention weights with masked cells shown distinctly." aspect={1.1}>
        <g transform={`translate(${labelGutter} ${labelGutter})`}>
          {/* Column labels (rotated -45°) */}
          {tokens.map((tok, j) => (
            <text
              key={`col-${j}`}
              x={(x(tok) ?? 0) + cellW / 2}
              y={-8}
              fontSize={11}
              fill={tok === highlightedToken ? "var(--accent)" : "var(--text-muted)"}
              textAnchor="end"
              transform={`rotate(-45, ${(x(tok) ?? 0) + cellW / 2}, -8)`}
            >
              {tok}
            </text>
          ))}
          {/* Row labels */}
          {tokens.map((tok, i) => (
            <text
              key={`row-${i}`}
              x={-8}
              y={(y(tok) ?? 0) + cellH / 2 + 4}
              fontSize={11}
              fill={tok === highlightedToken ? "var(--accent)" : "var(--text-muted)"}
              textAnchor="end"
            >
              {tok}
            </text>
          ))}

          {/* Cells */}
          {scores.flatMap((row, i) =>
            row.map((score, j) => {
              const masked = isMasked(score);
              const cellX = x(tokens[j]) ?? 0;
              const cellY = y(tokens[i]) ?? 0;
              const fill = masked ? maskedColor() : magnitudeRamp(score);
              const stroke = highlightedToken
                ? (tokens[i] === highlightedToken || tokens[j] === highlightedToken
                  ? "var(--accent)"
                  : "transparent")
                : "transparent";
              const label = masked
                ? `${tokens[i]} → ${tokens[j]}: masked`
                : `${tokens[i]} → ${tokens[j]}: ${score.toFixed(2)}`;
              return (
                <g key={`cell-${i}-${j}`}>
                  <rect
                    data-cell
                    data-masked={masked || undefined}
                    aria-label={label}
                    x={cellX}
                    y={cellY}
                    width={cellW}
                    height={cellH}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                    rx={3}
                  />
                  {masked ? (
                    <line
                      x1={cellX}
                      y1={cellY}
                      x2={cellX + cellW}
                      y2={cellY + cellH}
                      stroke="var(--bg-base)"
                      strokeWidth={1}
                      opacity={0.4}
                    />
                  ) : null}
                </g>
              );
            })
          )}

          {/* Row sums */}
          {showRowSums
            ? rowSums.map((sum, i) => (
                <g
                  key={`sum-${i}`}
                  data-row-sum
                  transform={`translate(${gridW + 8} ${(y(tokens[i]) ?? 0) + cellH / 2})`}
                >
                  <rect
                    x={0}
                    y={-cellH / 4}
                    width={sum * 60}
                    height={cellH / 2}
                    fill="var(--accent-quiet)"
                    rx={2}
                  />
                  <text
                    x={(sum * 60) + 4}
                    y={4}
                    fontSize={11}
                    fill="var(--text-muted)"
                  >
                    {sum.toFixed(2)}
                  </text>
                </g>
              ))
            : null}
        </g>
      </VizFrame>

      <Legend
        className="mt-3"
        items={[
          { swatch: magnitudeRamp(0.05), label: "low" },
          { swatch: magnitudeRamp(0.5), label: "mid" },
          { swatch: magnitudeRamp(1.0), label: "high" },
          { swatch: maskedColor(), label: "masked" }
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 2b.2: Update `apps/web/src/viz/index.ts`**

```ts
export { AttentionMap } from "./AttentionMap";
```

- [ ] **Step 2b.3: Run and confirm PASS**

```bash
npm --prefix apps/web test -- AttentionMap 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2c. Verify + commit

- [ ] **Step 2c.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: previous total + 4 new = 69 tests, build clean.

- [ ] **Step 2c.2: Commit**

```bash
git add apps/web/src/viz/AttentionMap.tsx \
        apps/web/src/viz/__tests__/AttentionMap.test.tsx \
        apps/web/src/viz/index.ts
git commit -m "feat(viz): AttentionMap with masking, hover labels, row sums

Causal-masked cells render distinctly (gray with diagonal) and read as
'masked' to screen readers, not as numeric zero. Row sums optional;
columns and rows can be highlighted via highlightedToken prop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: TokenFlow, SamplingPlot, LossCurve

Three viz with similar shapes. Each follows TDD: failing test → implementation → PASS → commit.

**Files:**
- Create: `apps/web/src/viz/TokenFlow.tsx`
- Create: `apps/web/src/viz/__tests__/TokenFlow.test.tsx`
- Create: `apps/web/src/viz/SamplingPlot.tsx`
- Create: `apps/web/src/viz/__tests__/SamplingPlot.test.tsx`
- Create: `apps/web/src/viz/LossCurve.tsx`
- Create: `apps/web/src/viz/__tests__/LossCurve.test.tsx`
- Modify: `apps/web/src/viz/index.ts` (re-exports)

### 3a. TokenFlow (TDD)

- [ ] **Step 3a.1: Failing test** at `apps/web/src/viz/__tests__/TokenFlow.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TokenFlow } from "../TokenFlow";
import type { TokenItem } from "../data/types";

const tokens: TokenItem[] = [
  { id: 5, text: "The" },
  { id: 421, text: "tiny" },
  { id: 82, text: "model" }
];

describe("TokenFlow", () => {
  it("renders an empty state when tokens is empty", () => {
    render(<TokenFlow tokens={[]} />);
    expect(screen.getByText(/no tokens yet/i)).toBeInTheDocument();
  });

  it("renders a column per token per default stage (text, tokens, ids)", () => {
    const { container } = render(<TokenFlow tokens={tokens} />);
    const cells = container.querySelectorAll("[data-token-cell]");
    expect(cells.length).toBe(tokens.length * 3);
  });

  it("only renders the bytes stage when at least one token has bytes", () => {
    const withBytes: TokenItem[] = [
      { id: 5, text: "T", bytes: [84] },
      { id: 8, text: "h" }
    ];
    const { container, rerender } = render(<TokenFlow tokens={tokens} />);
    expect(container.querySelector("[data-stage='bytes']")).toBeNull();
    rerender(<TokenFlow tokens={withBytes} stages={["text", "tokens", "ids", "bytes"]} />);
    expect(container.querySelector("[data-stage='bytes']")).not.toBeNull();
  });
});
```

- [ ] **Step 3a.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- TokenFlow 2>&1 | tail -10
```

- [ ] **Step 3a.3: Implement** `apps/web/src/viz/TokenFlow.tsx`

```tsx
import { useMemo } from "react";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { bandScale } from "./primitives/scales";
import type { TokenItem } from "./data/types";

type Stage = "text" | "tokens" | "ids" | "bytes";

interface TokenFlowProps {
  tokens: TokenItem[];
  stages?: Stage[];
  highlightId?: TokenItem["id"];
}

const STAGE_LABEL: Record<Stage, string> = {
  text: "TEXT",
  tokens: "TOKENS",
  ids: "IDS",
  bytes: "BYTES"
};

export function TokenFlow({
  tokens,
  stages = ["text", "tokens", "ids"],
  highlightId
}: TokenFlowProps) {
  if (tokens.length === 0) {
    return (
      <div className="text-text-muted text-[14px] leading-[22px] py-6 text-center">
        No tokens yet.
      </div>
    );
  }

  const effectiveStages: Stage[] = stages.filter((s) => {
    if (s !== "bytes") return true;
    return tokens.some((t) => t.bytes && t.bytes.length > 0);
  });

  const aspect = 16 / Math.max(8, effectiveStages.length * 3);
  const { width: innerW, height: innerH } = frameInner(24, aspect);

  const xScale = useMemo(
    () => bandScale(tokens.map((t) => String(t.id)), [120, innerW], 0.15),
    [tokens, innerW]
  );
  const cellW = xScale.bandwidth();
  const rowHeight = innerH / effectiveStages.length;

  function valueFor(stage: Stage, t: TokenItem): string {
    switch (stage) {
      case "text":   return t.text;
      case "tokens": return t.text;
      case "ids":    return String(t.id);
      case "bytes":  return t.bytes ? t.bytes.join(" ") : "—";
    }
  }

  return (
    <VizFrame
      title="Token flow"
      description="Tokens shown through stages: text, tokens, and ids."
      aspect={aspect}
    >
      {effectiveStages.map((stage, si) => (
        <g key={stage} data-stage={stage} transform={`translate(0 ${si * rowHeight})`}>
          <text x={0} y={rowHeight / 2 + 4} fontSize={11} fill="var(--text-muted)" letterSpacing={1}>
            {STAGE_LABEL[stage]}
          </text>
          {tokens.map((t) => {
            const cx = xScale(String(t.id)) ?? 0;
            const highlighted = highlightId !== undefined && t.id === highlightId;
            return (
              <g key={`${stage}-${t.id}`} data-token-cell>
                <rect
                  x={cx}
                  y={rowHeight * 0.15}
                  width={cellW}
                  height={rowHeight * 0.7}
                  rx={6}
                  fill={highlighted ? "var(--accent-quiet)" : "var(--bg-surface)"}
                  stroke={highlighted ? "var(--accent)" : "var(--border-subtle)"}
                />
                <text
                  x={cx + cellW / 2}
                  y={rowHeight / 2 + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--text-primary)"
                  fontFamily="var(--font-mono)"
                >
                  {valueFor(stage, t)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </VizFrame>
  );
}
```

- [ ] **Step 3a.4: Update** `apps/web/src/viz/index.ts`

```ts
export { AttentionMap } from "./AttentionMap";
export { TokenFlow } from "./TokenFlow";
```

- [ ] **Step 3a.5: Run and confirm PASS**

```bash
npm --prefix apps/web test -- TokenFlow 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 3b. SamplingPlot (TDD)

- [ ] **Step 3b.1: Failing test** at `apps/web/src/viz/__tests__/SamplingPlot.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SamplingPlot } from "../SamplingPlot";

const candidates = [
  { token: "the",  probability: 0.51 },
  { token: "a",    probability: 0.30 },
  { token: "an",   probability: 0.19 }
];

describe("SamplingPlot", () => {
  it("renders one bar per candidate", () => {
    const { container } = render(<SamplingPlot candidates={candidates} />);
    expect(container.querySelectorAll("[data-bar]").length).toBe(3);
  });

  it("caps the number of bars at topK", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      token: `t${i}`,
      probability: 1 / (i + 1)
    }));
    const { container } = render(<SamplingPlot candidates={many} topK={5} />);
    expect(container.querySelectorAll("[data-bar]").length).toBe(5);
  });

  it("flags the selected token with data-selected", () => {
    const { container } = render(
      <SamplingPlot candidates={candidates} selectedToken="a" />
    );
    const selected = container.querySelectorAll("[data-bar][data-selected='true']");
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute("data-token")).toBe("a");
  });

  it("sorts bars by probability descending", () => {
    const shuffled = [
      { token: "x", probability: 0.1 },
      { token: "y", probability: 0.6 },
      { token: "z", probability: 0.3 }
    ];
    const { container } = render(<SamplingPlot candidates={shuffled} />);
    const tokens = Array.from(container.querySelectorAll("[data-bar]"))
      .map((b) => b.getAttribute("data-token"));
    expect(tokens).toEqual(["y", "z", "x"]);
  });
});
```

- [ ] **Step 3b.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- SamplingPlot 2>&1 | tail -10
```

- [ ] **Step 3b.3: Implement** `apps/web/src/viz/SamplingPlot.tsx`

```tsx
import { useMemo } from "react";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { Axes } from "./primitives/Axes";
import { bandScale, linearScale } from "./primitives/scales";

interface Candidate {
  token: string;
  probability: number;
  id?: number | string;
}

interface SamplingPlotProps {
  candidates: Candidate[];
  selectedToken?: string;
  topK?: number;
  temperature?: number;
}

export function SamplingPlot({
  candidates,
  selectedToken,
  topK = 20,
  temperature
}: SamplingPlotProps) {
  const sorted = useMemo(
    () => [...candidates].sort((a, b) => b.probability - a.probability).slice(0, topK),
    [candidates, topK]
  );

  const { width: innerW, height: innerH } = frameInner(24, 16 / 10);
  const labelGutter = 56;
  const baselineGutter = 48;
  const plotW = innerW - labelGutter;
  const plotH = innerH - baselineGutter;

  const xScale = useMemo(
    () => bandScale(sorted.map((c) => c.token), [0, plotW], 0.2),
    [sorted, plotW]
  );
  const maxP = sorted.length > 0 ? sorted[0].probability : 1;
  const yScale = useMemo(() => linearScale([0, Math.max(0.001, maxP)], [plotH, 0]), [maxP, plotH]);

  return (
    <div>
      <VizFrame
        title="Sampling distribution"
        description="Top-K candidate tokens ranked by probability."
        aspect={16 / 10}
      >
        <g transform={`translate(${labelGutter} 0)`}>
          <Axes
            xScale={linearScale([0, plotW], [0, plotW])}
            yScale={yScale}
            width={plotW}
            height={plotH}
            xTicks={0}
            yTicks={4}
            yLabel="probability"
          />
          {sorted.map((c) => {
            const x = xScale(c.token) ?? 0;
            const bw = xScale.bandwidth();
            const yTop = yScale(c.probability);
            const isSelected = c.token === selectedToken;
            return (
              <g key={c.token} data-bar data-token={c.token} data-selected={isSelected || undefined}>
                <rect
                  x={x}
                  y={yTop}
                  width={bw}
                  height={plotH - yTop}
                  fill={isSelected ? "var(--accent)" : "var(--accent-quiet)"}
                  stroke={isSelected ? "var(--accent)" : "transparent"}
                  rx={3}
                  style={isSelected ? { filter: "drop-shadow(var(--glow-accent))" } : undefined}
                />
                <text
                  x={x + bw / 2}
                  y={plotH + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                  transform={`rotate(-45, ${x + bw / 2}, ${plotH + 16})`}
                >
                  {c.token}
                </text>
                {isSelected ? (
                  <text
                    x={x + bw / 2}
                    y={yTop - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--accent)"
                  >
                    ← sampled
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </VizFrame>
      {temperature !== undefined ? (
        <p className="text-[12px] text-text-muted mt-2 font-mono">
          T = {temperature.toFixed(2)}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3b.4: Update** `apps/web/src/viz/index.ts`

```ts
export { AttentionMap } from "./AttentionMap";
export { TokenFlow } from "./TokenFlow";
export { SamplingPlot } from "./SamplingPlot";
```

- [ ] **Step 3b.5: Run and confirm PASS**

```bash
npm --prefix apps/web test -- SamplingPlot 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 3c. LossCurve (TDD)

- [ ] **Step 3c.1: Failing test** at `apps/web/src/viz/__tests__/LossCurve.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LossCurve } from "../LossCurve";

const train = { label: "train", values: [2.0, 1.5, 1.0, 0.7, 0.5] };
const val   = { label: "val",   values: [2.2, 1.7, 1.2, 0.9, 0.8] };

describe("LossCurve", () => {
  it("renders one path per series", () => {
    const { container } = render(<LossCurve series={[train, val]} />);
    expect(container.querySelectorAll("[data-series]").length).toBe(2);
  });

  it("respects an explicit yMax", () => {
    const { container } = render(<LossCurve series={[train]} yMax={5} />);
    expect(container.firstElementChild?.getAttribute("data-y-max")).toBe("5");
  });

  it("renders a rolling-mean overlay when showRollingMean is true", () => {
    const { container } = render(<LossCurve series={[train]} showRollingMean />);
    expect(container.querySelector("[data-rolling-mean]")).not.toBeNull();
  });
});
```

Note: the test queries the container element itself for `data-y-max`. The implementation will set that attribute on the wrapper `<div>`.

- [ ] **Step 3c.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- LossCurve 2>&1 | tail -10
```

- [ ] **Step 3c.3: Implement** `apps/web/src/viz/LossCurve.tsx`

```tsx
import { useMemo } from "react";
import { line as d3Line } from "d3-shape";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { Axes } from "./primitives/Axes";
import { linearScale } from "./primitives/scales";
import { categoricalColor } from "./primitives/colors";
import type { LossSeries } from "./data/types";

interface LossCurveProps {
  series: LossSeries[];
  steps?: number[];
  yMax?: number;
  showRollingMean?: boolean;
}

function rollingMean(values: number[], window = 5): number[] {
  if (values.length === 0) return [];
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(sum / Math.min(i + 1, window));
  }
  return out;
}

export function LossCurve({ series, steps, yMax, showRollingMean }: LossCurveProps) {
  const { width: innerW, height: innerH } = frameInner(24, 16 / 10);
  const labelGutter = 56;
  const baselineGutter = 48;
  const plotW = innerW - labelGutter;
  const plotH = innerH - baselineGutter;

  const maxLen = useMemo(
    () => Math.max(0, ...series.map((s) => s.values.length)),
    [series]
  );
  const xs = steps ?? Array.from({ length: maxLen }, (_, i) => i);
  const computedYMax = useMemo(() => {
    if (yMax !== undefined) return yMax;
    return Math.max(0.001, ...series.flatMap((s) => s.values));
  }, [series, yMax]);

  const xScale = useMemo(
    () => linearScale([xs[0] ?? 0, xs[xs.length - 1] ?? 1], [0, plotW]),
    [xs, plotW]
  );
  const yScale = useMemo(() => linearScale([0, computedYMax], [plotH, 0]), [computedYMax, plotH]);

  const generator = useMemo(
    () =>
      d3Line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y)),
    [xScale, yScale]
  );

  return (
    <div data-y-max={yMax !== undefined ? String(yMax) : undefined}>
      <VizFrame
        title="Loss curve"
        description="Training loss over steps; lower is better."
        aspect={16 / 10}
      >
        <g transform={`translate(${labelGutter} 0)`}>
          <Axes
            xScale={xScale}
            yScale={yScale}
            width={plotW}
            height={plotH}
            xLabel="step"
            yLabel="loss"
            xTicks={6}
            yTicks={5}
          />
          {series.map((s, si) => {
            const points = s.values.map((y, i) => ({ x: xs[i] ?? i, y }));
            const d = generator(points) ?? "";
            return (
              <path
                key={`series-${s.label}`}
                data-series
                data-label={s.label}
                d={d}
                fill="none"
                stroke={si === 0 ? "var(--accent)" : categoricalColor(si)}
                strokeWidth={2}
              />
            );
          })}
          {showRollingMean && series[0]
            ? (() => {
                const values = rollingMean(series[0].values);
                const points = values.map((y, i) => ({ x: xs[i] ?? i, y }));
                const d = generator(points) ?? "";
                return (
                  <path
                    data-rolling-mean
                    d={d}
                    fill="none"
                    stroke="var(--accent-hover)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                );
              })()
            : null}
        </g>
      </VizFrame>
    </div>
  );
}
```

- [ ] **Step 3c.4: Update** `apps/web/src/viz/index.ts`

```ts
export { AttentionMap } from "./AttentionMap";
export { TokenFlow } from "./TokenFlow";
export { SamplingPlot } from "./SamplingPlot";
export { LossCurve } from "./LossCurve";
```

- [ ] **Step 3c.5: Run and confirm PASS**

```bash
npm --prefix apps/web test -- LossCurve 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 3d. Verify + commit

- [ ] **Step 3d.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: previous total + 10 new = ~79 tests, build clean.

- [ ] **Step 3d.2: Commit**

```bash
git add apps/web/src/viz/TokenFlow.tsx \
        apps/web/src/viz/SamplingPlot.tsx \
        apps/web/src/viz/LossCurve.tsx \
        apps/web/src/viz/__tests__/TokenFlow.test.tsx \
        apps/web/src/viz/__tests__/SamplingPlot.test.tsx \
        apps/web/src/viz/__tests__/LossCurve.test.tsx \
        apps/web/src/viz/index.ts
git commit -m "feat(viz): TokenFlow, SamplingPlot, LossCurve

TokenFlow: tokens across stages (text/tokens/ids/bytes) with highlight.
SamplingPlot: ranked bars for softmax distribution, top-K, sampled
highlight, optional temperature label.
LossCurve: time-series lines via d3-shape with optional rolling-mean
overlay.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: EmbeddingSpace + demo data

**Files:**
- Create: `apps/web/src/viz/EmbeddingSpace.tsx`
- Create: `apps/web/src/viz/data/demoEmbeddings.ts`
- Create: `apps/web/src/viz/__tests__/EmbeddingSpace.test.tsx`
- Modify: `apps/web/src/viz/index.ts`

### 4a. Demo data

- [ ] **Step 4a.1: Create** `apps/web/src/viz/data/demoEmbeddings.ts`

```ts
import type { EmbeddingPoint } from "./types";

/**
 * Hand-curated 2D points for the /viz showcase. Three clusters:
 * numbers near (1, 1), animals near (3, 3), verbs near (5, 1).
 * Replace with real lab output (same shape) when an embeddings lab lands.
 */
export const demoEmbeddings: EmbeddingPoint[] = [
  // numbers
  { id: "one",   x: 1.0, y: 1.0, label: "one",   cluster: "numbers" },
  { id: "two",   x: 1.2, y: 1.1, label: "two",   cluster: "numbers" },
  { id: "three", x: 0.9, y: 1.3, label: "three", cluster: "numbers" },
  { id: "four",  x: 1.1, y: 0.8, label: "four",  cluster: "numbers" },
  { id: "five",  x: 1.3, y: 1.2, label: "five",  cluster: "numbers" },
  { id: "six",   x: 0.8, y: 1.1, label: "six",   cluster: "numbers" },
  { id: "seven", x: 1.0, y: 1.4, label: "seven", cluster: "numbers" },
  { id: "eight", x: 1.4, y: 1.0, label: "eight", cluster: "numbers" },
  { id: "nine",  x: 1.2, y: 0.9, label: "nine",  cluster: "numbers" },
  { id: "ten",   x: 0.95, y: 1.15, label: "ten", cluster: "numbers" },

  // animals
  { id: "cat",    x: 3.0, y: 3.0, label: "cat",    cluster: "animals" },
  { id: "dog",    x: 3.2, y: 3.1, label: "dog",    cluster: "animals" },
  { id: "bird",   x: 2.8, y: 3.3, label: "bird",   cluster: "animals" },
  { id: "fish",   x: 3.1, y: 2.7, label: "fish",   cluster: "animals" },
  { id: "horse",  x: 3.3, y: 3.2, label: "horse",  cluster: "animals" },
  { id: "cow",    x: 2.9, y: 2.9, label: "cow",    cluster: "animals" },
  { id: "lion",   x: 3.4, y: 3.0, label: "lion",   cluster: "animals" },
  { id: "tiger",  x: 3.5, y: 3.1, label: "tiger",  cluster: "animals" },
  { id: "wolf",   x: 3.2, y: 2.8, label: "wolf",   cluster: "animals" },
  { id: "bear",   x: 2.7, y: 3.0, label: "bear",   cluster: "animals" },

  // verbs
  { id: "run",    x: 5.0, y: 1.0, label: "run",    cluster: "verbs" },
  { id: "jump",   x: 5.2, y: 1.1, label: "jump",   cluster: "verbs" },
  { id: "walk",   x: 4.8, y: 1.2, label: "walk",   cluster: "verbs" },
  { id: "swim",   x: 5.1, y: 0.9, label: "swim",   cluster: "verbs" },
  { id: "fly",    x: 5.3, y: 1.3, label: "fly",    cluster: "verbs" },
  { id: "eat",    x: 4.9, y: 0.8, label: "eat",    cluster: "verbs" },
  { id: "sleep",  x: 5.2, y: 1.4, label: "sleep",  cluster: "verbs" },
  { id: "write",  x: 5.4, y: 1.0, label: "write",  cluster: "verbs" },
  { id: "read",   x: 5.0, y: 1.3, label: "read",   cluster: "verbs" },
  { id: "speak",  x: 4.7, y: 1.1, label: "speak",  cluster: "verbs" }
];
```

### 4b. EmbeddingSpace (TDD)

- [ ] **Step 4b.1: Failing test** at `apps/web/src/viz/__tests__/EmbeddingSpace.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmbeddingSpace } from "../EmbeddingSpace";
import type { EmbeddingPoint } from "../data/types";

const clustered: EmbeddingPoint[] = [
  { id: "a", x: 1, y: 1, cluster: "x" },
  { id: "b", x: 2, y: 2, cluster: "x" },
  { id: "c", x: 5, y: 5, cluster: "y" }
];

const unclustered: EmbeddingPoint[] = [
  { id: "a", x: 1, y: 1 },
  { id: "b", x: 2, y: 2 }
];

describe("EmbeddingSpace", () => {
  it("renders one circle per point", () => {
    const { container } = render(<EmbeddingSpace points={clustered} />);
    expect(container.querySelectorAll("[data-point]").length).toBe(3);
  });

  it("colors by cluster when any point has a cluster", () => {
    const { container } = render(<EmbeddingSpace points={clustered} />);
    const xs = container.querySelectorAll("[data-point][data-cluster='x']");
    const ys = container.querySelectorAll("[data-point][data-cluster='y']");
    expect(xs.length).toBe(2);
    expect(ys.length).toBe(1);
    expect(xs[0].getAttribute("fill")).not.toBe(ys[0].getAttribute("fill"));
  });

  it("falls back to a single accent color when no point has a cluster", () => {
    const { container } = render(<EmbeddingSpace points={unclustered} />);
    const points = container.querySelectorAll("[data-point]");
    const fills = new Set(Array.from(points).map((p) => p.getAttribute("fill")));
    expect(fills.size).toBe(1);
  });

  it("renders an accent ring around the selected point", () => {
    const { container } = render(<EmbeddingSpace points={clustered} selectedId="b" />);
    const selected = container.querySelector("[data-point][data-selected='true']");
    expect(selected).not.toBeNull();
    expect(selected?.getAttribute("data-id")).toBe("b");
  });
});
```

- [ ] **Step 4b.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- EmbeddingSpace 2>&1 | tail -10
```

- [ ] **Step 4b.3: Implement** `apps/web/src/viz/EmbeddingSpace.tsx`

```tsx
import { useMemo } from "react";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { Axes } from "./primitives/Axes";
import { Legend } from "./primitives/Legend";
import { linearScale } from "./primitives/scales";
import { categoricalColor } from "./primitives/colors";
import type { EmbeddingPoint } from "./data/types";

interface EmbeddingSpaceProps {
  points: EmbeddingPoint[];
  selectedId?: string;
  showClusters?: boolean;
}

export function EmbeddingSpace({ points, selectedId, showClusters }: EmbeddingSpaceProps) {
  const anyClustered = points.some((p) => Boolean(p.cluster));
  const clustering = showClusters ?? anyClustered;

  const { width: innerW, height: innerH } = frameInner(24, 16 / 10);
  const labelGutter = 56;
  const baselineGutter = 48;
  const plotW = innerW - labelGutter;
  const plotH = innerH - baselineGutter;

  const { xScale, yScale, clusterIndex } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const padX = (xMax - xMin) * 0.1 || 1;
    const padY = (yMax - yMin) * 0.1 || 1;
    const xScale = linearScale([xMin - padX, xMax + padX], [0, plotW]);
    const yScale = linearScale([yMin - padY, yMax + padY], [plotH, 0]);

    const clusters: string[] = [];
    for (const p of points) {
      if (p.cluster && !clusters.includes(p.cluster)) clusters.push(p.cluster);
    }
    const clusterIndex = new Map<string, number>();
    clusters.forEach((c, i) => clusterIndex.set(c, i));
    return { xScale, yScale, clusterIndex };
  }, [points, plotW, plotH]);

  const legendItems = clustering
    ? Array.from(clusterIndex.entries()).map(([cluster, i]) => ({
        swatch: categoricalColor(i),
        label: cluster
      }))
    : [];

  return (
    <div>
      <VizFrame
        title="Embedding space"
        description="Two-dimensional projection of embedding vectors."
        aspect={16 / 10}
      >
        <g transform={`translate(${labelGutter} 0)`}>
          <Axes xScale={xScale} yScale={yScale} width={plotW} height={plotH} xTicks={5} yTicks={5} />
          {points.map((p) => {
            const cx = xScale(p.x);
            const cy = yScale(p.y);
            const fill = clustering && p.cluster
              ? categoricalColor(clusterIndex.get(p.cluster) ?? 0)
              : "var(--accent)";
            const isSelected = p.id === selectedId;
            return (
              <g
                key={p.id}
                data-point
                data-id={p.id}
                data-cluster={p.cluster ?? undefined}
                data-selected={isSelected || undefined}
                fill={fill}
              >
                {isSelected ? (
                  <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--accent)" strokeWidth={2} />
                ) : null}
                <circle cx={cx} cy={cy} r={6} fill={fill} stroke="var(--bg-base)" strokeWidth={1} />
                {p.label && isSelected ? (
                  <text
                    x={cx + 12}
                    y={cy + 4}
                    fontSize={11}
                    fill="var(--text-primary)"
                    fontFamily="var(--font-mono)"
                  >
                    {p.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </VizFrame>
      {legendItems.length > 0 ? <Legend className="mt-3" items={legendItems} title="clusters" /> : null}
    </div>
  );
}
```

- [ ] **Step 4b.4: Update** `apps/web/src/viz/index.ts`

```ts
export { AttentionMap } from "./AttentionMap";
export { TokenFlow } from "./TokenFlow";
export { SamplingPlot } from "./SamplingPlot";
export { LossCurve } from "./LossCurve";
export { EmbeddingSpace } from "./EmbeddingSpace";
```

- [ ] **Step 4b.5: Run and confirm PASS**

```bash
npm --prefix apps/web test -- EmbeddingSpace 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 4c. Verify + commit

- [ ] **Step 4c.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: previous total + 4 new = ~83 tests, build clean.

- [ ] **Step 4c.2: Commit**

```bash
git add apps/web/src/viz/EmbeddingSpace.tsx \
        apps/web/src/viz/data/demoEmbeddings.ts \
        apps/web/src/viz/__tests__/EmbeddingSpace.test.tsx \
        apps/web/src/viz/index.ts
git commit -m "feat(viz): EmbeddingSpace 2D scatter + demo dataset

EmbeddingSpace renders one point per embedding, colors by optional
cluster, highlights a selected point with an accent ring. Ships with
a hand-curated 30-point demo dataset (numbers / animals / verbs); future
labs can emit the same EmbeddingPoint[] shape.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: /viz showcase route + sidebar entry

**Files:**
- Create: `apps/web/src/screens/VizShowcase.tsx`
- Create: `apps/web/src/screens/__tests__/VizShowcase.test.tsx`
- Modify: `apps/web/src/routes.tsx`
- Modify: `apps/web/src/shell/SideNav.tsx`
- Modify: `apps/web/src/__tests__/SideNav.test.tsx`

### 5a. Showcase screen (TDD)

- [ ] **Step 5a.1: Failing test** at `apps/web/src/screens/__tests__/VizShowcase.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VizShowcase } from "../VizShowcase";

describe("VizShowcase", () => {
  it("renders a heading for each of the five viz", () => {
    render(
      <MemoryRouter>
        <VizShowcase />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Educational visualizations/i })).toBeInTheDocument();
    for (const name of ["TokenFlow", "AttentionMap", "LossCurve", "SamplingPlot", "EmbeddingSpace"]) {
      expect(screen.getByRole("heading", { name: new RegExp(name, "i") })).toBeInTheDocument();
    }
  });

  it("renders at least one viz element of each kind", () => {
    const { container } = render(
      <MemoryRouter>
        <VizShowcase />
      </MemoryRouter>
    );
    expect(container.querySelectorAll("[data-cell]").length).toBeGreaterThan(0);    // AttentionMap
    expect(container.querySelectorAll("[data-token-cell]").length).toBeGreaterThan(0); // TokenFlow
    expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(0);    // SamplingPlot
    expect(container.querySelectorAll("[data-series]").length).toBeGreaterThan(0); // LossCurve
    expect(container.querySelectorAll("[data-point]").length).toBeGreaterThan(0);  // EmbeddingSpace
  });
});
```

- [ ] **Step 5a.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- VizShowcase 2>&1 | tail -10
```

- [ ] **Step 5a.3: Implement** `apps/web/src/screens/VizShowcase.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, Stagger } from "@/lib/motion";
import {
  AttentionMap,
  EmbeddingSpace,
  LossCurve,
  SamplingPlot,
  TokenFlow
} from "@/viz";
import { demoEmbeddings } from "@/viz/data/demoEmbeddings";
import type { AttentionMatrix, TokenItem } from "@/viz/data/types";

const demoTokens: TokenItem[] = [
  { id: 5, text: "The" },
  { id: 421, text: "tiny" },
  { id: 82, text: "model" },
  { id: 17, text: "reads" },
  { id: 901, text: "text" },
  { id: 4, text: "as" },
  { id: 230, text: "tokens" },
  { id: 12, text: "and" }
];

const demoAttention: AttentionMatrix = {
  tokens: ["the", "tiny", "model"],
  scores: [
    [1.0, -Infinity, -Infinity],
    [0.5, 0.5, -Infinity],
    [0.34, 0.33, 0.33]
  ]
};

const demoLoss = [
  {
    label: "train",
    values: Array.from({ length: 100 }, (_, i) =>
      2.5 * Math.exp(-i / 30) + 0.4 + (Math.sin(i / 5) * 0.05)
    )
  },
  {
    label: "val",
    values: Array.from({ length: 100 }, (_, i) =>
      2.7 * Math.exp(-i / 32) + 0.5 + (Math.cos(i / 7) * 0.05)
    )
  }
];

const demoSamples = [
  { token: "the", probability: 0.51 },
  { token: "a",   probability: 0.30 },
  { token: "an",  probability: 0.19 }
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[17px] leading-[24px]">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function VizShowcase() {
  return (
    <Stagger className="space-y-8">
      <Reveal>
        <header>
          <p className="text-[12px] uppercase tracking-wide text-text-muted">Library</p>
          <h1 className="text-[28px] leading-[36px] font-semibold">Educational visualizations</h1>
          <p className="text-text-muted">
            Five reusable viz with sample data. Each is a pure component fed by typed props.
          </p>
        </header>
      </Reveal>

      <Reveal>
        <Section title="TokenFlow">
          <TokenFlow tokens={demoTokens} />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="AttentionMap">
          <AttentionMap data={demoAttention} showRowSums />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="LossCurve">
          <LossCurve series={demoLoss} showRollingMean />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="SamplingPlot">
          <SamplingPlot candidates={demoSamples} selectedToken="the" temperature={1.0} />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="EmbeddingSpace">
          <EmbeddingSpace points={demoEmbeddings} selectedId="cat" />
        </Section>
      </Reveal>
    </Stagger>
  );
}
```

- [ ] **Step 5a.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- VizShowcase 2>&1 | tail -8
```

Expected: 2 assertions pass.

### 5b. Add route and sidebar entry

- [ ] **Step 5b.1: Update** `apps/web/src/routes.tsx`

Add the new route inside the existing `<Routes>` element route. The final shape:

```tsx
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { Dashboard } from "./screens/Dashboard";
import { VizShowcase } from "./screens/VizShowcase";
import {
  ArtifactsRoute, ChatRoute, ConceptMapRoute, ConceptRoute,
  FailuresRoute, GlossaryRoute, TracksRoute
} from "./screens/RouteWrappers";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="tracks"       element={<TracksRoute />} />
        <Route path="concepts"     element={<ConceptMapRoute />} />
        <Route path="concepts/:id" element={<ConceptRoute />} />
        <Route path="chat"         element={<ChatRoute />} />
        <Route path="glossary"     element={<GlossaryRoute />} />
        <Route path="artifacts"    element={<ArtifactsRoute />} />
        <Route path="failures"     element={<FailuresRoute />} />
        <Route path="viz"          element={<VizShowcase />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 5b.2: Update** `apps/web/src/shell/SideNav.tsx`

Read the current file first. Then:

(a) Add `Sparkles` to the lucide import line:

```tsx
import {
  CalendarDays, LayoutGrid, Network, BookOpen, MessageSquare, Library,
  Boxes, AlertOctagon, Sparkles, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
```

(b) Append a new entry to `ENTRIES` as the last item:

```tsx
const ENTRIES: NavEntry[] = [
  { to: "/",          label: "Today",       icon: CalendarDays, end: true },
  { to: "/tracks",    label: "Tracks",      icon: LayoutGrid },
  { to: "/concepts",  label: "Concept Map", icon: Network },
  { to: "/chat",      label: "Chat",        icon: MessageSquare },
  { to: "/glossary",  label: "Glossary",    icon: Library },
  { to: "/artifacts", label: "Artifacts",   icon: Boxes },
  { to: "/failures",  label: "Failures",    icon: AlertOctagon },
  { to: "/viz",       label: "Viz",         icon: Sparkles }
];
```

Leave the dynamic Concept-row injection logic unchanged.

- [ ] **Step 5b.3: Update** `apps/web/src/__tests__/SideNav.test.tsx`

Find the existing list of expected labels in the standalone test and append `"Viz"`:

```tsx
for (const label of ["Today", "Tracks", "Concept Map", "Chat", "Glossary", "Artifacts", "Failures", "Viz"]) {
  expect(screen.getByRole("link", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
}
```

### 5c. Verify all suites and dev-server smoke

- [ ] **Step 5c.1: Full gate**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 25, web ~85 (baseline 54 + 24 new + 2 showcase + 1 updated SideNav assertion), build clean, e2e 4.

- [ ] **Step 5c.2: Dev-server smoke test**

```bash
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-viz.log 2>&1 &
sleep 3
npm run web:dev > /tmp/web-viz.log 2>&1 &
sleep 5
/usr/bin/curl -sS -o /dev/null -w "/             -> HTTP %{http_code}\n" http://127.0.0.1:5173/
/usr/bin/curl -sS -o /dev/null -w "/viz          -> HTTP %{http_code}\n" http://127.0.0.1:5173/viz
/usr/bin/curl -sS -o /dev/null -w "/__foundation -> HTTP %{http_code}\n" http://127.0.0.1:5173/__foundation
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
```

Expected: all three return HTTP 200. The `/viz` route renders inside the shell (sidebar + header visible if you open it manually). `/__foundation` still bypasses the shell.

### 5d. Commit

- [ ] **Step 5d.1: Commit Task 5**

```bash
git add apps/web/src/screens/VizShowcase.tsx \
        apps/web/src/screens/__tests__/VizShowcase.test.tsx \
        apps/web/src/routes.tsx \
        apps/web/src/shell/SideNav.tsx \
        apps/web/src/__tests__/SideNav.test.tsx
git commit -m "feat(web): /viz showcase route + sidebar entry

VizShowcase renders all five viz components with sample data inside
the app shell. New 'Viz' (Sparkles) entry appended to SideNav so the
showcase is discoverable but reads as library/dev (last in the list).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Final 1: Branch state**

```bash
git log --oneline main..HEAD
```

Expected: roughly six commits — pre-flight docs, primitives, AttentionMap, the three-viz block, EmbeddingSpace, showcase.

- [ ] **Final 2: Every gate green**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 25, web ~85+, build clean, e2e 4.

- [ ] **Final 3: Hand off**

Stop here. Do not push or open a PR without the user's explicit instruction. Report:

- Commit list (`git log --oneline main..HEAD`).
- Final test counts per suite.
- One paragraph describing what `/viz` shows in dev.
- Any known follow-ups (e.g. real embedding data, Canvas path for LossCurve).
