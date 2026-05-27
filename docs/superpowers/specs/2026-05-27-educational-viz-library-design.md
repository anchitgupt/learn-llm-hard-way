# Educational Viz Library

Date: 2026-05-27

Sub-project 3 of a 7-part UI overhaul. Builds on the Design Foundation
(sub-project 1) and the App Shell + Dashboard (sub-project 2). Produces a
shared library of teaching visualizations consumed by later sub-projects.

## Goal

Ship five reusable SVG-based educational viz components — `TokenFlow`,
`AttentionMap`, `LossCurve`, `SamplingPlot`, `EmbeddingSpace` — plus a
small set of shared primitives that handle accessibility, sizing, axes,
tooltips, and color. Land them under `apps/web/src/viz/` with a `/viz`
showcase route that demos each with sample data inside the new app shell.

Integration into specific screens (Concept Workspace, Chat Playground,
etc.) happens in later sub-projects. This one ships the library and the
showcase; nothing else.

## Principles

These extend the Design Foundation's principles into the viz layer.

1. **Each viz is a pure presentational component.** Data comes in as
   typed props. No fetching, no global state. Reusable in any screen.
2. **React owns the DOM.** D3 is used only via `d3-scale` and `d3-shape`.
   No `d3-selection`, no `d3.select()`, no imperative DOM mutation.
3. **Animation = teaching.** Token slides, attention pulses, loss curve
   drawing in — these ARE the lesson. Use `motion/react` with the
   foundation's `springViz` for educational moments and `--ease-out` for
   chrome.
4. **Tokens never magic numbers.** Colors come from token-aware helpers
   in `colors.ts`, never literal hex inside viz components.
5. **Accessibility is structural.** Every viz wraps in `<VizFrame>` so
   `role="img"`, `<title>`, and `<desc>` are mandatory by construction.
   Masked attention cells read as "masked," not as numeric zero.

## Rendering Technology

SVG + D3-for-scales for all five viz. Reasoning:

- Educational data sizes (3×3 to 64×64 attention, ≤500 loss steps,
  top-20 of a vocab distribution, ~30 embedding points) are well within
  SVG's smooth range.
- Motion-for-React animates SVG declaratively; Canvas would force an
  imperative path.
- Per-element accessibility, hover, and focus come free with SVG;
  Canvas would require a hit-test layer.
- Right-click on an SVG saves a copyable graphic; learners may paste a
  saved attention matrix into their own notes.

Escape hatch: if `LossCurve` ever needs >2000 points, a Canvas path
lands behind the same component API. Documented in `LossCurve.tsx` as
a comment; not implemented today.

## File Structure

```text
apps/web/src/viz/
  index.ts                          re-exports the 5 public components
  primitives/
    VizFrame.tsx                    outer SVG + responsive viewBox + title/desc
    Axes.tsx                        X/Y axes with ticks, gridlines, optional labels
    Tooltip.tsx                     hover tooltip following pointer; portaled
    Legend.tsx                      small key for color/category mappings
    useResizeObserver.ts            tracks container width for responsive sizing
    scales.ts                       wrappers around d3-scale (linear, band, sequential)
    colors.ts                       token-aware color helpers
  TokenFlow.tsx                     1D sequence with annotation lanes
  AttentionMap.tsx                  2D heatmap with row/col labels and mask handling
  LossCurve.tsx                     time-series line(s) with draw-in animation
  SamplingPlot.tsx                  vertical bars for softmax distribution
  EmbeddingSpace.tsx                2D scatter with optional cluster coloring
  data/
    demoEmbeddings.ts               synthetic ~30-point dataset for the showcase
    types.ts                        shared shapes
  __tests__/
    primitives/
      VizFrame.test.tsx
      Axes.test.tsx
      scales.test.ts
      colors.test.ts
    TokenFlow.test.tsx
    AttentionMap.test.tsx
    LossCurve.test.tsx
    SamplingPlot.test.tsx
    EmbeddingSpace.test.tsx
```

The showcase screen lives outside the library:

```text
apps/web/src/screens/
  VizShowcase.tsx                   /viz route component
  __tests__/
    VizShowcase.test.tsx
```

`apps/web/src/routes.tsx` and `apps/web/src/shell/SideNav.tsx` are
modified to add the `/viz` route and the "Viz" sidebar entry.

## Shared Contracts

```ts
// viz/data/types.ts

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
  label: string;          // "train" / "val"
  values: number[];
}

export interface AttentionMatrix {
  tokens: string[];       // rows AND cols (square; self-attention)
  scores: number[][];     // -Infinity entries render as masked
}
```

## Shared Primitives

### `<VizFrame>`

Outer `<svg>` with `role="img"`, `<title>`, `<desc>`, responsive
`viewBox`, and fixed inner padding. Every viz wraps in `<VizFrame>` so
accessibility and sizing are consistent.

```ts
interface VizFrameProps {
  title: string;
  description: string;
  aspect?: number;            // default 16/10
  className?: string;
  children: ReactNode;
}
```

Width is observed via `useResizeObserver`. Height is derived from
`width / aspect`. Inner padding is 24px on all sides.

### `<Axes>`

X and Y axes built on d3 scales. Tick lines use `--border-subtle`, tick
labels use `--text-muted`, optional axis labels use `--text-primary`.

### `<Tooltip>`

Pointer-following tooltip with token-based styling. Portaled to
`document.body` so it never clips against a viz's `overflow: hidden`.

### `<Legend>`

Small horizontal key: swatch + label, optional title.

### `scales.ts`

```ts
export function linearScale(domain: [number, number], range: [number, number]): ScaleLinear<number, number>;
export function bandScale(domain: string[], range: [number, number], padding?: number): ScaleBand<string>;
export function sequentialScale(domain: [number, number]): ScaleSequential<string>;
```

### `colors.ts`

```ts
export function magnitudeRamp(t: number): string;       // 0..1 → cyan→accent ramp via CSS color-mix
export function categoricalColor(index: number): string; // 8-slot palette from tokens
export function maskedColor(): string;                   // --bg-inset stripe
```

All helpers resolve to values driven by the CSS variables defined in
sub-project 1's `tokens.css`.

## Viz Components

### `<TokenFlow>`

Show a sequence of tokens stepping through stages: raw text → token
strings → token ids (optional bytes lane). Replaces the static
`apps/web/src/components/TokenFlowSvg.tsx`.

```ts
interface TokenFlowProps {
  tokens: TokenItem[];
  stages?: Array<"text" | "tokens" | "ids" | "bytes">;   // default ["text","tokens","ids"]
  highlightId?: TokenItem["id"];
}
```

Layout: one horizontal row per stage, vertically stacked, column-aligned
so the same token's column is traceable across stages.

Motion:

- Initial: each column slides down 8px → 0 with `panelEnter` staggered
  30ms left-to-right.
- Hover a token in any row: cyan vertical guide line connects all
  stages for that column; tooltip with full token info.
- Replay button (top-right) re-plays the stagger.

Empty `tokens` array renders "No tokens yet." The bytes stage only
appears if at least one token has `bytes` set.

### `<AttentionMap>`

2D heatmap of an attention matrix. Rows = queries, columns = keys.
Causal-masked cells render distinctly (gray with diagonal hatch) rather
than as 0, which would be misleading.

```ts
interface AttentionMapProps {
  data: AttentionMatrix;
  highlightedToken?: string | null;
  showRowSums?: boolean;
}
```

Layout: square grid. Row labels left, column labels rotated -45° at top.
Cells colored by magnitude via `magnitudeRamp`. Masked cells use
`maskedColor()` with a diagonal hatch and `aria-label` containing
"masked".

Interactions:

- Hover a cell → tooltip with `query → key: weight`.
- Click a row label → that row's query becomes highlighted (cyan stroke
  on its row + corresponding column).
- Optional row-sum bar (when `showRowSums`): bar of length 1.0 to the
  right of each row, a sanity-check that softmax rows sum to 1.

Motion:

- Initial: cells fade in with stagger by row, then by column within each
  row; ~60ms per row.
- Data update (controlled re-render with new `data`): cells crossfade
  their fill over `--dur-viz` (600ms) so the learner sees attention
  shift between attempts.

Legend below the map shows a 0→1 ramp plus one solid "masked" swatch.

### `<LossCurve>`

Training loss over steps, with optional additional series (e.g.
validation) overlaid.

```ts
interface LossCurveProps {
  series: LossSeries[];           // first is primary (accent color)
  steps?: number[];               // explicit x; defaults to indices
  yMax?: number;                  // pin top of y-axis; auto if omitted
  showRollingMean?: boolean;
}
```

Layout: `<Axes>` for X (steps) and Y (loss). Lines drawn with
`d3.line()` path generator.

Motion:

- Initial: each line draws in using the `drawPath` variant from the
  foundation (`pathLength: 0 → 1`) over `--dur-viz`.
- Data update: morph the existing path to the new shape via motion's
  value interpolation.
- Hover: vertical crosshair follows the cursor; tooltip shows step + each
  visible series' value at that x.

Performance: SVG handles ≤2000 points well. Above that, a Canvas
fallback lands behind the same API. Today: SVG only.

### `<SamplingPlot>`

Softmax distribution as ranked vertical bars. Selected token gets a
highlight.

```ts
interface SamplingPlotProps {
  candidates: Array<{ token: string; probability: number; id?: number | string }>;
  selectedToken?: string;
  topK?: number;                  // default 20
  temperature?: number;           // display label only
}
```

Bars sorted by probability descending. X-axis labels rotated -45° when
crowded. `topK` prevents 50k-vocab disasters.

Motion:

- Initial: bars grow from height 0 with staggered `springViz`, 20ms
  apart.
- Selected token: bar gets `--glow-accent` and a small label "← sampled".

### `<EmbeddingSpace>`

2D scatter of embedding points with optional cluster coloring.

```ts
interface EmbeddingSpaceProps {
  points: EmbeddingPoint[];
  selectedId?: string;
  showClusters?: boolean;         // defaults true if any point has cluster
}
```

Layout: `<Axes>` X/Y with auto-domain. Points are 6px circles colored
by `cluster` via `categoricalColor` when clustering is on, else all
accent-cyan. Selected point: 2px accent ring.

Motion:

- Initial: points fade in with `staggerChildren: 0.015s`, springy
  enter.
- Hover a point: tooltip with `label` and coordinates; other points dim
  to 30% opacity over `--dur-base`.
- Selecting a point pans the viewBox so the point centers (ease-pan, not
  data mutation).

Data source: ship `viz/data/demoEmbeddings.ts` with ~30 hand-clustered
words (numbers, animals, verbs) for the showcase. Future labs can
produce real embeddings in the same `EmbeddingPoint[]` shape.

## Showcase Route

`apps/web/src/screens/VizShowcase.tsx` renders at `/viz` **inside** the
app shell (header + sidebar visible). This is the only contrast with
`/__foundation`, which deliberately bypasses the shell: the foundation
showcase is the design system at zero, the viz showcase is real
components embedded in real chrome.

`/viz` renders one section per viz, top-to-bottom, each in a `<Card>`
with the title above. Demo data:

| Demo data | Source |
|-----------|--------|
| `demoTokens` | Inline literal: 8 short tokens with ids |
| `demoAttention` | Inline copy of `artifacts/labs/attention-demo.json` (3×3 causal) |
| `demoLoss` | Inline 100-step synthetic curve, train + val |
| `demoSamples` | Inline copy of `math-vector-demo.json` softmax (3 candidates) |
| `demoEmbeddings` | `viz/data/demoEmbeddings.ts`, ~30 hand-clustered words |

The route is added to `routes.tsx`. The sidebar gains a "Viz" entry
(icon: `Sparkles` from lucide), positioned last in `ENTRIES` after
"Failures" so it reads as library/dev rather than lesson content.

## Tests

| File | What it tests |
|------|---------------|
| `viz/__tests__/primitives/VizFrame.test.tsx` | Renders `<title>` and `<desc>` from props; `role="img"`; respects `aspect`. |
| `viz/__tests__/primitives/Axes.test.tsx` | Correct tick count; tick labels match scale domain. |
| `viz/__tests__/primitives/scales.test.ts` | `linearScale`, `bandScale`, `sequentialScale` return d3 scales with expected domain/range. |
| `viz/__tests__/primitives/colors.test.ts` | `magnitudeRamp(0/1)` returns expected token colors; `maskedColor()` deterministic; `categoricalColor(i)` cycles. |
| `viz/__tests__/TokenFlow.test.tsx` | One column per token per stage; empty state when `tokens` empty; hover row → tooltip for correct token. |
| `viz/__tests__/AttentionMap.test.tsx` | Square grid matching tokens; masked cells have `aria-label` containing "masked"; row sums show value 1 when enabled. |
| `viz/__tests__/LossCurve.test.tsx` | One `<path>` per series; respects `yMax`; rolling mean overlay appears when `showRollingMean=true`. |
| `viz/__tests__/SamplingPlot.test.tsx` | One bar per candidate (capped at `topK`); selected token marked with `data-selected="true"`; bars sorted descending. |
| `viz/__tests__/EmbeddingSpace.test.tsx` | One circle per point; cluster coloring only when at least one point has `cluster`; selected point has accent ring. |
| `screens/__tests__/VizShowcase.test.tsx` | All 5 section headings + one element per viz. |
| `__tests__/SideNav.test.tsx` (modify) | "Viz" added to expected nav labels. |

About 24 new test cases. Existing 54 web tests must not regress.

## Migration Plan

Five ordered steps. Each is independently verifiable.

### Step 1: Primitives

Build `VizFrame`, `Axes`, `Tooltip`, `Legend`, `useResizeObserver`,
`scales.ts`, `colors.ts`. TDD on `VizFrame`, `Axes`, `scales`, `colors`.

Add a `ResizeObserver` polyfill to `vitest.setup.ts` if jsdom doesn't
ship it.

Verify: build clean; web suite passes; 4 new primitive tests green;
existing 54 tests still pass.

### Step 2: AttentionMap

First public viz, highest pedagogical payoff. Exercises all primitives
end-to-end. TDD.

Verify: AttentionMap test passes; web suite green; build clean.

### Step 3: TokenFlow + SamplingPlot + LossCurve

Three viz with similar shape. TDD per component. Commit each.

Verify: each new test passes; web suite green; build clean.

### Step 4: EmbeddingSpace + demo data

Component plus `viz/data/demoEmbeddings.ts`. TDD.

Verify: EmbeddingSpace test passes; web suite green; build clean.

### Step 5: Showcase route + sidebar entry

Add `apps/web/src/screens/VizShowcase.tsx` and its test. Add the `/viz`
route to `routes.tsx`. Add the "Viz" entry to `SideNav.tsx`'s `ENTRIES`
(last position). Update `SideNav.test.tsx`'s static-label assertion.

Verify: showcase test passes; SideNav test passes with the new label;
web suite green; build clean; manual dev-server check: `/viz` returns
HTTP 200 inside the shell, `/__foundation` still bypasses the shell.

## Verification

The sub-project is done when all of these are green.

- `npm run labs:test` — 40 passed (unchanged from baseline).
- `npm run api:test` — 25 passed (unchanged from baseline).
- `npm --prefix apps/web test` — baseline 54 + ~24 new ≈ 78 passing;
  no regression.
- `npm --prefix apps/web run build` — clean.
- `npm run e2e` — 4 chromium flows pass; the viz library is not
  reachable from any e2e flow today.
- Manual: visit `/viz` in dev — all 5 sections render, each animates
  on first paint, header + sidebar visible.
- Manual: hover an attention cell, a token row, an embedding point —
  each tooltip works.
- Manual: visit `/__foundation` — still bypasses the shell (regression
  check).
- Manual: enable `prefers-reduced-motion: reduce` in browser devtools
  and reload `/viz` — viz still renders, animations skip, no broken
  layout.

## Out of Scope

Deferred to later sub-projects or follow-ups.

- Wiring viz into ConceptWorkspace, ChatPlayground, Dashboard, Failure
  Museum. Those happen in sub-projects 4, 6, 4, and 7.
- Real embedding data. `demoEmbeddings.ts` is hand-curated; a future lab
  can produce real artifacts in the same shape.
- Canvas path for `LossCurve`. Hook documented, not implemented.
- Interactive temperature scrub on `SamplingPlot`. The prop is a display
  label only.
- Brush / zoom interactions on any axis.
- 3D embeddings.

## Risks and Mitigations

- **`useResizeObserver` in jsdom.** vitest's jsdom doesn't ship
  `ResizeObserver`. Add a polyfill to `vitest.setup.ts` alongside the
  existing `matchMedia` and `localStorage` polyfills if Step 1 hits this.
- **d3 bundle size.** Import from explicit sub-packages
  (`d3-scale`, `d3-shape`) — not from `d3` directly — so tree-shaking
  works. Measure bundle delta in Step 1's build; expect <10 KB gzipped.
- **Demo data drift.** Inline showcase data (especially the attention
  matrix) is copied from a real lab artifact today. If the lab's output
  shape changes, the showcase data won't auto-update. Acceptable; the
  showcase is a style guide, not a regression test.
- **`/viz` discoverability.** Reachable from the sidebar but
  positioned last so it reads as library/dev rather than lesson content.
