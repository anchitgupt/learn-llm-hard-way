# Supporting Screens — Design Spec

**Goal:** Polish the four remaining un-styled surfaces in the UI overhaul (Glossary, Artifacts, Failures, Tracks), add a chat-memory editor as a drawer inside `/chat`, and fold the legacy Preference Simulation into `/failures`. End state: zero legacy panels mounted in routes; `RouteWrappers.tsx` retired.

**Sub-project:** 7 of 7. Closes the UI overhaul.

**Scope check:** Six surfaces, but each is small (most are polish over existing read-only data). One spec, one implementation plan.

---

## 1. Architecture

Each screen follows the established pattern (sub-projects 4–6): a screen-level orchestrator under `apps/web/src/screens/` plus a screen-local component folder for parts. All read data via `useCourseData()` where possible; only `/failures` and the memory drawer fetch from the API directly (failure cases + preference simulation; memory list).

```text
apps/web/src/screens/
  Glossary.tsx            # /glossary
  Artifacts.tsx           # /artifacts
  Failures.tsx            # /failures
  Tracks.tsx              # /tracks
  glossary/
    GlossarySearch.tsx
    GlossaryGrid.tsx
    TermCard.tsx
    useGlossaryFilter.ts
  artifacts/
    ArtifactsByLab.tsx
    ArtifactCard.tsx
    thumbs/
      AttentionThumb.tsx
      LossThumb.tsx
      GenerationThumb.tsx
      ComparisonThumb.tsx
      FailureThumb.tsx
  failures/
    FailuresByCategory.tsx
    FailureCard.tsx
    PreferenceSection.tsx
    useFailuresData.ts        # fetch failures + preference once
  tracks/
    TrackCard.tsx
    TrackProgress.tsx
    useTrackStats.ts          # derives completion % from progress map
  chat/
    MemoryDrawer.tsx
    MemoryList.tsx
    MemoryAddForm.tsx
    useMemoryEditor.ts
```

**Modified:**

- `apps/web/src/routes.tsx` — route elements point at the new screens.
- `apps/web/src/screens/RouteWrappers.tsx` — file deleted.
- `apps/web/src/screens/ChatPlayground.tsx` and `apps/web/src/screens/chat/ChatComposer.tsx` — composer gets a "Memories" button that opens `<MemoryDrawer>`.
- `apps/web/src/api.ts` — add `deleteChatMemory(id: number)`.
- `apps/api/learn_llm_api/app.py` — add `DELETE /api/chat/memory/{memory_id}` route.
- `apps/api/learn_llm_api/progress_store.py` — add `delete_chat_memory(memory_id: int) -> bool`.
- `apps/api/tests/test_app.py` — pin delete contract (success + 404).

**Deleted as orphans once consumers are gone:**

- `apps/web/src/components/GlossaryPanel.tsx`
- `apps/web/src/components/FailureMuseum.tsx`
- `apps/web/src/components/PreferencePanel.tsx`
- `apps/web/src/components/ArtifactPreview.tsx` (logic absorbed into thumbs)

No legacy panels remain mounted after this sub-project.

---

## 2. Screens

### 2.1 `/glossary` — Glossary

**Data:** `useCourseData().glossaryEntries: GlossaryEntry[]`.

**Layout:** vertical stack.

1. Page header — eyebrow "Reference", h1 "Glossary", body "Search every term you've encountered."
2. `<GlossarySearch>` — controlled `<input type="search">` bound to `?q=` via `useSearchParams`. Below the input: a muted count "Showing X of Y terms".
3. `<GlossaryGrid>` — responsive CSS grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, gap 4.
4. Each cell: `<TermCard>` — `<Card>` containing:
   - `<CardHeader>` with term title (`text-[16px] font-semibold`) and a "Related" badge showing `relatedConcepts.length` if > 0.
   - `<CardContent>` with the `shortDefinition` and, when expanded, a divider + the long `explanation` + a row of `<Badge>` chips for each related concept that link to `/concepts/:id` via `<Link>`.
   - Click anywhere on the card toggles `expanded` state. The relation-chip clicks stop propagation so they navigate without collapsing the card.

**Search behavior:** filter case-insensitively over `term + shortDefinition + explanation`. Filter recomputed via `useMemo`. URL kept in sync (`?q=...`); refresh restores filter.

**Empty state:** when filtered list is empty, the grid is replaced by a centered muted message "No terms match `<query>`".

**Animation:** `<Stagger>` wraps the grid; cards enter with `panelEnter`. Card expansion is a `<motion.div>` height auto with spring `springViz`.

### 2.2 `/artifacts` — Artifacts gallery

**Data:** `useCourseData().recentArtifacts: LabRunArtifact[]`.

**Layout:**

1. Page header — eyebrow "Runs", h1 "Artifacts from your labs", body "Recent lab outputs grouped by experiment."
2. Empty state (when `recentArtifacts.length === 0`): a centered `<Card>` saying "No artifacts yet. Run a lab from a concept page to see results here." with a primary link "Open Concept Map → `/concepts`".
3. `<ArtifactsByLab>` — groups recentArtifacts by `labId`, sorted by descending count, but preserves the original recency order within each group.
   - Per-group section: an `<h2>` showing the lab id (mono, accent-cyan) + a small badge with the count. Below: responsive grid of `<ArtifactCard>`.
4. Each `<ArtifactCard>` shows: concept id (small mono link → `/concepts/{conceptId}`), status badge (success / error), and a thumb chosen by introspecting `artifact`:
   - `artifact.attention.weights` exists → `<AttentionThumb>` (small AttentionMap, 96px square, no axes/legend).
   - `artifact.training.lossHistory` exists → `<LossThumb>` (small LossCurve sparkline, 144×56, no axes).
   - `artifact.generation.generatedText` exists → `<GenerationThumb>` (mono, first 120 chars + ellipsis).
   - `artifact.comparison` exists → `<ComparisonThumb>` (two-row mini: base / assistant).
   - `artifact.failure` exists → `<FailureThumb>` (expectedFact + explanation, max 2 lines each).
   - When more than one of these exists, render whichever matches the highest-priority rule above (in the order listed).
   - When none match: muted "No preview available".

### 2.3 `/failures` — Failure Museum + Preferences

**Data:** `useFailuresData()` — single hook that loads `fetchChatFailures()` and `fetchChatPreference()` in parallel and exposes `{ failures, preference, loading, error }`.

**Layout:**

1. Page header — eyebrow "What goes wrong", h1 "Failure museum", body "Categories of failure modes — and the strategies that fix them."
2. `<FailuresByCategory>` — groups `FailureCase[]` by `category`, ordered by group size descending then alpha. Per-category section: `<h2>` with the category label (Title Case) + count badge. Below: grid of `<FailureCard>`.
3. Each `<FailureCard>`:
   - **Collapsed:** category badge in the corner; the prompt in `<CardTitle>`; first 160 chars of `modelOnlyOutput` muted; "Expand" affordance.
   - **Expanded:** divider, then **Why it fails** (`explanation`), then **Better strategy** (`betterStrategy`), then a chip row of related concepts → `/concepts/:id`.
4. `<PreferenceSection>` — bottom section. Header "Preference simulation" + small body "Which response wins when ranked by a reward model?". Content:
   - The prompt in a quoted card.
   - A grid (2 cols on `md`) of candidate cards: each shows `id`, response text, trait chips, and reward score. The winning candidate gets an accent border + a "Winner" badge.
   - Below the grid: the `explanation` paragraph.

**Loading/error:** loading skeleton (`<Skeleton>` × 6 cards); error shows a `<Card>` with the message and a "Retry" button (re-calls the hook).

### 2.4 `/tracks` — Tracks overview

**Data:** `useCourseData().tracks: Track[]` and `useCourseData().progress: ProgressRecord[]`.

**Layout:**

1. Page header — eyebrow "Map of the course", h1 "Tracks", body "Each track is a guided path through related concepts."
2. Responsive grid of `<TrackCard>` (`grid-cols-1 lg:grid-cols-2`):
   - `<CardHeader>`: track order pill ("01"), title, summary.
   - `<TrackProgress>`: a thin progress bar (Tailwind `h-1 bg-surface-2`) + percentage text "X / Y concepts complete" derived from `useTrackStats(track)`. Track is "complete" when all its concepts have a progress record with `status === "complete"`.
   - Concept list: each concept rendered as a row — order number, status dot (uses the same precedence as ConceptMap: missed > complete > learning > open), title, and a small `<Link>` "Open →" to `/concepts/{conceptId}`.
   - Primary action at the card footer: "Start track →" — links to the first concept of the track (or the first non-complete concept if any progress exists).

**useTrackStats(track)** returns `{ total, completed, percent, nextConceptId }`.

### 2.5 `/chat` — Memory drawer

**ChatComposer addition:** a secondary `<Button variant="outline">` labeled "Memories (N)" appears in the composer's button row, next to "Send". `N` is the current memory count (queried lazily — see hook). Clicking it opens `<MemoryDrawer>`.

**MemoryDrawer:** a shadcn `<Sheet>` slide-over from the right (already-installed primitive; install if missing). Header: "Saved memories" + body "Memories the assistant can recall when memory mode is set to Saved."

Contents:

- `<MemoryAddForm>` — native `<textarea>` (matching `ChatComposer`'s pattern) + "Save" button. Disabled while saving. On success, clears the textarea and re-fetches the list.
- Divider.
- `<MemoryList>` — list of saved memories sorted by `createdAt` descending. Each row: content (mono, wrappable), small muted `createdAt`, and a trash icon button on the right. Clicking trash triggers `deleteChatMemory(id)`; on success the row optimistically removes itself; on failure shows an inline error and restores the row.

**useMemoryEditor():** owns `{ memories, loading, saving, deleting, error, save(content), remove(id), refresh() }`. Auto-fetches on mount and whenever the drawer opens.

**Side effect on send:** when the user closes the drawer after adding/removing memories, no chat trace is invalidated — the next `Send` will simply pick up the new list because the API re-reads memories per request.

---

## 3. API additions

### `DELETE /api/chat/memory/{memory_id}`

- **Success:** 204 No Content when a row was deleted.
- **Not found:** 404 with `{"detail": "memory not found"}` when no row matched.
- **Repository:** `store.delete_chat_memory(memory_id: int) -> bool` returns whether a row was removed.
- **Test:** `apps/api/tests/test_app.py` adds two cases:
  - delete an existing memory returns 204 and the row is no longer listed,
  - delete a non-existent memory returns 404.

No other API change is required. The list and save endpoints already exist.

---

## 4. Routing & nav

- `/glossary`, `/artifacts`, `/failures`, `/tracks` route elements switch from the legacy wrappers in `RouteWrappers.tsx` to the new screen components.
- `RouteWrappers.tsx` is deleted.
- `SideNav` is unchanged — entries already exist.
- No new nav entry for the memory drawer (drawer lives inside `/chat`).

---

## 5. Data flow

```text
CourseDataProvider
  ├─ glossaryEntries ──────► <Glossary>
  ├─ tracks + progress  ───► <Tracks>
  └─ recentArtifacts ──────► <Artifacts>

useFailuresData (API: failures + preference) ─► <Failures>
useMemoryEditor (API: memory list/save/delete) ─► <MemoryDrawer>
```

No new global state. No new contexts. The memory drawer's hook is screen-local.

---

## 6. Error handling

- **API endpoints used by /failures and the drawer:** every fetch handles `ok === false` via the existing `readJson` helper, which throws — hooks catch and surface as `error: string`.
- **Memory delete optimistic UI:** the row removes first, but the hook keeps a snapshot. On failure, restore the row and show a small inline alert "Couldn't delete memory. Try again."
- **Empty states:** every screen has an empty state for "no data" (no terms / no artifacts / no failures / no tracks / no memories) — never blank surfaces.
- **Course data not yet loaded:** `useCourseData()` already manages a loading state; screens use `<Skeleton>` placeholders for the first paint.

---

## 7. Animation

Match sub-projects 4–6's discipline: every list/grid is wrapped in `<Stagger>` from `@/lib/motion`; each child enters via `<Reveal>` with `panelEnter`. Card expansion in Glossary and Failures uses `<motion.div initial layout>` for a soft height transition. No long animations — keep durations ~150ms.

---

## 8. Testing

**Web (Vitest + RTL):**

- `apps/web/src/screens/__tests__/Glossary.test.tsx`:
  - renders all glossary terms when no query,
  - filtering by `?q=` reduces the visible list,
  - clicking a card reveals the long explanation and the related-concept chip link to `/concepts/<id>`,
  - empty state when query matches nothing.
- `apps/web/src/screens/__tests__/Artifacts.test.tsx`:
  - renders sections grouped by lab when artifacts are present,
  - renders the empty-state card when there are no artifacts,
  - dispatches the correct thumb for each known artifact shape (one assertion per branch),
  - falls back to "No preview available" when no branch matches.
- `apps/web/src/screens/__tests__/Failures.test.tsx`:
  - renders category sections derived from fetched failures (mocked),
  - clicking a card reveals the explanation + better strategy,
  - renders the PreferenceSection with the winner badge on the right candidate,
  - renders the loading skeleton while the hook is in flight.
- `apps/web/src/screens/__tests__/Tracks.test.tsx`:
  - renders one card per track,
  - progress bar shows correct percentage given a mocked progress map,
  - "Start track →" links to the first non-complete concept (or `concepts[0]` if no progress),
  - status dot precedence matches ConceptMap (missed > complete > learning > open).
- `apps/web/src/screens/__tests__/ChatPlayground.memory.test.tsx`:
  - clicking "Memories (N)" opens the drawer,
  - saving a memory calls `saveChatMemory` and refreshes the list,
  - clicking trash calls `deleteChatMemory` and removes the row,
  - failed delete restores the row and shows the inline alert.

Existing `ChatPlayground.test.tsx` continues to pass — the memories button is non-disruptive.

**API (pytest):**

- `apps/api/tests/test_app.py` adds:
  - `test_delete_chat_memory_removes_existing_row` — save → delete → list shows it gone, status 204.
  - `test_delete_chat_memory_returns_404_for_unknown_id` — delete unknown id returns 404 with the documented detail.

**E2E (Playwright):** no new spec; existing flows continue to cover the chat send path. The memory drawer is reachable by clicking "Memories" but is exercised by unit tests, not e2e.

---

## 9. Out of scope

- No new viz components. Thumbs are tiny inline renderers using existing viz primitives.
- No memory editing (update). Only add and delete.
- No multi-select / bulk delete in the drawer.
- No glossary deep-link route (`/glossary/:term`).
- No search/filter on `/tracks` or `/artifacts` — list sizes are small.
- No edit on FailureCase. Read-only.
- No keyboard shortcut to open the memory drawer (Esc to close is free via shadcn `<Sheet>`).

---

## 10. Definition of done

- All four screens, the drawer, and the API addition implemented behind passing tests.
- `RouteWrappers.tsx` and the four legacy panels deleted.
- `npm --prefix apps/web test`, `npm --prefix apps/api test` (or pytest), `npm --prefix apps/web run build`, and `npm run e2e` all green.
- Branch merged into `main`, pushed to `origin/main`.
- Handoff doc updated to mark sub-project 7 DONE.
