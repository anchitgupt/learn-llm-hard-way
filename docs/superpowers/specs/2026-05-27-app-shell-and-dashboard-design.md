# App Shell and Dashboard

Date: 2026-05-27

Sub-project 2 of a 7-part UI overhaul of the Learn LLM The Hard Way web app.
Builds on the Design Foundation (sub-project 1): dark-theme tokens, Tailwind +
shadcn/ui primitives, Motion helpers, and the `/__foundation` styleguide.

## Goal

Replace the routerless single-page `App.tsx` with a real app shell — top
header plus a collapsible left sidebar — backed by `react-router-dom`. Ship
the new polished Dashboard as the home route. Every other screen renders
inside the new shell with a "Migration in progress" banner so functionality
is preserved and the staging is visible.

The Dashboard answers one question for the learner: **what should I do
right now?** Every section earns its place by serving that question or by
building confidence about progress.

## Principles

These extend the Design Foundation principles into the shell layer.

1. The Dashboard is the answer-question screen. The hero is "Continue."
   Everything else (tracks, missed, recent) is supporting context.
2. The shell is calm and persistent. Sidebar and header are quiet chrome
   that lets the per-route content speak.
3. Staging is visible. Until a screen is polished by its own sub-project,
   it renders inside the new shell with an explicit migration banner.
4. State that survives navigation lives in one provider mounted at the
   shell. Per-screen state stays in the screen.

## Routes

| Path             | Screen              | Status in this sub-project                  |
|------------------|---------------------|---------------------------------------------|
| `/`              | Dashboard           | New, fully polished                         |
| `/concepts`      | Concept Map         | shell + existing component + banner (sp 5)  |
| `/concepts/:id`  | Concept Workspace   | shell + existing component + banner (sp 4)  |
| `/tracks`        | Tracks index        | shell + light list + banner (sp 4)          |
| `/chat`          | Chat Playground     | shell + existing component + banner (sp 6)  |
| `/glossary`      | Glossary            | shell + existing component + banner (sp 7)  |
| `/artifacts`     | Artifacts Browser   | shell + existing component + banner (sp 7)  |
| `/failures`      | Failure Museum      | shell + existing component + banner (sp 7)  |
| `/__foundation`  | Design Showcase     | kept as-is, does NOT use the app shell      |

`react-router-dom` v6 with `<BrowserRouter>`, `<Routes>`, `<Route>`. No data
routers, no loaders, no actions. Pin to `^6` for now; v7's data-router
defaults are out of scope here.

## Shell Layout

```text
┌────────────────────────────────────────────────────────────┐
│ Top header (h-14, bg-bg-surface, border-b border-subtle)   │
│ [Brand] Learn LLM The Hard Way    [progress pill] [⚙]      │
├──────────┬─────────────────────────────────────────────────┤
│ Sidebar  │                                                 │
│ (w-60 /  │   <Outlet>: per-route content                   │
│  w-14)   │                                                 │
│          │   max-w-7xl mx-auto p-8                         │
└──────────┴─────────────────────────────────────────────────┘
```

- Sidebar expands to 240 px, collapses to 56 px (icons only). State persists
  in `localStorage` under `learn-llm.sidebar.collapsed`. The toggle button
  sits at the bottom of the sidebar.
- Each nav item is a `<NavLink>` from `react-router-dom` with a lucide icon
  plus a text label. The active route's link gets `bg-accent-quiet
  text-accent` plus a 1 px cyan left border (`border-l border-accent`).
- The top header is 56 px tall. Left side: brand wordmark. Right side: a
  "progress pill" showing `completed_concepts / total_concepts`, and a
  settings cog (placeholder dropdown only; theme toggle is a future
  sub-project).
- The main area is `flex-1 overflow-y-auto`. Content max width is `7xl`,
  centered, padded `p-8`.
- The `/__foundation` route bypasses the shell entirely. The check stays in
  `App.tsx` before the router renders.

## Files

| Path                                              | Responsibility |
|---------------------------------------------------|----------------|
| `apps/web/src/shell/AppShell.tsx`                 | Header + sidebar + `<Outlet>`. Mounted by every shell route. |
| `apps/web/src/shell/TopHeader.tsx`                | Brand, progress pill, settings stub. |
| `apps/web/src/shell/SideNav.tsx`                  | Nav rows + collapse toggle. Reads/writes `localStorage`. |
| `apps/web/src/shell/MigrationBanner.tsx`          | "Migration in progress" callout, takes `scheduledIn` number. |
| `apps/web/src/shell/CourseDataProvider.tsx`       | Context provider that fetches tracks, glossary, missed, artifacts, totals once. Exposes `useCourseData()`. |
| `apps/web/src/routes.tsx`                         | Route table. Maps each path to its screen, wrapped in `AppShell`. |
| `apps/web/src/screens/Dashboard.tsx`              | The new polished Dashboard. Composes four section components. |
| `apps/web/src/screens/dashboard/ContinueCard.tsx` | Hero card: next concept. |
| `apps/web/src/screens/dashboard/TrackProgressGrid.tsx` | 5 track tiles with progress bars. |
| `apps/web/src/screens/dashboard/MissedTopicsPanel.tsx` | Missed-topic queue. |
| `apps/web/src/screens/dashboard/RecentArtifactsPanel.tsx` | Recent lab artifacts. |
| `apps/web/src/App.tsx` (rewrite)                  | `<BrowserRouter>` + `<Routes>`. Loses per-screen state. |
| `apps/web/src/components/Dashboard.tsx`           | Removed. Replaced by `src/screens/Dashboard.tsx`. |
| `apps/web/package.json` (modify)                  | Add `react-router-dom@^6` and `@types/react-router-dom` if needed (v6 ships its own types). |

The existing screens (`ConceptWorkspace`, `ConceptMap`, `ChatPlayground`,
etc.) stay where they are. They get wrapped, not rewritten.

## Migration Banner

Shipped as a small component used by every route that hasn't been polished
yet.

```tsx
// apps/web/src/shell/MigrationBanner.tsx
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface MigrationBannerProps {
  scheduledIn: number;
  note?: string;
}

export function MigrationBanner({ scheduledIn, note }: MigrationBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 px-4 py-3 mb-6",
        "border border-border-subtle rounded-md bg-bg-elevated",
        "text-text-muted text-[13px] leading-[18px]"
      )}
    >
      <Info aria-hidden className="h-4 w-4 mt-0.5 text-accent shrink-0" />
      <div>
        <span className="text-text-primary font-medium">
          Migration in progress.
        </span>{" "}
        This screen will be polished in sub-project {scheduledIn} of the UI overhaul.
        {note ? <> {note}</> : null}
      </div>
    </div>
  );
}
```

`scheduledIn` mapping:

| Route            | scheduledIn |
|------------------|-------------|
| `/concepts/:id`  | 4           |
| `/tracks`        | 4           |
| `/concepts`      | 5           |
| `/chat`          | 6           |
| `/glossary`      | 7           |
| `/artifacts`     | 7           |
| `/failures`      | 7           |

The banner renders above the existing component, inside the shell's main
area. The shell itself is fully styled, so the contrast feels intentional.

## State: `useCourseData()`

Single context provider mounted inside `AppShell`, above the `<Outlet>`.
Fetches on mount, exposes:

```ts
type CourseData = {
  tracks: Track[];
  glossaryEntries: GlossaryEntry[];
  missedTopics: MissedTopic[];
  recentArtifacts: LabRunArtifact[];
  totals: { conceptCount: number; completedConceptCount: number };
  continueConcept: Concept | null;
  refresh: () => Promise<void>;
};
```

`continueConcept` selector:

1. If any `MissedTopic` exists, prefer the most recent one's concept.
2. Else, if any concept has a non-null `lastOpenedAt`, pick the most recent.
3. Else, pick the first concept of the first track.

No external state library; just `useContext` + `useState` + `useEffect`.
The provider survives route changes because it lives in `AppShell`, which
sits above the route outlet.

## Dashboard Sections

The four sections, top to bottom, inside `max-w-7xl mx-auto p-8`:

```text
DashboardHeader (eyebrow + h1 + subline)

ContinueCard (hero, bg-bg-surface, border-l-4 border-accent, --glow-accent shadow)

TrackProgressGrid (grid-cols-2 md:grid-cols-3 lg:grid-cols-5)

MissedTopicsPanel | RecentArtifactsPanel  (md:grid-cols-2)
```

The whole Dashboard wraps in `<Stagger>`. Each section is a `<Reveal>`
child, so they fade-up in sequence (40 ms apart) on first paint. Springs
are reserved for educational viz (sub-project 3); chrome stays on the
foundation's `--ease-out` curve.

### ContinueCard

- Eyebrow: track label + concept position ("Concept 3 of 9 in Data and Tokens").
- Title: concept title.
- Body: concept summary (first sentence).
- Status row: prereqs ✓ / pending, confidence percent, open checkpoint count.
- Actions: "Open concept →" (primary, routes to `/concepts/:id`) and "Add a note" (ghost).
- Visual: cyan left border, `--glow-accent` shadow.

### TrackProgressGrid

- Five `<Card>` tiles (one per track). Title, short summary line, progress bar (shadcn `<Progress>`), `n/total` count, "Open →" linking to `/tracks/:id`.
- Empty track (0 complete) renders the progress bar at 0 with the bar still visible.

### MissedTopicsPanel

- List of missed topics, max 5 visible. Each row: reason badge ("failed-checkpoint", "low-confidence"), concept id, link to the concept.
- Empty: *"You haven't missed anything yet. Mistakes you mark go here so you can come back to them."*
- "View all →" routes to `/concepts?filter=missed` (the Concept Map screen reads this query in its own sub-project).

### RecentArtifactsPanel

- List of last 5 lab artifacts, sorted by `createdAt` desc. Each row: artifact id, relative timestamp ("1 h ago", "3 d ago"), link to `/artifacts/:path`.
- Empty: *"No lab artifacts yet. Run a lab and its output will show up here."*
- "View all →" routes to `/artifacts`.

### Loading / error

- Loading: each section renders a `<Skeleton>` block matching its final shape. No spinners.
- Error: inline `<Card>` with the message and a "Retry" button calling `refresh()`. Subsequent refresh failures use sonner toast.

## API touch-up

The Dashboard's `continueConcept` selector needs "most recently opened
concept." The API doesn't expose that today. Smallest additive change:

| File                                              | Change |
|---------------------------------------------------|--------|
| `apps/api/learn_llm_api/progress_store.py`        | Add `last_opened_at TEXT NULL` column to the existing progress table. New method `touch_concept(concept_id)` writes `datetime.utcnow().isoformat()`. Schema setup script handles the new column on existing databases. |
| `apps/api/learn_llm_api/app.py`                   | New `POST /api/progress/{concept_id}/touch` endpoint. Returns 204. |
| `apps/api/tests/test_progress_store.py`           | New test: `touch_concept` writes the timestamp; `list_progress` returns it. |
| `apps/api/tests/test_app.py`                      | New test: `POST /touch` returns 204; `GET /progress` shows the timestamp. |
| `apps/web/src/api.ts`                             | New `touchConcept(id: string): Promise<void>` calling the new route. |

The web app calls `touchConcept` when navigating into `/concepts/:id` (one
line in the route component). The Dashboard reads `lastOpenedAt` through
`useCourseData()` and uses it in the `continueConcept` selector.

About 30 LOC of backend code, two new API tests, one new web helper. Fully
self-contained.

## Tests

| File                                                              | What it tests |
|-------------------------------------------------------------------|---------------|
| `apps/web/src/__tests__/AppShell.test.tsx`                        | Shell renders header + sidebar + outlet; clicking a NavLink updates active state (use `<MemoryRouter>`). |
| `apps/web/src/__tests__/SideNav.test.tsx`                         | All 8 routes have a nav entry; collapsed state toggle persists to localStorage. |
| `apps/web/src/__tests__/MigrationBanner.test.tsx`                 | Banner renders with the right `scheduledIn` number; has `role=status`. |
| `apps/web/src/__tests__/CourseDataProvider.test.tsx`              | Provider fetches once; `continueConcept` selector follows the three-step rule. |
| `apps/web/src/screens/__tests__/Dashboard.test.tsx`               | Renders four sections; empty states render when arrays are empty. |
| `apps/web/src/screens/dashboard/__tests__/ContinueCard.test.tsx`  | Renders title, eyebrow, both CTAs; primary CTA routes to `/concepts/:id`. |
| `apps/web/src/screens/dashboard/__tests__/TrackProgressGrid.test.tsx` | One tile per track; progress = completed/total. |
| `apps/web/src/screens/dashboard/__tests__/MissedTopicsPanel.test.tsx` | List rendering + "View all" link points to `/concepts?filter=missed`. |
| `apps/web/src/screens/dashboard/__tests__/RecentArtifactsPanel.test.tsx` | List rendering + relative-time formatting. |
| `apps/api/tests/test_progress_store.py` (new test)                | `touch_concept` round-trip. |
| `apps/api/tests/test_app.py` (new test)                           | `POST /touch` returns 204. |
| `tests/e2e/*.spec.ts` (touched)                                   | Existing flows updated to navigate via the new sidebar. The user journeys themselves don't change. |

## Migration Plan

Five ordered steps; each is independently verifiable.

### Step 1: API touch-up

Add `last_opened_at` column, `touch_concept` method, `POST /touch` endpoint,
two new tests. Verify: `npm run api:test` green; web suite unchanged; no
frontend code touched yet.

### Step 2: Routing + AppShell + SideNav

Install `react-router-dom@^6`. Create `AppShell`, `TopHeader`, `SideNav`,
`MigrationBanner`, `routes.tsx`. Wrap every existing screen in the shell
with the migration banner. The old `Dashboard.tsx` is renamed to
`LegacyDashboard.tsx` and temporarily routed at `/` with the banner so the
home route still works while step 4 is pending. Update existing e2e tests
to navigate via the new sidebar.

Verify: build clean, web tests pass, all 4 e2e flows pass.

### Step 3: `useCourseData` context

Extract the data-fetching from old `App.tsx` into `CourseDataProvider`.
Mount it inside `AppShell`, above `<Outlet>`. Replace prop drilling — every
screen now reads from `useCourseData()`.

Verify: build clean, web tests pass, e2e flows pass.

### Step 4: New Dashboard

Write `screens/Dashboard.tsx` and the four section components against
`useCourseData()`. Wire `continueConcept` using `lastOpenedAt`. Delete
`LegacyDashboard.tsx`. Make `/concepts/:id` call `touchConcept(id)` on
mount.

Verify: web suite green, dashboard renders correctly in dev server, e2e
flows still green.

### Step 5: Polish + commit

Honour `prefers-reduced-motion` on the Stagger (reuse the existing helper).
Ensure focus order on the sidebar is sensible. Optional small keyboard
shortcut: `g d` to navigate to Dashboard.

Verify: full gate (labs + api + web + build + e2e) green.

## Verification gate

The sub-project is done when all of these are green.

- `npm run labs:test` — unchanged from baseline.
- `npm run api:test` — 2 new tests; everything green.
- `npm --prefix apps/web test` — many new tests; baseline tests still pass.
- `npm --prefix apps/web run build` — clean.
- `npm run e2e` — 4 chromium flows pass (updated to new nav).
- Manual: open `/`, see the new Dashboard. Click each sidebar item, see
  migration banners + intact functionality. Toggle the sidebar collapse,
  refresh — collapsed state persists.
- Manual: `/__foundation` still renders without the shell.

## Out of Scope

Deferred to later sub-projects or follow-ups.

- Polishing the screens that get wrapped — sub-projects 4, 5, 6, 7.
- A Cmd+K command palette — possible polish pass later.
- Real metrics on the progress pill beyond `completed / total` — no streak
  counter yet.
- A mobile bottom-nav. The sidebar collapses; mobile bottom-nav is a future
  polish if/when it matters.

## Risks and Mitigations

- **e2e brittleness.** The existing e2e tests have selectors tied to the
  routerless app. Updating them is unavoidable; the plan includes a
  documented selector update for each test, with comments so the next
  migration doesn't re-break them.
- **Context fetch storm.** A naive `useCourseData()` could refetch on every
  navigation if the provider isn't mounted ONCE. The plan mounts the
  provider inside `AppShell`, above the `<Outlet>`, so it lives across
  route changes.
- **react-router-dom v6 vs v7.** Pin to `^6`. v7 is the data-router-first
  flavour; loaders and actions are out of scope here.
- **Dashboard test fragility from sonner toasts.** Mount the `<Toaster>`
  once at the shell level and use `vi.useFakeTimers()` in tests that
  exercise the error path.
- **`/__foundation` bypass.** The path check stays in `App.tsx` BEFORE the
  router renders, so the foundation showcase keeps rendering without the
  shell. Verified by manual smoke test.
