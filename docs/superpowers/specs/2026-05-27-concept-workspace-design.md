# Concept Workspace

Date: 2026-05-27

Sub-project 4 of the 7-part UI overhaul. Builds on the Design Foundation
(sub-project 1), the App Shell + Dashboard (sub-project 2), and the
Educational Viz Library (sub-project 3). Ships the polished
`/concepts/:id` screen — the daily-use surface where learners actually
read, run labs, run experiments, take checkpoints, and write notes.

## Goal

Replace the un-styled `ConceptRoute` wrapper at `/concepts/:id` with a
real Concept Workspace screen built on the foundation primitives,
arranged as a single content area with five tabs (Explanation, Lab,
Experiment, Checkpoint, Notes) and a polished concept header. The
Experiment tab consumes the viz library, with `ChatPlayground` treated
as the experiment for chat concepts — no more special-case chrome.

This sub-project also lands one small API touch-up
(`GET /api/checkpoints/:id/attempts`) and migrates every concept JSON to
use the new viz registry keys. Lesson markdown does not need a new
endpoint — `content_loader.py` already inlines `lessonMarkdown` into
each concept during `GET /api/tracks`, so `ExplanationTab` reads it
directly from `useCourseData()`.

## Principles

These extend the Design Foundation principles into the lesson surface.

1. **Focused one-thing-at-a-time UI.** Pure tabs, single content area;
   no split-pane competing for attention.
2. **Chrome is calm; lesson content speaks.** Header, breadcrumb, prev/
   next, and status badges live above the tabs and stay quiet.
3. **The Experiment tab is the uniform interactive slot.** For every
   concept that has one, the experiment is a single viz component
   (`TokenFlow`, `AttentionMap`, `LossCurve`, `SamplingPlot`,
   `EmbeddingSpace`) or `ChatPlayground` for chat concepts. Resolved
   through one registry; no per-concept conditionals at the call site.
4. **State lives at the smallest possible scope.** Concept lookup +
   active tab live in the screen; lesson markdown, notes draft, and
   checkpoint history live inside their tabs.
5. **Deep-link to a tab.** Active tab is URL-synced via `?tab=` so
   refresh and back/forward navigation preserve the lesson interaction.

## Layout

```text
┌──────────────────────────────────────────────────────────────────┐
│ ← Tracks · Data and Tokens · Concept 2 of 9                      │
│                                                                  │
│  Character Tokenization                                          │
│                                                                  │
│  [open]  [confidence 60%]  [in missed queue]                     │
│                                                                  │
│  Prerequisites:  ✓ Bytes and Unicode                             │
│                                                                  │
│                                          [← Bytes & Unicode]     │
│                                          [Byte Pair Encoding →]  │
└──────────────────────────────────────────────────────────────────┘

[ Explanation ] [ Lab ] [ Experiment ] [ Checkpoint ] [ Notes ]

<single content area for the active tab>
```

### Concept header

- Breadcrumb: `← Tracks` link → `/tracks`, then `Track Title`, then
  `Concept N of M`.
- H1 title (28px, semibold).
- Status row: status `Badge` ("open" / "complete" / "confusing") +
  confidence pill (when a progress record exists) + "in missed queue"
  Badge (when listed in `useCourseData().missedTopics`).
- Prerequisites: inline list with ✓ for complete, ○ for incomplete,
  each linking to its concept. Hidden when the concept has no prereqs.
- Prev / Next: two `<Button variant="ghost">` links derived from the
  track's concept ordering; hidden at the ends.

### Tab shell

`<Tabs>` from shadcn primitives. Five `<TabsTrigger>`s:

```text
[ Explanation ] [ Lab ] [ Experiment ] [ Checkpoint ] [ Notes ]
```

Default active tab: `Explanation`. The active tab is URL-synced via
`?tab=lab|explanation|experiment|checkpoint|notes` using
`useSearchParams` from `react-router-dom`.

Conditional tab presence:

- **Lab**: shown only when `concept.lab` is non-null.
- **Experiment**: shown only when `concept.visual` is non-null.
- **Explanation, Checkpoint, Notes**: always shown.

When `?tab=experiment` points at a concept without one, the screen
falls back to `Explanation` and emits a `console.warn`. Test asserts
this fallback.

### Loading and error states

- `useCourseData().loading === true` → header skeleton + empty tab list.
- `concept === undefined` after loading → "Concept not found" with a
  "← Back to Concept Map" link.
- `useCourseData().error` is handled at the shell level (already shows
  the global error banner from sub-project 2). This screen does nothing
  extra.

## Files

| Path | Responsibility |
|------|----------------|
| `apps/web/src/screens/ConceptWorkspace.tsx` | New top-level screen, replaces `RouteWrappers.tsx`'s `ConceptRoute`. |
| `apps/web/src/screens/concept/ConceptHeader.tsx` | Breadcrumb, title, status badges, prereqs, prev/next. |
| `apps/web/src/screens/concept/ExplanationTab.tsx` | Markdown lesson body via `react-markdown` + `<CodeBlock>`. |
| `apps/web/src/screens/concept/LabTab.tsx` | Run-lab UI, latest artifact preview, link to /artifacts. |
| `apps/web/src/screens/concept/ExperimentTab.tsx` | Resolves `concept.visual` via `vizRegistry`. |
| `apps/web/src/screens/concept/CheckpointTab.tsx` | Question, textarea, confidence slider, feedback, attempt history. |
| `apps/web/src/screens/concept/NotesTab.tsx` | Debounced notes editor + confidence + revisit toggle + mark complete. |
| `apps/web/src/screens/concept/vizRegistry.ts` | Maps `ConceptVizKey` to viz component + hint. |
| `apps/web/src/screens/concept/useExperimentData.ts` | Per-key data resolver — reads `useCourseData()` / `recentArtifacts`, returns the viz's props. |
| `apps/web/src/screens/concept/useDebouncedCallback.ts` | Tiny debounce helper for the Notes tab. |
| `apps/web/src/screens/concept/__tests__/*` | Per-tab + header tests + registry test. |
| `apps/web/src/screens/__tests__/ConceptWorkspace.test.tsx` | Integration test: header + tabs + URL-synced tab switching. |
| `apps/web/src/routes.tsx` (modify) | `/concepts/:id` points at the new screen. |
| `apps/web/src/screens/RouteWrappers.tsx` (modify) | Remove `ConceptRoute` export. |
| `apps/web/src/api.ts` (modify) | Add `fetchCheckpointAttempts`. |
| `apps/api/learn_llm_api/progress_store.py` (modify) | Add `list_checkpoint_attempts`. |
| `apps/api/learn_llm_api/app.py` (modify) | Add new `GET /api/checkpoints/:id/attempts` route. |
| `apps/api/tests/test_progress_store.py` (modify) | New test for `list_checkpoint_attempts`. |
| `apps/api/tests/test_app.py` (modify) | New test for the GET route. |
| `content/concepts/*.json` (modify) | Every concept's `visual` field migrated to a `ConceptVizKey` value. |

### Files removed (orphan audit, step 5)

Audited via `grep` before deletion. A panel that's still imported elsewhere stays for now.

| Path | Notes |
|------|-------|
| `apps/web/src/components/ConceptWorkspace.tsx` | Old 86-line screen, fully subsumed. |
| `apps/web/src/components/VisualExperiment.tsx` | Subsumed by `ExperimentTab` + registry. |
| `apps/web/src/components/LabPanel.tsx` | Subsumed by `LabTab`. |
| `apps/web/src/components/CheckpointPanel.tsx` | Subsumed by `CheckpointTab`. |
| `apps/web/src/components/ProgressPanel.tsx` | Subsumed by `NotesTab`. |
| `apps/web/src/components/GlossaryPanel.tsx` | **Kept.** Still used by `/glossary` route's wrapper; removed in sub-project 7. |

## Viz Registry

```ts
// apps/web/src/screens/concept/vizRegistry.ts
import type { ComponentType } from "react";
import { AttentionMap, EmbeddingSpace, LossCurve, SamplingPlot, TokenFlow } from "@/viz";
import { ChatPlayground } from "@/components/ChatPlayground";

export type ConceptVizKey =
  | "token-flow"
  | "attention-map"
  | "loss-curve"
  | "sampling-plot"
  | "embedding-space"
  | "chat-playground";

interface RegistryEntry {
  Component: ComponentType<any>;
  hint: string;
}

const registry: Record<ConceptVizKey, RegistryEntry> = {
  "token-flow":      { Component: TokenFlow,      hint: "Tokens through stages: text, tokens, ids." },
  "attention-map":   { Component: AttentionMap,   hint: "Attention scores between query and key tokens." },
  "loss-curve":      { Component: LossCurve,      hint: "Training loss over steps. Lower is better." },
  "sampling-plot":   { Component: SamplingPlot,   hint: "Probabilities over candidate next tokens." },
  "embedding-space": { Component: EmbeddingSpace, hint: "Two-dimensional projection of embedding vectors." },
  "chat-playground": { Component: ChatPlayground, hint: "Send a message and inspect every step in the chat trace." }
};

/** Aliases kept during the concept-JSON migration window. Removed in Task 5. */
const aliases: Record<string, ConceptVizKey> = {
  "token-flow-svg": "token-flow"
};

export function resolveViz(key: string | null | undefined): RegistryEntry | null {
  if (!key) return null;
  const canonical = (aliases[key] ?? key) as ConceptVizKey;
  return (registry as Record<string, RegistryEntry | undefined>)[canonical] ?? null;
}

export const registeredKeys = Object.keys(registry) as ConceptVizKey[];
```

### `useExperimentData(concept)`

Tiny per-concept data resolver. Reads `useCourseData()` and
`recentArtifacts`, returns the props the chosen viz expects:

- `token-flow` → derives `tokens: TokenItem[]` from the concept's most
  recent tokenizer artifact, or falls back to a deterministic demo
  derived from the concept's title.
- `attention-map` → pulls the latest attention artifact for this
  concept's track; falls back to a 3×3 demo if none.
- `loss-curve` → reads `lossHistory` from a training artifact (when
  present); falls back to a synthetic curve.
- `sampling-plot` → reads `softmax.probabilities` + token labels from
  a math-vector or sampling artifact; falls back to a 3-candidate demo.
- `embedding-space` → uses `demoEmbeddings` from the viz library
  (no lab produces embeddings today).
- `chat-playground` → returns `{}` (the component owns its own state).

This concentrates "what data goes into which viz for which concept"
into one place so the tabs stay declarative.

## Concept JSON Migration

Every concept JSON in `content/concepts/*.json` gets its `visual` field
updated to a `ConceptVizKey` value. Mapping plan, by track:

| Track | Concepts | New `visual` |
|-------|----------|--------------|
| Data and Tokens | bytes-unicode, character-tokenization, byte-pair-encoding | `"token-flow"` |
| Math for Models | vectors, dot-products, logits-softmax | `"sampling-plot"` (softmax distributions) |
| Early Neural Nets | scalar-gradient, tiny-linear-model | `"loss-curve"` for any with a `lossHistory` artifact; `null` otherwise (decided per-concept during implementation) |
| Mini LLM (Transformer) | attention-scores, masked-attention, transformer-blocks, training-loop, mini-training | `"attention-map"` for attention concepts; `"loss-curve"` for training concepts |
| Chat Product | all 10 chat concepts | `"chat-playground"` |

The implementation step reads each concept JSON, decides the mapping
per concept based on its track and lesson content, updates the `visual`
field, and commits the change alongside the registry. Concepts that
genuinely have no experiment get `"visual": null`.

The `"token-flow-svg"` alias in the registry keeps any half-migrated
state working until Task 5 retires it.

## API Touch-up

### `GET /api/checkpoints/{concept_id}/attempts`

`Concept.lessonMarkdown` is already hydrated by `content_loader.py`
during `GET /api/tracks`, so `ExplanationTab` reads `concept.lessonMarkdown`
directly from `useCourseData()`. No lesson endpoint needed.

Only one new endpoint is required, to expose checkpoint attempt history
for the Checkpoint tab.

| File | Change |
|------|--------|
| `apps/api/learn_llm_api/progress_store.py` | New `list_checkpoint_attempts(concept_id)` returning ordered attempts, most recent first. |
| `apps/api/learn_llm_api/app.py` | New `GET /api/checkpoints/{concept_id}/attempts`. |
| `apps/api/tests/test_progress_store.py` | New test: attempts round-trip in expected order. |
| `apps/api/tests/test_app.py` | New test: endpoint returns 200 + list for an existing concept. |
| `apps/web/src/api.ts` | New `fetchCheckpointAttempts(conceptId: string): Promise<CheckpointAttempt[]>`. |

About 30 LOC of backend changes plus one frontend helper.

## Tests

| File | What it tests |
|------|---------------|
| `screens/concept/__tests__/ConceptHeader.test.tsx` | Breadcrumb + title + status badges; prev/next links exist and point at the right concept ids; "in missed queue" badge shows when listed. |
| `screens/concept/__tests__/ExplanationTab.test.tsx` | Markdown renders directly from `concept.lessonMarkdown`; fenced code blocks route through `<CodeBlock>` with a copy button. Empty `lessonMarkdown` renders an empty state. |
| `screens/concept/__tests__/LabTab.test.tsx` | "Run lab" disables during run; refresh called on success; alert + retry on error. |
| `screens/concept/__tests__/ExperimentTab.test.tsx` | Each registry key renders its viz; null/unknown renders empty state. |
| `screens/concept/__tests__/CheckpointTab.test.tsx` | Submit calls `submitCheckpoint`; correct/incorrect feedback renders; history renders. |
| `screens/concept/__tests__/NotesTab.test.tsx` | Typing triggers debounced save; toggling revisit calls save; mark-complete sets status; "Saved" indicator appears. |
| `screens/concept/__tests__/vizRegistry.test.ts` | `resolveViz` returns entry for known keys, null for unknown / null; `"token-flow-svg"` alias resolves to TokenFlow. |
| `screens/__tests__/ConceptWorkspace.test.tsx` | Integration: header + 5 tabs render; clicking a tab updates `?tab=`; `?tab=experiment` selects Experiment; refresh-with-`?tab=` preserves selection. |
| `apps/api/tests/test_progress_store.py` | New `list_checkpoint_attempts` tests. |
| `apps/api/tests/test_app.py` | New test for the `GET /api/checkpoints/:id/attempts` endpoint. |

About 16 new web tests + 2 new api tests. Existing 95 web tests must
not regress, except the handful tied to deleted legacy panels which are
removed alongside the panels themselves.

## Migration Plan

Five ordered steps; each is independently verifiable.

### Step 1: API touch-up

Add `list_checkpoint_attempts` to `ProgressStore` and
`GET /api/checkpoints/:id/attempts` to `app.py`, plus
`fetchCheckpointAttempts` on the frontend. TDD on each. Verify: api
tests +2, web suite untouched, build clean.

### Step 2: Viz registry + concept JSON migration

Create `vizRegistry.ts` with all keys and the `"token-flow-svg"` alias.
Edit every concept JSON to use the new `ConceptVizKey` values. TDD on
`vizRegistry.test.ts`. Verify: web suite passes, the existing
(pre-Task-4) `ConceptRoute` wrapper still renders without breakage
thanks to the alias.

### Step 3: Per-tab components and header

Build `ConceptHeader`, `ExplanationTab`, `LabTab`, `ExperimentTab`,
`CheckpointTab`, `NotesTab`, plus `useExperimentData` and
`useDebouncedCallback`. TDD per component; pure presentation, not yet
mounted in a route. Verify: 7 new test files green; build clean.

### Step 4: `ConceptWorkspace` screen + route swap + e2e selector updates

Build `apps/web/src/screens/ConceptWorkspace.tsx` composing header +
`<Tabs>` + per-tab components with URL-synced tab state. Update
`apps/web/src/routes.tsx` to point `/concepts/:id` at the new screen.
Delete `RouteWrappers.tsx`'s `ConceptRoute` export. Audit and update
e2e selectors that reference the old screen (phases 1, 2, 3 click into
concept screens; phase 4 clicks the ChatPlayground that used to render
below). Verify: web suite + e2e green.

### Step 5: Cleanup + alias retirement

Audit each legacy panel for remaining imports. Delete the orphans
(`VisualExperiment`, `LabPanel`, `CheckpointPanel`, `ProgressPanel`,
old `components/ConceptWorkspace.tsx`). Keep `GlossaryPanel` for now.
Remove the `"token-flow-svg"` alias from `vizRegistry`. Verify: all
suites green, build clean, no dead imports.

## Verification

The sub-project is done when all of these are green.

- `npm run labs:test` — 40 passed (unchanged from baseline).
- `npm run api:test` — 25 baseline + 2 new = 27 passed.
- `npm --prefix apps/web test` — baseline 95 + ~16 new, minus tests
  tied to deleted legacy panels ≈ 105+ passing.
- `npm --prefix apps/web run build` — clean.
- `npm run e2e` — 4 chromium flows pass with the new screen.
- Manual: visit `/concepts/bytes-unicode` — header + 5 tabs render,
  lesson markdown loads, Experiment tab shows `<TokenFlow>` with a
  hint, Checkpoint and Notes round-trip to the API.
- Manual: visit `/concepts/message-formatting` — Experiment tab shows
  `<ChatPlayground>`; no second ChatPlayground below the workspace.
- Manual: visit `/concepts/<unknown-id>` — "Concept not found" with a
  back link; no crash.
- Manual: `?tab=experiment` deep-links to the Experiment tab; reload
  preserves it; back/forward works.
- Manual: visit `/__foundation` — still bypasses the shell.
- Manual: with `prefers-reduced-motion: reduce` enabled — viz tabs
  still render, animations skip.

## Out of Scope

Deferred to later sub-projects or follow-ups.

- Inline glossary popovers on lesson terms — Glossary is sub-project 7.
- Concept Map polish — sub-project 5.
- Real-time autosave with optimistic UI beyond the debounced PUT.
- Markdown extensions beyond `react-markdown` defaults (no GFM tables,
  no math, no embeds).
- Chat-concept message persistence inside the Experiment tab —
  sub-project 6's call.
- Per-concept color theming / custom illustrations on the header.

## Risks and Mitigations

- **e2e selector drift.** Phase 1, 2, 3 e2e flows interact with the
  un-styled concept page using text-based selectors that are likely to
  change ("Lesson" → "Explanation", panel layout shifts to tabs). Step 4
  documents the selector replacements per spec file and re-runs e2e
  before commit.
- **Concept JSON migration ordering.** The `"token-flow-svg"` alias in
  the registry keeps the old `ConceptRoute` wrapper functional during
  Steps 2 and 3. The alias is removed in Step 5 only after the route
  swap.
- **Missing lesson markdown.** `content_loader.py` already raises
  `FileNotFoundError` at startup if any concept's `lessonPath` is
  missing, so a malformed lesson reference fails fast rather than
  silently. `ExplanationTab` only needs to handle an empty
  `lessonMarkdown` string (renders an empty state).
- **Notes debounce + tab switch race.** If the user types and switches
  tabs immediately, the debounced save fires after the tab is gone.
  `useDebouncedCallback` exposes a `flush()` method that `NotesTab`
  calls in `useEffect`'s teardown so the last value persists.
- **CheckpointTab + ScrollArea overflow on mobile.** `<ScrollArea>` has
  a `max-h`; textarea grows to ~12 rows. Verified manually in Step 4's
  smoke test.
- **Chat concepts losing the ChatPlayground location.** The current
  ConceptRoute wrapper renders ChatPlayground below the tabs for chat
  concepts. The new screen renders it inside the Experiment tab. Users
  who deep-linked to a chat concept's URL would see no ChatPlayground
  on initial load unless the URL also carries `?tab=experiment`.
  Mitigation: for concepts whose `visual === "chat-playground"`, the
  default active tab becomes `Experiment` instead of `Explanation`.
  Documented and tested.
