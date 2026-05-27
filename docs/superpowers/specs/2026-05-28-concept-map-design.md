# Concept Map

Date: 2026-05-28

Sub-project 5 of the 7-part UI overhaul. Builds on the Design Foundation,
the App Shell + Dashboard, the Viz Library, and the Concept Workspace.
Polishes the `/concepts` screen — replaces the un-styled flat-grid
ConceptMap with a real graph view using `@xyflow/react`.

## Goal

Render the curriculum as a track-grouped node-edge graph. Each concept
is a node; prerequisite relationships are edges. Status (open / learning
/ complete / missed) is encoded visually, and the screen honours the
`?filter=missed` query parameter set by the Dashboard's missed-topics
panel. Clicking a node navigates to `/concepts/:id`.

## Principles

1. Structure IS the lesson. Tracks read left-to-right; concepts within
   a track read top-to-bottom; prereq edges run within and between
   columns. No layout magic — deterministic positions from a pure function.
2. Status precedence is strict: `missed > complete > learning > open`. A
   missed concept always reads as missed regardless of other state.
3. The layout function is library-agnostic. Pure data in → React Flow-
   shaped data out. Easy to unit-test, easy to swap if React Flow is
   ever replaced.
4. No new dependencies. `@xyflow/react` is already installed; the layout
   is hand-rolled (no dagre).
5. The graph is structural, not user-editable. Pan and zoom are allowed;
   node dragging and edge editing are off.

## Layout

```text
Data and Tokens │ Math for Models │ Learning │ Transformer │ Chat Product
────────────────┼─────────────────┼──────────┼─────────────┼─────────────
bytes-unicode   │ vectors         │ scalar-… │ attention-… │ message-fm…
character-tok…  │ dot-products    │ tiny-lin…│ masked-self…│ tokenizati…
byte-pair-enc…  │ logits-softmax  │          │ positional… │ context-wi…
                │                 │          │ transformer…│ sampling-s…
                │                 │          │ dataset-pa… │ base-vs-as…
                │                 │          │ next-token… │ scratch-wo…
                │                 │          │ sampling-g… │ tool-verif…
                │                 │          │ base-vs-as… │ chat-memory
                │                 │          │ factuality… │ failure-mu…
                │                                          │ preference…

prereq edges:
  within-column:   straight vertical down
  cross-column:    smoothstep curves
  hovered node:    accent-color outline + edges to neighbours highlighted
```

Track columns are ordered by `track.order`. Concepts inside each
column are ordered by `concept.order`. Cross-track edges (e.g.
`logits-softmax → attention-scores`) curve naturally between columns.

## Files

| Path | Responsibility |
|------|----------------|
| `apps/web/src/screens/ConceptMap.tsx` | New top-level screen. Replaces `ConceptMapRoute` in `RouteWrappers.tsx`. |
| `apps/web/src/screens/concept-map/layout.ts` | Pure function `buildGraph(tracks, progressByConcept, missedConceptIds) → { nodes, edges }`. |
| `apps/web/src/screens/concept-map/ConceptNode.tsx` | Custom React Flow node renderer (status dot, title, track label, status badge). |
| `apps/web/src/screens/concept-map/MapControls.tsx` | Segmented filter (All / Missed / Completed / Open) + mini-map toggle. |
| `apps/web/src/screens/concept-map/HoverPreview.tsx` | Floating popover for a hovered node (summary + status + prereqs + Open → link). |
| `apps/web/src/screens/concept-map/__tests__/layout.test.ts` | Pure-function tests for `buildGraph`. |
| `apps/web/src/screens/concept-map/__tests__/ConceptNode.test.tsx` | Renders title, track, status badge; missed state visible. |
| `apps/web/src/screens/concept-map/__tests__/MapControls.test.tsx` | Filter clicks update URL; mini-map toggle persists. |
| `apps/web/src/screens/concept-map/__tests__/HoverPreview.test.tsx` | Renders summary, prereq count, "Open →" link. |
| `apps/web/src/screens/__tests__/ConceptMap.test.tsx` | Integration: graph renders, filter narrows nodes, click navigates. |
| `apps/web/src/routes.tsx` (modify) | Point `/concepts` at the new screen. |
| `apps/web/src/screens/RouteWrappers.tsx` (modify) | Remove `ConceptMapRoute`. |
| `apps/web/src/components/ConceptMap.tsx` (delete) | Legacy flat-grid, fully subsumed. |
| `apps/web/src/__tests__/ConceptMap.test.tsx` (delete) | Legacy test. |

## Layout Function

Pure; no DOM, no React Flow types — operates on plain data so unit tests
need no rendering harness.

```ts
// apps/web/src/screens/concept-map/layout.ts
import type { Concept, ProgressRecord, Track } from "../../types";

export type ConceptStatus = "complete" | "missed" | "learning" | "open";

export interface ConceptNodeData {
  concept: Concept;
  track: Track;
  status: ConceptStatus;
}

export interface PlainNode {
  id: string;
  position: { x: number; y: number };
  data: ConceptNodeData;
  type: "concept";
}

export interface PlainEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
}

export const COLUMN_WIDTH = 260;
export const ROW_HEIGHT = 110;
export const COLUMN_X_OFFSET = 40;
export const ROW_Y_OFFSET = 40;

export function statusFor(
  conceptId: string,
  progressByConcept: Record<string, ProgressRecord | undefined>,
  missedConceptIds: Set<string>
): ConceptStatus {
  if (missedConceptIds.has(conceptId)) return "missed";
  const record = progressByConcept[conceptId];
  if (record?.status === "complete") return "complete";
  if (record?.status === "learning") return "learning";
  return "open";
}

export function buildGraph(
  tracks: Track[],
  progressByConcept: Record<string, ProgressRecord | undefined>,
  missedConceptIds: Set<string>
): { nodes: PlainNode[]; edges: PlainEdge[] } {
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  const nodes: PlainNode[] = [];
  for (let i = 0; i < sortedTracks.length; i++) {
    const track = sortedTracks[i];
    const sortedConcepts = [...track.concepts].sort((a, b) => a.order - b.order);
    for (let j = 0; j < sortedConcepts.length; j++) {
      const concept = sortedConcepts[j];
      nodes.push({
        id: concept.id,
        position: {
          x: COLUMN_X_OFFSET + i * COLUMN_WIDTH,
          y: ROW_Y_OFFSET + j * ROW_HEIGHT
        },
        data: {
          concept,
          track,
          status: statusFor(concept.id, progressByConcept, missedConceptIds)
        },
        type: "concept"
      });
    }
  }

  const edges: PlainEdge[] = [];
  for (const track of sortedTracks) {
    for (const concept of track.concepts) {
      for (const prereqId of concept.prerequisites ?? []) {
        edges.push({
          id: `${prereqId}->${concept.id}`,
          source: prereqId,
          target: concept.id,
          type: "smoothstep"
        });
      }
    }
  }

  return { nodes, edges };
}
```

## Custom Node — `<ConceptNode>`

Renders inside React Flow's `nodeTypes={{ concept: ConceptNode }}`.

```text
┌─────────────────────────────────────┐
│ ●  Character Tokenization           │   status dot + title (font-medium)
│    Data and Tokens                  │   track label (text-muted, 12px)
│                            [open]   │   Badge variant by status
└─────────────────────────────────────┘
```

Specs:

- Width: 220px (a touch narrower than the column so edges don't collide
  with neighbors). Height: 80px.
- Border 1px `--border-subtle`; on hover 2px with the status color;
  selected adds an outer 2px `--accent` ring.
- Missed: 1px dashed `--danger` outline + small "!" marker top-right.
- Status dot color from a small `statusColor()` helper that resolves to
  CSS vars `--success / --danger / --accent / --text-faint`.
- Click → `useNavigate()` to `/concepts/<id>`.
- Keyboard: wraps content in a `<button>` so Tab and Enter work.
- ARIA: the `<button>` carries `aria-label="<title> — <track> — <status>"`.

## MapControls

A small toolbar above the graph.

```text
[ All ] [ Missed ] [ Completed ] [ Open ]      [ Mini-map: ◯ ]
```

- Segmented filter implemented with shadcn `<Tabs>` (purely visual —
  selection drives the `?filter=` URL param via `useSearchParams`).
- Mini-map toggle is a `<Switch>`; state persists in `localStorage`
  under `learn-llm.conceptmap.minimap` (default: true).
- Filter values: `all | missed | completed | open` (lower-case to match
  status keys; `all` is the default and is represented by no `?filter=`
  param in the URL).
- Changing the filter:
  - `missed` → only nodes with status `missed` and their prerequisite
    chain visible (so the learner can see what blocks them).
  - `completed` → only `complete` nodes.
  - `open` → only `open` and `learning` nodes (not yet done).
  - `all` → everything.

Hidden nodes/edges are filtered from the graph's input, not toggled via
opacity, so the layout reflows cleanly via React Flow's `fitView` on the
filtered subset.

## HoverPreview

Small popover (token-styled card) anchored to the hovered node.

```text
┌────────────────────────────────────────────┐
│ Character Tokenization      [open]         │
│ Track: Data and Tokens                     │
│                                            │
│ Encode raw text into character tokens to … │
│                                            │
│ Prereqs: ✓ Bytes and Unicode               │
│                                            │
│ [Open concept →]                           │
└────────────────────────────────────────────┘
```

- Uses the foundation's shadcn `<Tooltip>` or `<HoverCard>` primitive.
  We choose `<HoverCard>` because it allows links inside the popover
  (the "Open →" CTA) — `<Tooltip>` is for non-interactive content. The
  shadcn `<HoverCard>` primitive is added in this sub-project if not
  already present.
- Summary text comes from the first sentence of `concept.lessonMarkdown`
  (stripped of leading `#` headers and trimmed to ~120 chars).
- Prereq list reads `concept.prerequisites` and resolves each id to a
  title via a small lookup, with ✓ / ○ icons by status.
- The "Open →" link routes to `/concepts/<id>` and closes the popover
  via React Router's `useNavigate`.

## React Flow Configuration

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={{ concept: ConceptNode }}
  fitView
  panOnDrag
  zoomOnScroll
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable
  edgesFocusable={false}
  proOptions={{ hideAttribution: true }}
>
  <Background gap={20} color="var(--border-subtle)" />
  {showMiniMap ? <MiniMap pannable zoomable nodeColor={nodeMiniMapColor} /> : null}
  <Controls position="bottom-right" showInteractive={false} />
</ReactFlow>
```

`nodeMiniMapColor` returns a token-aware color per status (so the
mini-map mirrors the graph's color encoding).

`Background` uses `--border-subtle` dots for a quiet grid that doesn't
compete with nodes.

## State Model

- `ConceptMap` reads `tracks`, `progressRecords`, `missedTopics`, `loading`
  from `useCourseData()`.
- `useSearchParams` from `react-router-dom` exposes the active filter
  via `?filter=`.
- `useMemo` recomputes the filtered `{ nodes, edges }` whenever any of
  `tracks`, `progressByConcept`, `missedConceptIds`, or `filter` change.
- Mini-map visibility is local component state seeded from
  `localStorage`.
- Selected node — none persistent; clicking immediately navigates away.

## Loading / Empty / Error States

- `loading === true` → render a Skeleton block where the graph would be.
- `loading === false && tracks.length === 0` → "No concepts yet."
- `error !== null` is handled at the shell level (sub-project 2's
  global error banner).
- Filter results in empty graph (e.g. `?filter=missed` with no missed
  topics) → render an inline empty state inside the graph area: "No
  concepts match this filter."

## Tests

| File | What it tests |
|------|---------------|
| `screens/concept-map/__tests__/layout.test.ts` | `buildGraph` positions nodes track-column / concept-row correctly; `statusFor` follows the `missed > complete > learning > open` precedence; edges generated from prereqs with stable ids. |
| `screens/concept-map/__tests__/ConceptNode.test.tsx` | Renders title, track, status badge; missed flag visible; click invokes `onClick` (mock React Flow context); aria-label assembled correctly. |
| `screens/concept-map/__tests__/MapControls.test.tsx` | Clicking a filter button updates `?filter=` (except `all`, which removes it); mini-map switch persists to localStorage. |
| `screens/concept-map/__tests__/HoverPreview.test.tsx` | Renders summary, status badge, prereq list with ✓/○, "Open →" link points at `/concepts/:id`. |
| `screens/__tests__/ConceptMap.test.tsx` | Integration: graph renders one node per concept; `?filter=missed` shows only missed nodes; clicking a node navigates to `/concepts/:id`; empty filter result renders the empty-state message. |

About 16 new web tests. Existing 126 web tests must not regress, minus
the deleted legacy ConceptMap tests.

## Migration Plan

Four ordered tasks. Each independently verifiable.

### Step 1: Layout function (TDD)

Build `layout.ts` and its tests. Pure function; no React Flow imports.
Verify: layout tests pass.

### Step 2: ConceptNode + MapControls + HoverPreview (TDD)

Three small components. TDD each.

If `<HoverCard>` is not already in `apps/web/src/components/ui/`, run
`npx shadcn@latest add hover-card --yes` in `apps/web/`. Verify
build + tests pass.

### Step 3: ConceptMap screen + route swap + e2e check

Build `screens/ConceptMap.tsx` composing layout + React Flow + controls
+ hover preview. TDD the integration test. Update `routes.tsx` to point
`/concepts` at the new screen. Remove `ConceptMapRoute` from
`RouteWrappers.tsx`. Run e2e — flows that navigate via `/concepts` (if
any) need verification; the existing flows enter `/concepts/:id` directly
via the new Dashboard, so this screen is mostly free of e2e coupling.

### Step 4: Cleanup

Delete `apps/web/src/components/ConceptMap.tsx` and
`apps/web/src/__tests__/ConceptMap.test.tsx` (legacy flat-grid + its
test). Audit for stale imports.

## Verification

The sub-project is done when all of these are green:

- `npm run labs:test` — 40 passed (unchanged).
- `npm run api:test` — 28 passed (unchanged).
- `npm --prefix apps/web test` — baseline 126 + ~16 new − a handful from
  deleted legacy tests ≈ 138 passing.
- `npm --prefix apps/web run build` — clean.
- `npm run e2e` — 4 chromium flows still pass.
- Manual: visit `/concepts` — graph renders with track-grouped columns,
  edges follow prereqs; click a node lands on `/concepts/:id`.
- Manual: visit `/concepts?filter=missed` (the link Dashboard uses)
  with at least one missed concept — only missed nodes + their
  prereq chain visible.
- Manual: hover a node → preview popover with summary + "Open →" CTA.
- Manual: toggle the mini-map → state persists across reloads.
- Manual: `/__foundation` still bypasses the shell.

## Out of Scope

Deferred to later sub-projects or follow-ups.

- Search (free text). Filter only via the segmented control.
- Edge animation choreography (the "shortest path through prereqs"
  animation). Pure styling polish for a later iteration.
- Drag-to-rearrange or save-custom-layout. The layout is structural.
- Per-track color theming for nodes. Status drives color today; track
  identity comes through the column position.
- Cross-track edge bundling. With 5 tracks the visual is acceptable;
  bundling can be added if the graph grows.

## Risks and Mitigations

- **React Flow + jsdom interactions in tests.** React Flow's full
  rendering depends on `ResizeObserver` (already polyfilled in
  `vitest.setup.ts` for the viz library) plus some DOM features. The
  integration test mocks `ResizeObserver` if needed and uses
  `ReactFlowProvider` so the hook context resolves.
- **Custom node click handler.** React Flow's default node-click event
  fires on `onNodeClick(event, node)` at the `<ReactFlow>` level, not on
  the rendered node's `onClick`. We use the `<ReactFlow>` callback to
  drive navigation; the inner `<button>` is for keyboard focus and
  carries `e.stopPropagation()` on click so it doesn't double-fire.
- **e2e selector drift.** Phase 1, 2, 3 e2e flows don't currently
  navigate via `/concepts` (the new Dashboard goes directly to
  `/concepts/:id` via the Continue card or tracks). No selector changes
  are expected; verified in Step 3.
- **Mini-map performance.** With ~27 nodes the mini-map is cheap.
  If the curriculum grows past ~200 nodes the mini-map should be
  lazy-mounted on toggle; not a concern today.
- **`/concepts?filter=missed` deep-link.** The Dashboard's
  MissedTopicsPanel "View all →" link points here. Verified manually
  with a missed topic seeded via the Checkpoint tab.
