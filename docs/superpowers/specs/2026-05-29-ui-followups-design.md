# UI Follow-Ups — Design Spec

**Goal:** Land four documented follow-ups from the seven-part UI overhaul as a single batch.

**Sub-projects covered:** Concept Map HoverPreview wiring (F1), Concept Map edge highlighting (F2), Dashboard skeletons (F3), Artifacts → viz real data (F4). Each is self-contained polish over already-shipped code; no new routes, no new screens.

**Scope check:** Four independent units, all small, all touching different files. One spec, one plan.

---

## F1. Concept Map HoverPreview wiring

**Where:** `apps/web/src/screens/ConceptMap.tsx` + `apps/web/src/screens/concept-map/HoverPreview.tsx` (already built).

**Current state:** `HoverPreview` is fully built and unit-tested. `ConceptMap.tsx` carries a "hidden HoverCard reference" placeholder that keeps the imports exercised but doesn't render anything on hover.

**Design:**

- Replace the placeholder block with real hover plumbing using shadcn `<HoverCard>` + `<HoverCardTrigger>` + `<HoverCardContent>` per node.
- The simplest path: lift hover state into `ConceptMap` via React Flow's `onNodeMouseEnter` / `onNodeMouseLeave`, then render a *single* floating `<HoverCardContent>` positioned by the node ref.
- Trade-off: shadcn HoverCard expects a trigger element. We'd need a trigger per node, which means moving the HoverCard mount inside `ConceptNode`. That's the cleaner approach — keep hover state local to the node.
- **Chosen path:** mount HoverCard inside `ConceptNode`. Each node wraps its body in `<HoverCardTrigger>`; `<HoverCardContent>` renders `<HoverPreview>` with the concept/track/status data already on `data`.
- `ConceptNode` gains additional `data` fields it needs for the preview: `track`, `prereqIndex`, `progressByConcept`. These come from `buildGraph` — extend `ConceptNodeData` to carry them.
- The placeholder `<span hidden>` block in `ConceptMap.tsx` is removed; that import comment + hidden HoverCard go away.

**Tests:**

- Extend `apps/web/src/screens/concept-map/__tests__/ConceptNode.test.tsx` (or its existing counterpart) to assert the trigger has `aria-haspopup="dialog"` or the equivalent shadcn role and that the preview content (title) is reachable in the DOM tree (HoverCard uses Radix — content renders to a portal). Since jsdom doesn't simulate real hover, use a controlled open via the `open` prop on `<HoverCard>` for the test, or mock `HoverCard` to render content immediately.
- Add a single integration test in `apps/web/src/screens/concept-map/__tests__/ConceptMap.test.tsx` that asserts the placeholder span is gone (no more "hidden HoverCard" workaround).

## F2. Concept Map edge highlighting

**Where:** `apps/web/src/screens/ConceptMap.tsx` + a new helper `apps/web/src/screens/concept-map/highlight.ts`.

**Current state:** All edges render with the same default React Flow style. Hovering a node does not change edge appearance.

**Design:**

- A pure function `neighbourhood(nodeId, edges)` returns `{ nodeIds: Set<string>, edgeIds: Set<string> }` — the hovered node + every node directly connected by an edge, and every edge touching it.
- In `ConceptMap`, lift a `hoveredNodeId` piece of state. Set it on React Flow's `onNodeMouseEnter` / `onNodeMouseLeave`.
- When `hoveredNodeId !== null`, compute the neighbourhood once, and:
  - For each `RFEdge`, set `style={{ stroke: 'var(--accent)', strokeWidth: 2 }}` if the edge is in the neighbourhood; otherwise `style={{ opacity: 0.18 }}`.
  - For each `RFNode`, set `data.dim = true` (extend `ConceptNodeData`) if the node is NOT in the neighbourhood; nodes use this to render at reduced opacity. The hovered node itself shows an accent ring.
- When `hoveredNodeId === null`, all edges/nodes use their default style.

**Trade-off considered:** computing neighbourhood per render is fine because the edge list is small (<200 edges total at current scale). No memoisation gymnastics needed beyond a single `useMemo` keyed on `[hoveredNodeId, allEdges]`.

**Tests:**

- `apps/web/src/screens/concept-map/__tests__/highlight.test.ts` covers the pure `neighbourhood()` function: returns the hovered node only when it has no edges, includes both source and target neighbours, handles unknown ids.
- Integration test extension in `ConceptMap.test.tsx` is not added — React Flow's mouse handlers don't fire reliably in jsdom and the visual outcome isn't asserting anything new. Pure-function coverage suffices.

## F3. Dashboard skeletons

**Where:** `apps/web/src/screens/Dashboard.tsx`.

**Current state:** Renders `<p className="text-text-muted">Loading…</p>` while `useCourseData().loading` is true.

**Design:**

- Replace the loading branch with `<DashboardSkeleton />`: a layout-matching skeleton tree showing:
  - Header block (eyebrow + h1 + 1 line of body): three `<Skeleton>` lines.
  - ContinueCard placeholder: a `<Card>` with `<Skeleton className="h-32" />` inside.
  - TrackProgressGrid placeholder: a grid of 4 `<Skeleton className="h-24" />` cards (matching the typical grid).
  - The bottom row (MissedTopics + RecentArtifacts) as two side-by-side `<Skeleton className="h-32" />`.
- Skeleton component lives at `apps/web/src/screens/dashboard/DashboardSkeleton.tsx` so the loading layout and the real layout can evolve together when needed.

**Tests:**

- `apps/web/src/screens/dashboard/__tests__/Dashboard.test.tsx` (create if missing): one new case mocking `useCourseData` with `loading: true` asserts no "Loading…" text and at least one `<Skeleton>` (via `[data-skeleton]` attribute since shadcn `Skeleton` doesn't expose role) appears.

## F4. Artifacts → viz real data

**Where:** `apps/web/src/screens/concept/useExperimentData.ts`.

**Current state:** Always returns synthetic demo data per viz key. Receives `recentArtifacts` but ignores it (a documented future-todo).

**Real artifact shapes** (verified in `labs/python/llm_from_scratch/experiments/`):

- Transformer demo → `artifact.attention = { tokens: string[], weights: number[][], scores, context }` and `artifact.tokens: string[]`.
- Mini training demo → `artifact.training = { lossHistory: number[], targetToken, finalLogits, finalProbabilities }`, `artifact.generation = { generatedText, decisionTrace, settings, prompt }`.

**Design:**

- A pure helper `tryDeriveRealProps(key, concept, recentArtifacts)` looks up `recentArtifacts.find(a => a.conceptId === concept.id)?.artifact` (or, if none for this concept, any artifact whose shape matches the viz). If a derivation path matches, return the real props. Otherwise return `null` and the caller falls back to the existing synthetic block.
- Derivations by viz key:
  - **attention-map** — if `artifact.attention.weights` is `number[][]`, return `{ data: { tokens: artifact.attention.tokens, scores: artifact.attention.weights } }`.
  - **loss-curve** — if `artifact.training.lossHistory` is `number[]`, return `{ series: [{ label: "train", values: lossHistory }], showRollingMean: true }`.
  - **sampling-plot** — if `artifact.training.finalProbabilities` is `Record<string, number>`, convert to `[{ token, probability }]` (top 6 by probability), pick the argmax as `selectedToken`, hardcoded `temperature: 1.0`.
  - **token-flow** — if `artifact.tokens` is `string[]`, build `tokens: [{ id, text }]` from them.
  - **embedding-space** and **chat-playground** — no real-data path; keep synthetic / empty.
- The helper lives at `apps/web/src/screens/concept/realProps.ts` so `useExperimentData.ts` stays small.

**Tests:**

- `apps/web/src/screens/concept/__tests__/realProps.test.ts` — table-driven across the four shapes (attention/loss/sampling/token-flow). Asserts:
  - Returns real props when the shape matches.
  - Returns `null` for `embedding-space` and `chat-playground` (synthetic-only).
  - Returns `null` when `recentArtifacts` is empty or none match the concept.
- `apps/web/src/screens/concept/__tests__/useExperimentData.test.tsx` (extend if exists, create otherwise): one case asserting a concept with a matching artifact yields the real props; one asserting a concept *without* a matching artifact yields the synthetic fallback (the existing behaviour).

---

## Out of scope

- No real data for EmbeddingSpace (no lab produces embeddings yet).
- No real data for LossCurve overlays beyond the training series (no validation/loss-split labs).
- No HoverPreview interactions beyond hover (no click, no pin).
- No edge animation; only color/opacity swap.

## Definition of done

- F1–F4 implemented with passing tests.
- `apps/web` build clean, typecheck zero errors, vitest green.
- E2E unaffected (no flow changes touch it).
- Branch `ui-followups` merged into `main` and pushed to `origin/main`.
- Handoff doc updated to mark these four follow-ups as DONE and trimmed from the open follow-ups list.
