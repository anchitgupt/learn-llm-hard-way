# App Shell and Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the routerless single-page app with an app shell (top header + collapsible left sidebar) backed by `react-router-dom`, ship a new polished Dashboard at `/`, and wrap every other existing screen in the shell with a "Migration in progress" banner.

**Architecture:** Three implementation tasks behind one API touch-up. Task 1 adds `last_opened_at` to the progress store so the Dashboard's Continue hero is meaningful. Task 2 lands the entire shell infrastructure — router, header, sidebar, migration banner, and a single `CourseDataProvider` so every screen reads from one fetched-once context. Task 3 builds the four-section Dashboard against that provider and wires `touchConcept` so the Continue selector tracks "what you were just reading." Task 4 polishes the result.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 3.4, shadcn/ui, Motion-for-React, **react-router-dom@^6** (new), lucide-react, vitest, Playwright, FastAPI + SQLite.

**Spec:** [docs/superpowers/specs/2026-05-27-app-shell-and-dashboard-design.md](../specs/2026-05-27-app-shell-and-dashboard-design.md)

**Deviation from the spec's migration plan:** the spec lists 5 steps; this plan collapses spec-steps 2 and 3 (shell + provider) into a single Task 2. Reason: separating them forces step 2 to ship a `LegacyDashboard` that fetches its own data, which step 3 immediately tears down. Landing both together is simpler, smaller, and preserves the verification gates.

---

## Pre-flight

- [ ] **Pre-flight Step 1: Create a feature branch from `main`**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout main
git pull --ff-only
git checkout -b app-shell-dashboard
git status
```

Expected: branch `app-shell-dashboard` checked out, working tree clean.

- [ ] **Pre-flight Step 2: Capture baseline test counts**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -2
npm run api:test  2>&1 | tail -2
npm --prefix apps/web test 2>&1 | tail -4
npm run e2e 2>&1 | tail -3
```

Expected: labs 40 passed, api 22 passed, web 30 passed (18 files), e2e 4 passed.

---

## Task 1: API touch-up — `last_opened_at`

**Files:**
- Modify: `apps/api/learn_llm_api/progress_store.py`
- Modify: `apps/api/learn_llm_api/app.py`
- Modify: `apps/api/tests/test_progress_store.py`
- Modify: `apps/api/tests/test_app.py`
- Modify: `apps/web/src/api.ts`

### 1a. ProgressStore: add column + `touch_concept` (TDD)

- [ ] **Step 1a.1: Write the failing test**

Append to `apps/api/tests/test_progress_store.py`:

```python
def test_touch_concept_records_last_opened_at(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.touch_concept("bytes-unicode")
    rows = store.list_progress()
    assert len(rows) == 1
    assert rows[0]["conceptId"] == "bytes-unicode"
    assert rows[0]["lastOpenedAt"] is not None
    assert "T" in rows[0]["lastOpenedAt"]  # ISO 8601 with date+time


def test_touch_concept_updates_existing_progress_row(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.save_progress(
        concept_id="bytes-unicode",
        status="learning",
        confidence=3,
        note="",
        revisit=False,
    )
    store.touch_concept("bytes-unicode")
    rows = store.list_progress()
    assert len(rows) == 1
    assert rows[0]["status"] == "learning"
    assert rows[0]["lastOpenedAt"] is not None
```

- [ ] **Step 1a.2: Run the tests, confirm they FAIL**

```bash
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py::test_touch_concept_records_last_opened_at -v 2>&1 | tail -8
```

Expected: FAIL — `ProgressStore` has no attribute `touch_concept`.

- [ ] **Step 1a.3: Add `last_opened_at` column + `touch_concept` to ProgressStore**

In `apps/api/learn_llm_api/progress_store.py`:

(a) Inside `initialize()`, after the existing `CREATE TABLE` for `concept_progress`, add a forward-compatible migration that adds the column if missing:

```python
            # Forward migration for installations created before last_opened_at landed.
            existing_columns = {
                row[1]
                for row in connection.execute("PRAGMA table_info(concept_progress)").fetchall()
            }
            if "last_opened_at" not in existing_columns:
                connection.execute(
                    "ALTER TABLE concept_progress ADD COLUMN last_opened_at TEXT NULL"
                )
```

Insert this right after the four `CREATE TABLE IF NOT EXISTS` statements, still inside the same `with sqlite3.connect(...)` block.

Also add `last_opened_at TEXT NULL` to the `CREATE TABLE IF NOT EXISTS concept_progress (...)` definition so fresh databases get the column without the migration step:

```python
                CREATE TABLE IF NOT EXISTS concept_progress (
                  concept_id TEXT PRIMARY KEY,
                  status TEXT NOT NULL,
                  confidence INTEGER NOT NULL,
                  note TEXT NOT NULL,
                  revisit INTEGER NOT NULL CHECK (revisit IN (0, 1)),
                  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  last_opened_at TEXT NULL
                )
```

(b) Add a new method on `ProgressStore`, after `save_progress`:

```python
    def touch_concept(self, concept_id: str) -> None:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.database_path) as connection:
            connection.execute(
                """
                INSERT INTO concept_progress (concept_id, status, confidence, note, revisit, last_opened_at)
                VALUES (?, 'opened', 3, '', 0, ?)
                ON CONFLICT(concept_id) DO UPDATE SET
                  last_opened_at = excluded.last_opened_at
                """,
                (concept_id, now),
            )
```

(c) Extend the SELECT lists and the row mapper to expose `last_opened_at` as `lastOpenedAt`:

Change `get_progress`, `list_revisit`, and `list_progress` so their SELECT includes `last_opened_at`:

```python
                SELECT concept_id, status, confidence, note, revisit, last_opened_at
                FROM concept_progress
```

(in all three queries — match the existing patterns).

Update `_row_to_progress`:

```python
    @staticmethod
    def _row_to_progress(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "conceptId": row["concept_id"],
            "status": row["status"],
            "confidence": row["confidence"],
            "note": row["note"],
            "revisit": bool(row["revisit"]),
            "lastOpenedAt": row["last_opened_at"],
        }
```

- [ ] **Step 1a.4: Run the new tests, confirm PASS**

```bash
pytest apps/api/tests/test_progress_store.py -v 2>&1 | tail -15
```

Expected: both new tests pass; existing progress_store tests still pass (no regression).

### 1b. FastAPI endpoint `POST /api/progress/{concept_id}/touch` (TDD)

- [ ] **Step 1b.1: Write the failing test**

Append to `apps/api/tests/test_app.py`:

```python
def test_post_progress_touch_returns_204_and_progress_row(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from learn_llm_api.app import create_app

    monkeypatch.setenv("LEARN_LLM_DATABASE_PATH", str(tmp_path / "progress.sqlite"))
    client = TestClient(create_app(database_path=tmp_path / "progress.sqlite"))

    response = client.post("/api/progress/bytes-unicode/touch")
    assert response.status_code == 204

    progress = client.get("/api/progress").json()
    assert any(row["conceptId"] == "bytes-unicode" and row["lastOpenedAt"] for row in progress)
```

- [ ] **Step 1b.2: Run and confirm FAIL**

```bash
pytest apps/api/tests/test_app.py::test_post_progress_touch_returns_204_and_progress_row -v 2>&1 | tail -10
```

Expected: FAIL — endpoint returns 404.

- [ ] **Step 1b.3: Add the endpoint**

In `apps/api/learn_llm_api/app.py`, add this route alongside the other progress routes (after `save_progress`):

```python
    @app.post("/api/progress/{concept_id}/touch", status_code=204)
    def touch_progress(concept_id: str) -> None:
        store.touch_concept(concept_id)
```

`Response` import isn't needed; FastAPI handles `204` with a `None` return when `status_code` is set on the decorator.

- [ ] **Step 1b.4: Run and confirm PASS**

```bash
pytest apps/api/tests/test_app.py -v 2>&1 | tail -8
```

Expected: all api tests pass (baseline 22 + 2 new = 24).

### 1c. Frontend `touchConcept(id)` helper

- [ ] **Step 1c.1: Read the current `apps/web/src/api.ts` to find the right placement**

```bash
sed -n '1,40p' apps/web/src/api.ts
```

(No code change in this step; just locate where other progress functions live.)

- [ ] **Step 1c.2: Add `touchConcept` next to the other `progress` helpers**

In `apps/web/src/api.ts`, find the existing `saveProgress` function and add immediately below it:

```ts
export async function touchConcept(conceptId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/progress/${conceptId}/touch`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error(`touch ${conceptId} failed: ${response.status}`);
  }
}
```

No new web test required for this helper — it's used in Task 3 inside a route component whose own test will exercise the call.

- [ ] **Step 1c.3: Verify the web suite still passes (we added a function but consume it later)**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: build clean; 30 web tests pass.

### 1d. Commit

- [ ] **Step 1d.1: Commit Task 1**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/api/learn_llm_api/progress_store.py \
        apps/api/learn_llm_api/app.py \
        apps/api/tests/test_progress_store.py \
        apps/api/tests/test_app.py \
        apps/web/src/api.ts
git commit -m "feat(api): record last_opened_at and expose POST /touch

Adds a forward-compatible 'last_opened_at' column to concept_progress,
a 'touch_concept' method on ProgressStore, and a corresponding
POST /api/progress/{concept_id}/touch endpoint. The web client gains
a 'touchConcept' helper; Task 3 will call it on concept-route mount.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Shell + Routing + CourseDataProvider

This task lands the entire app-shell infrastructure: router, header, sidebar, migration banner, and the single `CourseDataProvider` every screen reads from. Existing screens are wrapped — not rewritten — so functionality is preserved. The `/` home route gets a temporary `<LegacyDashboard>` wrapper that uses `useCourseData()` plus the pre-existing un-styled UI; Task 3 will replace it with the new polished Dashboard.

**Files:**
- Modify: `apps/web/package.json` (add `react-router-dom`)
- Create: `apps/web/src/shell/AppShell.tsx`
- Create: `apps/web/src/shell/TopHeader.tsx`
- Create: `apps/web/src/shell/SideNav.tsx`
- Create: `apps/web/src/shell/MigrationBanner.tsx`
- Create: `apps/web/src/shell/CourseDataProvider.tsx`
- Create: `apps/web/src/routes.tsx`
- Modify: `apps/web/src/App.tsx` (rewrite for router; keep `/__foundation` bypass)
- Create: `apps/web/src/screens/LegacyDashboardRoute.tsx` (temporary; deleted in Task 3)
- Create: `apps/web/src/__tests__/AppShell.test.tsx`
- Create: `apps/web/src/__tests__/SideNav.test.tsx`
- Create: `apps/web/src/__tests__/MigrationBanner.test.tsx`
- Create: `apps/web/src/__tests__/CourseDataProvider.test.tsx`
- Modify: `tests/e2e/phase1-learning-path.spec.ts`
- Modify: `tests/e2e/phase2-learning-core.spec.ts`
- Modify: `tests/e2e/phase3-mini-llm.spec.ts`
- Modify: `tests/e2e/phase4-chat-mechanics.spec.ts`

### 2a. Install `react-router-dom`

- [ ] **Step 2a.1: Install**

```bash
npm --prefix apps/web install react-router-dom@^6
```

Expected: install succeeds; `apps/web/package.json` gains `"react-router-dom": "^6.x"` in `dependencies`. (v6 bundles its own types — no separate `@types/...` install needed.)

- [ ] **Step 2a.2: Verify build still passes**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: clean.

### 2b. `MigrationBanner` (TDD)

- [ ] **Step 2b.1: Write the failing test**

`apps/web/src/__tests__/MigrationBanner.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MigrationBanner } from "../shell/MigrationBanner";

describe("MigrationBanner", () => {
  it("announces the migration with the right sub-project number", () => {
    render(<MigrationBanner scheduledIn={5} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Migration in progress/i);
    expect(status).toHaveTextContent(/sub-project 5/i);
  });

  it("renders an optional note when provided", () => {
    render(<MigrationBanner scheduledIn={4} note="Concept Workspace is still styled by the old CSS." />);
    expect(screen.getByRole("status")).toHaveTextContent(/old CSS/i);
  });
});
```

- [ ] **Step 2b.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- MigrationBanner 2>&1 | tail -10
```

Expected: FAIL — module `../shell/MigrationBanner` not found.

- [ ] **Step 2b.3: Implement**

`apps/web/src/shell/MigrationBanner.tsx`:

```tsx
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

- [ ] **Step 2b.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- MigrationBanner 2>&1 | tail -8
```

Expected: 2 assertions pass.

### 2c. `CourseDataProvider` + `useCourseData` (TDD)

- [ ] **Step 2c.1: Write the failing test**

`apps/web/src/__tests__/CourseDataProvider.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CourseDataProvider, useCourseData } from "../shell/CourseDataProvider";
import * as api from "../api";
import type { Concept, MissedTopic, Track } from "../types";

function Consumer() {
  const data = useCourseData();
  return (
    <ul>
      <li data-testid="tracks">{data.tracks.length}</li>
      <li data-testid="missed">{data.missedTopics.length}</li>
      <li data-testid="continue">{data.continueConcept?.id ?? "none"}</li>
      <li data-testid="totals">{data.totals.completedConceptCount}/{data.totals.conceptCount}</li>
    </ul>
  );
}

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode" } as Concept,
    { id: "char-tokenizer", title: "Char tokenizer" } as Concept
  ]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("CourseDataProvider", () => {
  it("prefers a missed-topic concept for continueConcept", async () => {
    const missed: MissedTopic[] = [{ conceptId: "char-tokenizer", reason: "failed-checkpoint" }];
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue(missed);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("char-tokenizer"));
    expect(screen.getByTestId("tracks").textContent).toBe("1");
    expect(screen.getByTestId("totals").textContent).toBe("0/2");
  });

  it("falls back to the most recently opened concept when no missed topics", async () => {
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([
      { conceptId: "bytes-unicode",  status: "learning", confidence: 3, note: "", revisit: false, lastOpenedAt: "2026-05-26T09:00:00Z" },
      { conceptId: "char-tokenizer", status: "learning", confidence: 3, note: "", revisit: false, lastOpenedAt: "2026-05-26T11:00:00Z" }
    ]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("char-tokenizer"));
  });

  it("falls back to the first concept of the first track when nothing else is available", async () => {
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("bytes-unicode"));
  });
});
```

- [ ] **Step 2c.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- CourseDataProvider 2>&1 | tail -10
```

Expected: FAIL — module `../shell/CourseDataProvider` not found (and `fetchProgress` may also be missing — that's expected; we add it as part of the implementation below).

- [ ] **Step 2c.3: Add `fetchProgress` and `ProgressRecord.lastOpenedAt` in `apps/web/src/api.ts`**

Find the existing `ProgressRecord` type and add `lastOpenedAt`:

```ts
export interface ProgressRecord {
  conceptId: string;
  status: string;
  confidence: number;
  note: string;
  revisit: boolean;
  lastOpenedAt?: string | null;
}
```

Find the existing `fetchProgress` if it exists; if not, add it next to `fetchTracks` / `fetchGlossary`:

```ts
export async function fetchProgress(): Promise<ProgressRecord[]> {
  return readJson<ProgressRecord[]>(await fetch(`${API_BASE}/api/progress`));
}
```

(If `ProgressRecord` already has `lastOpenedAt` from earlier work, leave it; the field is additive.)

- [ ] **Step 2c.4: Implement the provider**

`apps/web/src/shell/CourseDataProvider.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchGlossary,
  fetchMissedTopics,
  fetchProgress,
  fetchRecentArtifacts,
  fetchTracks
} from "../api";
import type {
  Concept,
  GlossaryEntry,
  LabRunArtifact,
  MissedTopic,
  ProgressRecord,
  Track
} from "../types";

interface CourseData {
  tracks: Track[];
  glossaryEntries: GlossaryEntry[];
  missedTopics: MissedTopic[];
  recentArtifacts: LabRunArtifact[];
  progressRecords: ProgressRecord[];
  totals: { conceptCount: number; completedConceptCount: number };
  continueConcept: Concept | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CourseDataContext = createContext<CourseData | null>(null);

export function CourseDataProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);
  const [recentArtifacts, setRecentArtifacts] = useState<LabRunArtifact[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, g, m, a, p] = await Promise.all([
        fetchTracks(),
        fetchGlossary(),
        fetchMissedTopics(),
        fetchRecentArtifacts(),
        fetchProgress()
      ]);
      setTracks(t);
      setGlossaryEntries(g);
      setMissedTopics(m);
      setRecentArtifacts(a);
      setProgressRecords(p);
      setError(null);
    } catch (unknownError: unknown) {
      setError(unknownError instanceof Error ? unknownError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const conceptIndex = useMemo(() => {
    const map = new Map<string, Concept>();
    for (const track of tracks) {
      for (const concept of track.concepts) {
        map.set(concept.id, concept);
      }
    }
    return map;
  }, [tracks]);

  const totals = useMemo(() => {
    const conceptCount = conceptIndex.size;
    const completedConceptCount = progressRecords.filter((r) => r.status === "complete").length;
    return { conceptCount, completedConceptCount };
  }, [conceptIndex, progressRecords]);

  const continueConcept = useMemo<Concept | null>(() => {
    // 1) Prefer any missed topic.
    for (const missed of missedTopics) {
      const concept = conceptIndex.get(missed.conceptId);
      if (concept) return concept;
    }
    // 2) Most-recently-opened.
    const sortedByOpened = [...progressRecords]
      .filter((r) => r.lastOpenedAt)
      .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""));
    for (const record of sortedByOpened) {
      const concept = conceptIndex.get(record.conceptId);
      if (concept) return concept;
    }
    // 3) First concept of first track.
    return tracks[0]?.concepts[0] ?? null;
  }, [missedTopics, progressRecords, tracks, conceptIndex]);

  const value: CourseData = {
    tracks,
    glossaryEntries,
    missedTopics,
    recentArtifacts,
    progressRecords,
    totals,
    continueConcept,
    error,
    loading,
    refresh
  };

  return <CourseDataContext.Provider value={value}>{children}</CourseDataContext.Provider>;
}

export function useCourseData(): CourseData {
  const value = useContext(CourseDataContext);
  if (!value) {
    throw new Error("useCourseData must be used inside <CourseDataProvider>");
  }
  return value;
}
```

- [ ] **Step 2c.5: Run and confirm the 3 selector tests PASS**

```bash
npm --prefix apps/web test -- CourseDataProvider 2>&1 | tail -10
```

Expected: all 3 assertions green.

### 2d. `SideNav` (TDD)

- [ ] **Step 2d.1: Write the failing test**

`apps/web/src/__tests__/SideNav.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SideNav } from "../shell/SideNav";

beforeEach(() => {
  window.localStorage.clear();
});

describe("SideNav", () => {
  it("renders one nav entry per primary screen", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    for (const label of ["Today", "Tracks", "Concept Map", "Concept", "Chat", "Glossary", "Artifacts", "Failures"]) {
      expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toBeInTheDocument();
    }
  });

  it("toggles collapsed state and persists it to localStorage", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBe("true");
  });
});
```

- [ ] **Step 2d.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- SideNav 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 2d.3: Implement**

`apps/web/src/shell/SideNav.tsx`:

```tsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  LayoutGrid,
  Network,
  BookOpen,
  MessageSquare,
  Library,
  Boxes,
  AlertOctagon,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "learn-llm.sidebar.collapsed";

interface NavEntry {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
}

const ENTRIES: NavEntry[] = [
  { to: "/",          label: "Today",       icon: CalendarDays, end: true },
  { to: "/tracks",    label: "Tracks",      icon: LayoutGrid },
  { to: "/concepts",  label: "Concept Map", icon: Network },
  { to: "/concepts/_open", label: "Concept", icon: BookOpen },
  { to: "/chat",      label: "Chat",        icon: MessageSquare },
  { to: "/glossary",  label: "Glossary",    icon: Library },
  { to: "/artifacts", label: "Artifacts",   icon: Boxes },
  { to: "/failures",  label: "Failures",    icon: AlertOctagon }
];

export function SideNav() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex flex-col justify-between border-r border-border-subtle bg-bg-surface",
        "transition-[width] duration-base ease-out",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <ul className="flex flex-col gap-1 p-2">
        {ENTRIES.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2",
                  "text-[14px] leading-[20px] text-text-muted hover:text-text-primary hover:bg-bg-elevated",
                  "border-l border-transparent",
                  isActive && "bg-accent-quiet text-accent border-accent"
                )
              }
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {collapsed ? null : <span>{label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed((value) => !value)}
        className={cn(
          "m-2 flex items-center gap-2 rounded-md px-3 py-2",
          "text-[13px] leading-[16px] text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {collapsed ? null : <span>Collapse</span>}
      </button>
    </nav>
  );
}
```

Note on the "Concept" nav entry: it points at `/concepts/_open`, a placeholder route that does not exist. The intent is "go to the currently-active concept." In Task 3 we replace this entry's `to` with a function that reads `continueConcept` from `useCourseData()` and routes to `/concepts/<id>`. For now the entry is present but inert — the test only checks the link exists; it does not click it.

- [ ] **Step 2d.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- SideNav 2>&1 | tail -8
```

Expected: 2 assertions pass.

### 2e. `TopHeader` (minimal, no test of its own — covered by AppShell test)

- [ ] **Step 2e.1: Implement `apps/web/src/shell/TopHeader.tsx`**

```tsx
import { useCourseData } from "./CourseDataProvider";

export function TopHeader() {
  const { totals } = useCourseData();
  return (
    <header
      className="flex items-center justify-between h-14 px-6 border-b border-border-subtle bg-bg-surface"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-semibold text-text-primary">Learn LLM</span>
        <span className="text-[13px] text-text-muted">The Hard Way</span>
      </div>
      <div className="flex items-center gap-4">
        <span
          aria-label="Concepts completed"
          className="font-mono text-[13px] text-text-muted bg-bg-elevated border border-border-subtle rounded-sm px-2 py-0.5"
        >
          {totals.completedConceptCount} / {totals.conceptCount}
        </span>
      </div>
    </header>
  );
}
```

(No settings cog stub for v1 — keep header minimal. Spec mentions it as a future hook; we add it when it has a real purpose.)

### 2f. `AppShell` (TDD)

- [ ] **Step 2f.1: Write the failing test**

`apps/web/src/__tests__/AppShell.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import * as api from "../api";

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("AppShell", () => {
  it("renders header, sidebar, and the route outlet", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<p data-testid="route-content">home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId("route-content")).toBeInTheDocument());
    expect(screen.getByText(/Learn LLM/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Primary/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2f.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- AppShell 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 2f.3: Implement**

`apps/web/src/shell/AppShell.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { CourseDataProvider } from "./CourseDataProvider";
import { TopHeader } from "./TopHeader";
import { SideNav } from "./SideNav";

export function AppShell() {
  return (
    <CourseDataProvider>
      <div className="min-h-screen flex flex-col bg-bg-base text-text-primary">
        <TopHeader />
        <div className="flex-1 flex min-h-0">
          <SideNav />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
              <Outlet />
            </div>
          </main>
        </div>
        <Toaster richColors closeButton position="bottom-right" />
      </div>
    </CourseDataProvider>
  );
}
```

Note: shadcn's sonner primitive exports a `<Toaster>` component. If the actual export name in `apps/web/src/components/ui/sonner.tsx` differs (e.g. defaults to `Toaster` from `sonner` re-export), match the export there.

- [ ] **Step 2f.4: Run and confirm PASS**

```bash
npm --prefix apps/web test -- AppShell 2>&1 | tail -8
```

Expected: assertion passes.

### 2g. Temporary `LegacyDashboardRoute` (deleted in Task 3)

- [ ] **Step 2g.1: Implement `apps/web/src/screens/LegacyDashboardRoute.tsx`**

```tsx
import { Dashboard as LegacyDashboard } from "../components/Dashboard";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";

export function LegacyDashboardRoute() {
  const { tracks, missedTopics, recentArtifacts, continueConcept } = useCourseData();
  return (
    <>
      <MigrationBanner scheduledIn={2} note="Dashboard is being rebuilt in this same sub-project (Task 3)." />
      <LegacyDashboard
        tracks={tracks}
        selectedConceptId={continueConcept?.id ?? null}
        missedTopics={missedTopics}
        recentArtifacts={recentArtifacts}
        onSelectConcept={() => {
          /* Click-to-navigate happens in Task 3; legacy dashboard is read-only here. */
        }}
      />
    </>
  );
}
```

The banner notes that this dashboard is being rebuilt in this same sub-project so the staging is honest.

### 2h. Route wrappers for the remaining screens

We need lightweight wrapper components that pull data from `useCourseData()` and render the existing components, each preceded by a `MigrationBanner`.

- [ ] **Step 2h.1: Implement `apps/web/src/screens/RouteWrappers.tsx`**

```tsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ConceptMap } from "../components/ConceptMap";
import { ConceptWorkspace } from "../components/ConceptWorkspace";
import { ChatPlayground } from "../components/ChatPlayground";
import { GlossaryPanel } from "../components/GlossaryPanel";
import { ArtifactPreview } from "../components/ArtifactPreview";
import { FailureMuseum } from "../components/FailureMuseum";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";
import { runLab, submitCheckpoint, touchConcept } from "../api";

export function TracksRoute() {
  const { tracks } = useCourseData();
  const navigate = useNavigate();
  return (
    <>
      <MigrationBanner scheduledIn={4} />
      <ul className="space-y-2 font-mono text-[14px]">
        {tracks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="underline text-accent hover:text-accent-hover"
              onClick={() => navigate(`/concepts/${t.concepts[0]?.id ?? ""}`)}
            >
              {t.title} — {t.concepts.length} concepts
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ConceptMapRoute() {
  const { tracks, missedTopics } = useCourseData();
  const navigate = useNavigate();
  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((m) => m.conceptId)),
    [missedTopics]
  );
  return (
    <>
      <MigrationBanner scheduledIn={5} />
      <ConceptMap
        tracks={tracks}
        selectedConceptId={null}
        missedConceptIds={missedConceptIds}
        onSelectConcept={(concept) => navigate(`/concepts/${concept.id}`)}
      />
    </>
  );
}

export function ConceptRoute() {
  const { id } = useParams<{ id: string }>();
  const { tracks, glossaryEntries, refresh } = useCourseData();

  useEffect(() => {
    if (!id) return;
    void touchConcept(id).catch(() => {/* ignore — best-effort */});
  }, [id]);

  const concept = useMemo(() => {
    for (const t of tracks) {
      for (const c of t.concepts) if (c.id === id) return c;
    }
    return null;
  }, [tracks, id]);

  if (!concept) {
    return (
      <>
        <MigrationBanner scheduledIn={4} />
        <p>Concept not found.</p>
      </>
    );
  }
  return (
    <>
      <MigrationBanner scheduledIn={4} />
      <ConceptWorkspace
        concept={concept}
        glossaryEntries={glossaryEntries}
        onSubmitCheckpoint={async (conceptId, input) => {
          const attempt = await submitCheckpoint(conceptId, input);
          await refresh();
          return attempt;
        }}
        onRunLab={async (labId) => {
          const artifact = await runLab(labId);
          await refresh();
          return artifact;
        }}
      />
    </>
  );
}

export function ChatRoute() {
  return (
    <>
      <MigrationBanner scheduledIn={6} />
      <ChatPlayground />
    </>
  );
}

export function GlossaryRoute() {
  const { glossaryEntries } = useCourseData();
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <GlossaryPanel entries={glossaryEntries} />
    </>
  );
}

export function ArtifactsRoute() {
  const { recentArtifacts } = useCourseData();
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <ul className="space-y-1 font-mono text-[13px]">
        {recentArtifacts.map((a) => (
          <li key={a.artifactPath}>
            {a.labId} — <ArtifactPreview artifact={a} />
          </li>
        ))}
        {recentArtifacts.length === 0 ? <li>No artifacts yet.</li> : null}
      </ul>
    </>
  );
}

export function FailuresRoute() {
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <FailureMuseum />
    </>
  );
}
```

Note: this file is intentionally kept dense and "boring" — each wrapper is a few lines. They're temporary glue. In each later sub-project, the corresponding wrapper gets replaced or absorbed into the screen's own component.

If any of these existing components (e.g. `GlossaryPanel`, `FailureMuseum`, `ChatPlayground`) take **different** props than shown above, adjust the call to match the real signature — read the component file first. They keep their old props; we just feed them from the context instead of from `App.tsx`.

- [ ] **Step 2h.2: Verify build is clean**

```bash
npm --prefix apps/web run build 2>&1 | tail -6
```

Expected: clean. If a wrapper has a prop-type mismatch with the underlying component, fix it now by matching the existing signature.

### 2i. Route table

- [ ] **Step 2i.1: Implement `apps/web/src/routes.tsx`**

```tsx
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { LegacyDashboardRoute } from "./screens/LegacyDashboardRoute";
import {
  ArtifactsRoute,
  ChatRoute,
  ConceptMapRoute,
  ConceptRoute,
  FailuresRoute,
  GlossaryRoute,
  TracksRoute
} from "./screens/RouteWrappers";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LegacyDashboardRoute />} />
        <Route path="tracks"      element={<TracksRoute />} />
        <Route path="concepts"    element={<ConceptMapRoute />} />
        <Route path="concepts/:id" element={<ConceptRoute />} />
        <Route path="chat"        element={<ChatRoute />} />
        <Route path="glossary"    element={<GlossaryRoute />} />
        <Route path="artifacts"   element={<ArtifactsRoute />} />
        <Route path="failures"    element={<FailuresRoute />} />
      </Route>
    </Routes>
  );
}
```

### 2j. Rewrite `App.tsx`

- [ ] **Step 2j.1: Replace `apps/web/src/App.tsx` with the router version**

```tsx
import { BrowserRouter } from "react-router-dom";
import { FoundationShowcase } from "./components/FoundationShowcase";
import { AppRoutes } from "./routes";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/__foundation") {
    return <FoundationShowcase />;
  }
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```

The `/__foundation` bypass keeps the showcase rendering bare (no shell), as the spec requires.

### 2k. Update Playwright e2e selectors

The existing four e2e specs each open `http://127.0.0.1:5173/`, then click a concept button that lived in the old Dashboard sidebar. Now those buttons are gone; the route is `/concepts/:id`.

For each existing test, the simplest non-invasive update is to navigate directly to `/concepts/<id>` via `page.goto()` rather than clicking through the dashboard. The user journey *inside* the concept screen is unchanged.

- [ ] **Step 2k.1: Read each e2e spec to find its target concept**

```bash
grep -l "page.goto\|getByRole\|onSelectConcept" tests/e2e/*.spec.ts
sed -n '1,40p' tests/e2e/phase1-learning-path.spec.ts
sed -n '1,40p' tests/e2e/phase2-learning-core.spec.ts
sed -n '1,40p' tests/e2e/phase3-mini-llm.spec.ts
sed -n '1,40p' tests/e2e/phase4-chat-mechanics.spec.ts
```

(No code edit in this step — locate the existing target concept id and the existing first interaction so the rewrite is minimal.)

- [ ] **Step 2k.2: For each spec, replace the "navigate from dashboard" step with a direct `page.goto()`**

In each of the four spec files, find the block that currently:
1. Goes to `/`.
2. Clicks a concept button in the old Dashboard.

Replace those two lines with a single direct navigation. For example, in `phase1-learning-path.spec.ts`, if the test currently navigates to the `bytes-unicode` concept:

```ts
// OLD:
// await page.goto("/");
// await page.getByRole("button", { name: /Bytes & Unicode/ }).click();

// NEW:
await page.goto("/concepts/bytes-unicode");
```

Add a one-line comment above each replacement:

```ts
// App-shell sub-project: direct route nav replaces old-dashboard click-through.
```

Make the same replacement in:
- `tests/e2e/phase1-learning-path.spec.ts` — `bytes-unicode` (or the actual id the test uses).
- `tests/e2e/phase2-learning-core.spec.ts` — the math/vectors concept.
- `tests/e2e/phase3-mini-llm.spec.ts` — the attention concept.
- `tests/e2e/phase4-chat-mechanics.spec.ts` — either keep the dashboard step (if it asserts on chat-only flow already) or `page.goto("/chat")` then continue.

If a test relies on selecting a concept by name that you can't easily map to an id, run `grep "data-and-tokens\|math-for-models\|attention\|chat" content/concepts/*.json` to find the id.

- [ ] **Step 2k.3: Run e2e and confirm all 4 flows pass**

```bash
source .venv/bin/activate
npm run e2e 2>&1 | tail -8
```

Expected: 4 chromium flows pass. If a flow fails on something other than the navigation step, that's a real regression — STOP and report.

### 2l. Verify full suite and commit

- [ ] **Step 2l.1: Run all tests**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -3
```

Expected: labs 40, api 24, web ≥ 38 (30 baseline + new MigrationBanner/CourseDataProvider/SideNav/AppShell = 8 new tests), build clean, e2e 4.

- [ ] **Step 2l.2: Commit Task 2**

```bash
git add apps/web/package.json apps/web/package-lock.json \
        apps/web/src/shell/ apps/web/src/routes.tsx apps/web/src/App.tsx \
        apps/web/src/screens/LegacyDashboardRoute.tsx \
        apps/web/src/screens/RouteWrappers.tsx \
        apps/web/src/api.ts \
        apps/web/src/__tests__/AppShell.test.tsx \
        apps/web/src/__tests__/SideNav.test.tsx \
        apps/web/src/__tests__/MigrationBanner.test.tsx \
        apps/web/src/__tests__/CourseDataProvider.test.tsx \
        tests/e2e/
git commit -m "feat(web): app shell with sidebar + router + course-data provider

Adds react-router-dom@^6 and a left-sidebar app shell. CourseDataProvider
fetches once and feeds every screen via useCourseData(). All existing
screens are wrapped with MigrationBanner; the home route renders the
old Dashboard temporarily until Task 3 lands the polished one.
/__foundation route bypasses the shell.

e2e tests updated to navigate via routes instead of dashboard clicks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: New Dashboard + four section components

This task ships the polished Dashboard and retires `LegacyDashboardRoute`. The Dashboard reads from `useCourseData()` and uses the new motion helpers (`<Stagger>`, `<Reveal>`).

**Files:**
- Create: `apps/web/src/screens/Dashboard.tsx`
- Create: `apps/web/src/screens/dashboard/ContinueCard.tsx`
- Create: `apps/web/src/screens/dashboard/TrackProgressGrid.tsx`
- Create: `apps/web/src/screens/dashboard/MissedTopicsPanel.tsx`
- Create: `apps/web/src/screens/dashboard/RecentArtifactsPanel.tsx`
- Create: `apps/web/src/screens/dashboard/relativeTime.ts`
- Modify: `apps/web/src/routes.tsx` (swap LegacyDashboardRoute → Dashboard)
- Delete: `apps/web/src/screens/LegacyDashboardRoute.tsx`
- Delete: `apps/web/src/components/Dashboard.tsx` (the legacy sidebar component)
- Create: `apps/web/src/screens/__tests__/Dashboard.test.tsx`
- Create: `apps/web/src/screens/dashboard/__tests__/ContinueCard.test.tsx`
- Create: `apps/web/src/screens/dashboard/__tests__/TrackProgressGrid.test.tsx`
- Create: `apps/web/src/screens/dashboard/__tests__/MissedTopicsPanel.test.tsx`
- Create: `apps/web/src/screens/dashboard/__tests__/RecentArtifactsPanel.test.tsx`
- Create: `apps/web/src/screens/dashboard/__tests__/relativeTime.test.ts`

### 3a. Relative-time helper (TDD)

- [ ] **Step 3a.1: Write the failing test**

`apps/web/src/screens/dashboard/__tests__/relativeTime.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { relativeTime } from "../relativeTime";

describe("relativeTime", () => {
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns 'just now' under 60 seconds", () => {
    expect(relativeTime(new Date("2026-05-27T11:59:30Z"), now)).toBe("just now");
  });
  it("returns minutes for under one hour", () => {
    expect(relativeTime(new Date("2026-05-27T11:30:00Z"), now)).toBe("30 m ago");
  });
  it("returns hours for under one day", () => {
    expect(relativeTime(new Date("2026-05-27T09:00:00Z"), now)).toBe("3 h ago");
  });
  it("returns days for under one week", () => {
    expect(relativeTime(new Date("2026-05-25T12:00:00Z"), now)).toBe("2 d ago");
  });
  it("returns the ISO date for older entries", () => {
    expect(relativeTime(new Date("2026-04-01T12:00:00Z"), now)).toBe("2026-04-01");
  });
});
```

- [ ] **Step 3a.2: Run and confirm FAIL**

```bash
npm --prefix apps/web test -- relativeTime 2>&1 | tail -10
```

- [ ] **Step 3a.3: Implement**

`apps/web/src/screens/dashboard/relativeTime.ts`:

```ts
export function relativeTime(when: Date | string, now: Date = new Date()): string {
  const w = typeof when === "string" ? new Date(when) : when;
  const diffMs = now.getTime() - w.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  return w.toISOString().slice(0, 10);
}
```

- [ ] **Step 3a.4: Run and confirm PASS** — all 5 assertions.

### 3b. `ContinueCard` (TDD)

- [ ] **Step 3b.1: Write the failing test**

`apps/web/src/screens/dashboard/__tests__/ContinueCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ContinueCard } from "../ContinueCard";
import type { Concept, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode", summary: "Start at the lowest level." } as Concept,
    { id: "char-tokenizer", title: "Character Tokenizer", summary: "Why characters aren't enough." } as Concept
  ]
};

describe("ContinueCard", () => {
  it("renders the concept title, position eyebrow, and an open link", () => {
    render(
      <MemoryRouter>
        <ContinueCard concept={track.concepts[1]} tracks={[track]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Character Tokenizer/i })).toBeInTheDocument();
    expect(screen.getByText(/Concept 2 of 2 in Data and Tokens/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open concept/i }))
      .toHaveAttribute("href", "/concepts/char-tokenizer");
  });

  it("renders a 'Start the course' fallback when concept is null", () => {
    render(
      <MemoryRouter>
        <ContinueCard concept={null} tracks={[track]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Start the course/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start with Bytes/i }))
      .toHaveAttribute("href", "/concepts/bytes-unicode");
  });
});
```

- [ ] **Step 3b.2: Run and confirm FAIL**

- [ ] **Step 3b.3: Implement**

`apps/web/src/screens/dashboard/ContinueCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { Concept, Track } from "../../types";

interface ContinueCardProps {
  concept: Concept | null;
  tracks: Track[];
}

export function ContinueCard({ concept, tracks }: ContinueCardProps) {
  if (!concept) {
    const first = tracks[0]?.concepts[0];
    return (
      <Card className="bg-bg-surface border-l-4 border-accent" style={{ boxShadow: "var(--glow-accent)" }}>
        <CardHeader>
          <p className="text-[12px] uppercase tracking-wide text-text-muted">Today</p>
          <h2 className="text-[24px] leading-[32px] font-semibold">Start the course</h2>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted mb-4">Begin with the smallest piece. Build up.</p>
          {first ? (
            <Button asChild>
              <Link to={`/concepts/${first.id}`}>
                Start with {first.title} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const track = tracks.find((t) => t.concepts.some((c) => c.id === concept.id));
  const positionIndex = track?.concepts.findIndex((c) => c.id === concept.id) ?? 0;
  const trackTotal = track?.concepts.length ?? 0;

  return (
    <Card className={cn("bg-bg-surface border-l-4 border-accent")} style={{ boxShadow: "var(--glow-accent)" }}>
      <CardHeader>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">
          Concept {positionIndex + 1} of {trackTotal} in {track?.title ?? ""}
        </p>
        <h2 className="text-[24px] leading-[32px] font-semibold">{concept.title}</h2>
      </CardHeader>
      <CardContent>
        <p className="text-text-muted mb-4">{concept.summary ?? ""}</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to={`/concepts/${concept.id}`}>
              Open concept <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3b.4: Run and confirm PASS** — 2 assertions.

### 3c. `TrackProgressGrid` (TDD)

- [ ] **Step 3c.1: Write the failing test**

`apps/web/src/screens/dashboard/__tests__/TrackProgressGrid.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TrackProgressGrid } from "../TrackProgressGrid";
import type { Concept, ProgressRecord, Track } from "../../../types";

const concept = (id: string): Concept => ({ id, title: id } as Concept);

const tracks: Track[] = [
  { id: "data", title: "Data", summary: "", order: 1, concepts: [concept("a"), concept("b")] },
  { id: "math", title: "Math", summary: "", order: 2, concepts: [concept("c")] }
];

const completed: ProgressRecord[] = [
  { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
];

describe("TrackProgressGrid", () => {
  it("renders one tile per track with completed/total counts", () => {
    render(
      <MemoryRouter>
        <TrackProgressGrid tracks={tracks} progressRecords={completed} />
      </MemoryRouter>
    );
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("0 / 1")).toBeInTheDocument();
  });

  it("each tile links to /tracks/<id>", () => {
    render(
      <MemoryRouter>
        <TrackProgressGrid tracks={tracks} progressRecords={[]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Open Data/i })).toHaveAttribute("href", "/tracks");
  });
});
```

(Note: track links route to `/tracks` for v1 because we don't have a per-track page yet; the spec puts a per-track screen in sub-project 4. The link `name: /Open Data/i` matches the visible text "Open Data →".)

- [ ] **Step 3c.2: Run and confirm FAIL**

- [ ] **Step 3c.3: Implement**

`apps/web/src/screens/dashboard/TrackProgressGrid.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProgressRecord, Track } from "../../types";

interface TrackProgressGridProps {
  tracks: Track[];
  progressRecords: ProgressRecord[];
}

function completedCountFor(track: Track, records: ProgressRecord[]): number {
  const completeSet = new Set(records.filter((r) => r.status === "complete").map((r) => r.conceptId));
  return track.concepts.filter((c) => completeSet.has(c.id)).length;
}

export function TrackProgressGrid({ tracks, progressRecords }: TrackProgressGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {tracks.map((track) => {
        const completed = completedCountFor(track, progressRecords);
        const total = track.concepts.length;
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
        return (
          <Card key={track.id} className="bg-bg-surface">
            <CardHeader>
              <CardTitle className="text-[15px] leading-[22px]">{track.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={pct} className="mb-2" />
              <p className="font-mono text-[13px] text-text-muted">{completed} / {total}</p>
              <Link to="/tracks" className="text-[13px] text-accent hover:text-accent-hover">
                Open {track.title} →
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3c.4: Run and confirm PASS** — 2 assertions.

### 3d. `MissedTopicsPanel` (TDD)

- [ ] **Step 3d.1: Write the failing test**

`apps/web/src/screens/dashboard/__tests__/MissedTopicsPanel.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MissedTopicsPanel } from "../MissedTopicsPanel";

describe("MissedTopicsPanel", () => {
  it("renders the empty state when no missed topics", () => {
    render(<MemoryRouter><MissedTopicsPanel missedTopics={[]} /></MemoryRouter>);
    expect(screen.getByText(/haven't missed anything/i)).toBeInTheDocument();
  });

  it("renders each missed topic with its reason badge", () => {
    render(
      <MemoryRouter>
        <MissedTopicsPanel
          missedTopics={[
            { conceptId: "vectors", reason: "low-confidence" },
            { conceptId: "softmax", reason: "failed-checkpoint" }
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("vectors")).toBeInTheDocument();
    expect(screen.getByText("low-confidence")).toBeInTheDocument();
    expect(screen.getByText("softmax")).toBeInTheDocument();
    expect(screen.getByText("failed-checkpoint")).toBeInTheDocument();
  });

  it("View all link points to /concepts?filter=missed", () => {
    render(
      <MemoryRouter>
        <MissedTopicsPanel missedTopics={[{ conceptId: "x", reason: "low-confidence" }]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /View all/i }))
      .toHaveAttribute("href", "/concepts?filter=missed");
  });
});
```

- [ ] **Step 3d.2: Run and confirm FAIL**

- [ ] **Step 3d.3: Implement**

`apps/web/src/screens/dashboard/MissedTopicsPanel.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MissedTopic } from "../../types";

interface MissedTopicsPanelProps {
  missedTopics: MissedTopic[];
}

export function MissedTopicsPanel({ missedTopics }: MissedTopicsPanelProps) {
  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[17px] leading-[24px]">Missed topics</CardTitle>
      </CardHeader>
      <CardContent>
        {missedTopics.length === 0 ? (
          <p className="text-text-muted text-[14px] leading-[22px]">
            You haven&apos;t missed anything yet. Mistakes you mark go here so you can come back to them.
          </p>
        ) : (
          <ul className="space-y-2">
            {missedTopics.slice(0, 5).map((topic) => (
              <li key={`${topic.conceptId}-${topic.reason}`} className="flex items-center gap-3">
                <Badge variant="secondary">{topic.reason}</Badge>
                <Link
                  to={`/concepts/${topic.conceptId}`}
                  className="font-mono text-[14px] text-text-primary hover:text-accent"
                >
                  {topic.conceptId}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link to="/concepts?filter=missed" className="text-[13px] text-accent hover:text-accent-hover">
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3d.4: Run and confirm PASS** — 3 assertions.

### 3e. `RecentArtifactsPanel` (TDD)

- [ ] **Step 3e.1: Write the failing test**

`apps/web/src/screens/dashboard/__tests__/RecentArtifactsPanel.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecentArtifactsPanel } from "../RecentArtifactsPanel";

describe("RecentArtifactsPanel", () => {
  it("renders empty state", () => {
    render(<MemoryRouter><RecentArtifactsPanel artifacts={[]} now={new Date()} /></MemoryRouter>);
    expect(screen.getByText(/No lab artifacts yet/i)).toBeInTheDocument();
  });

  it("renders artifact rows with their lab id and a View all link", () => {
    render(
      <MemoryRouter>
        <RecentArtifactsPanel
          artifacts={[
            { labId: "bpe-train", conceptId: "bpe", artifactPath: "artifacts/bpe.json", status: "ok", error: "", createdAt: "2026-05-27T11:00:00Z" } as any
          ]}
          now={new Date("2026-05-27T12:00:00Z")}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/bpe-train/i)).toBeInTheDocument();
    expect(screen.getByText(/1 h ago/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/i })).toHaveAttribute("href", "/artifacts");
  });
});
```

- [ ] **Step 3e.2: Run and confirm FAIL**

- [ ] **Step 3e.3: Implement**

`apps/web/src/screens/dashboard/RecentArtifactsPanel.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "./relativeTime";
import type { LabRunArtifact } from "../../types";

interface RecentArtifactsPanelProps {
  artifacts: Array<LabRunArtifact & { createdAt?: string }>;
  now?: Date;
}

export function RecentArtifactsPanel({ artifacts, now }: RecentArtifactsPanelProps) {
  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[17px] leading-[24px]">Recent artifacts</CardTitle>
      </CardHeader>
      <CardContent>
        {artifacts.length === 0 ? (
          <p className="text-text-muted text-[14px] leading-[22px]">
            No lab artifacts yet. Run a lab and its output will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {artifacts.slice(0, 5).map((a) => (
              <li key={a.artifactPath} className="flex items-center justify-between gap-3">
                <span className="font-mono text-[14px] text-text-primary truncate">{a.labId}</span>
                <span className="font-mono text-[13px] text-text-muted shrink-0">
                  {a.createdAt ? relativeTime(a.createdAt, now) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link to="/artifacts" className="text-[13px] text-accent hover:text-accent-hover">
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

If the existing `LabRunArtifact` type does not yet include `createdAt`, leave the `& { createdAt?: string }` extension in place — the field is optional and the empty state covers the case where the API doesn't return it.

- [ ] **Step 3e.4: Run and confirm PASS** — 2 assertions.

### 3f. `Dashboard` (the screen)

- [ ] **Step 3f.1: Write the failing test**

`apps/web/src/screens/__tests__/Dashboard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseDataProvider } from "../../shell/CourseDataProvider";
import { Dashboard } from "../Dashboard";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode", summary: "Begin at the bottom." } as Concept
  ]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("Dashboard", () => {
  it("renders all four sections after data loads", async () => {
    render(
      <MemoryRouter>
        <CourseDataProvider>
          <Dashboard />
        </CourseDataProvider>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Bytes & Unicode/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: /Missed topics/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Recent artifacts/i })).toBeInTheDocument();
    expect(screen.getByText(/Data and Tokens/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3f.2: Run and confirm FAIL**

- [ ] **Step 3f.3: Implement**

`apps/web/src/screens/Dashboard.tsx`:

```tsx
import { useCourseData } from "../shell/CourseDataProvider";
import { Stagger, Reveal } from "@/lib/motion";
import { ContinueCard } from "./dashboard/ContinueCard";
import { TrackProgressGrid } from "./dashboard/TrackProgressGrid";
import { MissedTopicsPanel } from "./dashboard/MissedTopicsPanel";
import { RecentArtifactsPanel } from "./dashboard/RecentArtifactsPanel";

export function Dashboard() {
  const { tracks, missedTopics, recentArtifacts, progressRecords, continueConcept, totals, loading } =
    useCourseData();

  if (loading) {
    return <p className="text-text-muted">Loading…</p>;
  }

  return (
    <Stagger className="space-y-8">
      <Reveal>
        <header>
          <p className="text-[12px] uppercase tracking-wide text-text-muted">Today</p>
          <h1 className="text-[28px] leading-[36px] font-semibold">Welcome back.</h1>
          <p className="text-text-muted">
            {totals.completedConceptCount} of {totals.conceptCount} concepts complete
            {missedTopics.length > 0 ? <> · {missedTopics.length} missed</> : null}.
          </p>
        </header>
      </Reveal>

      <Reveal>
        <ContinueCard concept={continueConcept} tracks={tracks} />
      </Reveal>

      <Reveal>
        <TrackProgressGrid tracks={tracks} progressRecords={progressRecords} />
      </Reveal>

      <Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          <MissedTopicsPanel missedTopics={missedTopics} />
          <RecentArtifactsPanel artifacts={recentArtifacts} />
        </div>
      </Reveal>
    </Stagger>
  );
}
```

- [ ] **Step 3f.4: Run and confirm PASS** — all 4 assertions.

### 3g. Swap LegacyDashboardRoute → Dashboard, delete dead code

- [ ] **Step 3g.1: Update `apps/web/src/routes.tsx`**

Replace the `<LegacyDashboardRoute />` import and route element with the new Dashboard:

```tsx
import { Dashboard } from "./screens/Dashboard";
// ...remove the LegacyDashboardRoute import

// Inside <Routes>:
<Route index element={<Dashboard />} />
```

- [ ] **Step 3g.2: Delete `apps/web/src/screens/LegacyDashboardRoute.tsx`**

```bash
rm apps/web/src/screens/LegacyDashboardRoute.tsx
```

- [ ] **Step 3g.3: Delete `apps/web/src/components/Dashboard.tsx`**

The legacy dashboard component is no longer used.

```bash
rm apps/web/src/components/Dashboard.tsx
```

- [ ] **Step 3g.4: Delete the test that exercised the legacy Dashboard**

```bash
rm apps/web/src/__tests__/Dashboard.test.tsx
```

(The new Dashboard has its own test at `apps/web/src/screens/__tests__/Dashboard.test.tsx`. The old one tested the legacy component and is no longer relevant.)

- [ ] **Step 3g.5: Verify everything still builds and passes**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -5
npm run e2e 2>&1 | tail -3
```

Expected: build clean; web tests pass (count rises by ~6 from the new dashboard tests, falls by 1 from the deleted legacy test); e2e flows pass.

### 3h. Commit Task 3

- [ ] **Step 3h.1: Commit**

```bash
git add apps/web/src/screens/Dashboard.tsx \
        apps/web/src/screens/dashboard/ \
        apps/web/src/routes.tsx \
        apps/web/src/screens/__tests__/Dashboard.test.tsx
git add -u apps/web/src/screens/LegacyDashboardRoute.tsx \
            apps/web/src/components/Dashboard.tsx \
            apps/web/src/__tests__/Dashboard.test.tsx
git commit -m "feat(web): polished Dashboard with four sections + touchConcept

Dashboard reads from useCourseData(): Continue hero, track progress grid,
missed topics, recent artifacts. Concept routes call touchConcept on
mount so the Continue selector tracks 'what you were just reading.'
LegacyDashboardRoute + legacy components/Dashboard removed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Polish + final gate

**Files:**
- Modify: `apps/web/src/screens/Dashboard.tsx` (one-line reduced-motion is already handled by Stagger/Reveal; only verify here).
- Modify: `apps/web/src/shell/SideNav.tsx` (active-concept link for the Concept nav row).

### 4a. Wire SideNav "Concept" entry to the current concept

The SideNav's "Concept" row currently points at a placeholder `/concepts/_open`. Now that `useCourseData()` is mounted above SideNav, we can route to the live concept.

- [ ] **Step 4a.1: Replace the placeholder entry**

In `apps/web/src/shell/SideNav.tsx`, remove the hardcoded `/concepts/_open` entry from `ENTRIES` and render it dynamically using `useCourseData()`:

```tsx
import { useCourseData } from "./CourseDataProvider";

// Inside SideNav():
const { continueConcept } = useCourseData();
const conceptHref = continueConcept ? `/concepts/${continueConcept.id}` : null;
```

Then in the rendered list, after the existing `ENTRIES.map(...)`, inject an extra `<li>` for the concept row when `conceptHref` exists. The cleanest refactor is to drop the static `/concepts/_open` from `ENTRIES` and render the row right after Concept Map:

```tsx
{conceptHref ? (
  <li>
    <NavLink to={conceptHref} className={/* same classes as the other links */}>
      <BookOpen aria-hidden className="h-4 w-4 shrink-0" />
      {collapsed ? null : <span>Concept</span>}
    </NavLink>
  </li>
) : null}
```

- [ ] **Step 4a.2: Update the SideNav test**

The earlier test asserted on the Concept link's presence unconditionally. Now the link only appears when `continueConcept` exists. Update the test to render `<CourseDataProvider>` with mocked data so a concept is present, OR drop the "Concept" assertion from the test (acceptable since the entry is no longer in the static list).

The simpler change: keep the existing test asserting on the 7 static entries (Today, Tracks, Concept Map, Chat, Glossary, Artifacts, Failures) and remove the "Concept" assertion. The dynamic concept row is covered indirectly by the AppShell + Dashboard integration.

Edit `apps/web/src/__tests__/SideNav.test.tsx`:

```tsx
for (const label of ["Today", "Tracks", "Concept Map", "Chat", "Glossary", "Artifacts", "Failures"]) {
  expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toBeInTheDocument();
}
```

- [ ] **Step 4a.3: Verify**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: all tests pass; build clean.

### 4b. Manual dev-server smoke test

- [ ] **Step 4b.1: Start both servers and probe every route**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-final.log 2>&1 &
sleep 3
npm run web:dev > /tmp/web-final.log 2>&1 &
sleep 5
for path in / /tracks /concepts /concepts/bytes-unicode /chat /glossary /artifacts /failures /__foundation; do
  curl -sS -o /dev/null -w "$path -> HTTP %{http_code}\n" "http://127.0.0.1:5173$path"
done
curl -sS -o /dev/null -w "api/health -> HTTP %{http_code}\n" http://127.0.0.1:8000/health
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
```

Expected: all paths return HTTP 200.

### 4c. Final test gate

- [ ] **Step 4c.1: Run every suite once more**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected:
- labs: 40 passed.
- api: 24 passed (22 baseline + 2 new).
- web: roughly 50 passed (30 baseline + ~20 new from this sub-project).
- build: clean.
- e2e: 4 chromium flows pass.

### 4d. Commit + hand-off

- [ ] **Step 4d.1: Commit the polish**

```bash
git add apps/web/src/shell/SideNav.tsx apps/web/src/__tests__/SideNav.test.tsx
git diff --cached --stat
git commit -m "polish(web): dynamic Concept sidebar entry follows the active concept

SideNav's 'Concept' row now resolves to the current continueConcept via
useCourseData(), so the sidebar always points at where the learner is.
SideNav test adjusted to match the new dynamic entry behaviour.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4d.2: Hand off**

Stop here. Do not push or open a PR without the user's explicit instruction. Report the commit list and test results.

```bash
git log --oneline main..HEAD
```
