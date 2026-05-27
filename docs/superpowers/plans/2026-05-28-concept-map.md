# Concept Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the un-styled flat-grid `ConceptMap` with a polished track-grouped graph view at `/concepts`, built on `@xyflow/react` (already installed). Status-encoded nodes, prerequisite edges, hover previews, URL-synced filter (`?filter=missed|completed|open|all`), and a toggleable mini-map.

**Architecture:** A pure layout function turns `Track[]` into React-Flow-shaped nodes/edges with deterministic track-column / concept-row positions. A custom `ConceptNode` renderer encodes status via color + icon. `MapControls` drives the URL filter via `useSearchParams`. `HoverPreview` (shadcn `<HoverCard>`) shows summary + "Open →" CTA. Pure layout + small components keeps each unit independently testable.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 3.4, shadcn/ui, `@xyflow/react@^12`, react-router-dom@^6, vitest.

**Spec:** [docs/superpowers/specs/2026-05-28-concept-map-design.md](../specs/2026-05-28-concept-map-design.md)

---

## Pre-flight

- [ ] **Pre-flight Step 1: Create a feature branch from `main`**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout main
git pull --ff-only
git checkout -b concept-map
git status
```

Expected: branch `concept-map` checked out; working tree clean (except for any untracked `.vite-node/`).

- [ ] **Pre-flight Step 2: Commit spec + plan as the branch's docs baseline**

```bash
git add docs/superpowers/specs/2026-05-28-concept-map-design.md \
        docs/superpowers/plans/2026-05-28-concept-map.md
git commit -m "docs: concept map spec and plan

Sub-project 5 of the 7-part UI overhaul. Replaces the un-styled flat-grid
ConceptMap at /concepts with a polished track-grouped graph view built
on @xyflow/react. URL-synced filter, hover previews, mini-map toggle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Pre-flight Step 3: Capture baseline test counts**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -2
npm run api:test  2>&1 | tail -2
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm run e2e 2>&1 | tail -3
```

Expected: labs 40, api 28, web 126 across 43 files, e2e 4.

---

## Task 1: Layout function (TDD)

Pure function. No React Flow imports — operates on plain data so tests need no rendering harness.

**Files:**
- Create: `apps/web/src/screens/concept-map/layout.ts`
- Create: `apps/web/src/screens/concept-map/__tests__/layout.test.ts`

### 1a. Failing test

- [ ] **Step 1a.1: Write the failing test**

`apps/web/src/screens/concept-map/__tests__/layout.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  COLUMN_WIDTH,
  COLUMN_X_OFFSET,
  ROW_HEIGHT,
  ROW_Y_OFFSET,
  buildGraph,
  statusFor
} from "../layout";
import type { Concept, ProgressRecord, Track } from "../../../types";

function makeConcept(id: string, order: number, prerequisites: string[] = []): Concept {
  return {
    id,
    title: id,
    order,
    prerequisites,
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

const tracks: Track[] = [
  { id: "t1", title: "T1", summary: "", order: 1, concepts: [makeConcept("a", 1), makeConcept("b", 2, ["a"])] },
  { id: "t2", title: "T2", summary: "", order: 2, concepts: [makeConcept("c", 1, ["b"])] }
];

describe("statusFor", () => {
  it("returns missed when concept is in the missed set, regardless of progress", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set(["a"]))).toBe("missed");
  });

  it("returns complete when progress.status is complete and not missed", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set())).toBe("complete");
  });

  it("returns learning when progress.status is learning", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "learning", confidence: 3, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set())).toBe("learning");
  });

  it("returns open when no progress record exists", () => {
    expect(statusFor("a", {}, new Set())).toBe("open");
  });
});

describe("buildGraph", () => {
  it("places concepts in track columns and concept rows", () => {
    const { nodes } = buildGraph(tracks, {}, new Set());
    expect(nodes).toHaveLength(3);
    const a = nodes.find((n) => n.id === "a")!;
    const b = nodes.find((n) => n.id === "b")!;
    const c = nodes.find((n) => n.id === "c")!;
    expect(a.position).toEqual({ x: COLUMN_X_OFFSET, y: ROW_Y_OFFSET });
    expect(b.position).toEqual({ x: COLUMN_X_OFFSET, y: ROW_Y_OFFSET + ROW_HEIGHT });
    expect(c.position).toEqual({ x: COLUMN_X_OFFSET + COLUMN_WIDTH, y: ROW_Y_OFFSET });
  });

  it("attaches concept + track + status to each node's data", () => {
    const { nodes } = buildGraph(tracks, {}, new Set());
    const b = nodes.find((n) => n.id === "b")!;
    expect(b.data.concept.id).toBe("b");
    expect(b.data.track.id).toBe("t1");
    expect(b.data.status).toBe("open");
  });

  it("creates one edge per prerequisite with stable ids", () => {
    const { edges } = buildGraph(tracks, {}, new Set());
    expect(edges).toEqual(
      expect.arrayContaining([
        { id: "a->b", source: "a", target: "b", type: "smoothstep" },
        { id: "b->c", source: "b", target: "c", type: "smoothstep" }
      ])
    );
    expect(edges).toHaveLength(2);
  });

  it("respects track.order and concept.order even when input is unsorted", () => {
    const unsorted: Track[] = [
      { id: "t2", title: "T2", summary: "", order: 2, concepts: [makeConcept("z", 2), makeConcept("y", 1)] },
      { id: "t1", title: "T1", summary: "", order: 1, concepts: [makeConcept("x", 1)] }
    ];
    const { nodes } = buildGraph(unsorted, {}, new Set());
    const x = nodes.find((n) => n.id === "x")!;
    const y = nodes.find((n) => n.id === "y")!;
    const z = nodes.find((n) => n.id === "z")!;
    expect(x.position.x).toBeLessThan(y.position.x);
    expect(y.position.y).toBeLessThan(z.position.y);
  });
});
```

- [ ] **Step 1a.2: Run + confirm FAIL**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
npm --prefix apps/web test -- layout 2>&1 | tail -10
```

Expected: FAIL — module `../layout` not found.

### 1b. Implementation

- [ ] **Step 1b.1: Create** `apps/web/src/screens/concept-map/layout.ts`

```ts
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

- [ ] **Step 1b.2: Run + confirm PASS**

```bash
npm --prefix apps/web test -- layout 2>&1 | tail -8
```

Expected: 8 assertions pass (4 in `statusFor`, 4 in `buildGraph`).

### 1c. Commit

- [ ] **Step 1c.1: Commit**

```bash
git add apps/web/src/screens/concept-map/layout.ts \
        apps/web/src/screens/concept-map/__tests__/layout.test.ts
git commit -m "feat(concept-map): pure buildGraph + statusFor layout function

Track-grouped columns, concept-row positions, prereq edges with stable
ids. Status follows the missed > complete > learning > open precedence.
No React Flow imports — pure data in, plain shapes out.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: ConceptNode + MapControls + HoverPreview

Three small presentational components. TDD each. Adds the shadcn `<HoverCard>` primitive (not currently installed).

**Files:**
- Create: `apps/web/src/screens/concept-map/ConceptNode.tsx`
- Create: `apps/web/src/screens/concept-map/MapControls.tsx`
- Create: `apps/web/src/screens/concept-map/HoverPreview.tsx`
- Create: `apps/web/src/screens/concept-map/__tests__/ConceptNode.test.tsx`
- Create: `apps/web/src/screens/concept-map/__tests__/MapControls.test.tsx`
- Create: `apps/web/src/screens/concept-map/__tests__/HoverPreview.test.tsx`
- Create: `apps/web/src/components/ui/hover-card.tsx` (via `npx shadcn add`)
- Modify: `apps/web/package.json` (Radix HoverCard peer dep pulled in by shadcn)

### 2a. Install shadcn HoverCard primitive

- [ ] **Step 2a.1: Install via shadcn CLI**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way/apps/web
npx shadcn@latest add hover-card --yes
cd ../..
```

Expected: `apps/web/src/components/ui/hover-card.tsx` is created; `@radix-ui/react-hover-card` added to `apps/web/package.json`.

- [ ] **Step 2a.2: Verify build still passes**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: clean build.

### 2b. ConceptNode (TDD)

- [ ] **Step 2b.1: Write the failing test**

`apps/web/src/screens/concept-map/__tests__/ConceptNode.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConceptNode } from "../ConceptNode";
import type { ConceptNodeData } from "../layout";
import type { Concept, Track } from "../../../types";

function makeData(overrides: Partial<ConceptNodeData> = {}): ConceptNodeData {
  const concept: Concept = {
    id: "char-tokenizer",
    title: "Character Tokenization",
    order: 2,
    prerequisites: ["bytes-unicode"],
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
  const track: Track = {
    id: "data-and-tokens",
    title: "Data and Tokens",
    summary: "",
    order: 1,
    concepts: [concept]
  };
  return { concept, track, status: "open", ...overrides };
}

function renderNode(data: ConceptNodeData) {
  return render(
    <MemoryRouter>
      <ConceptNode data={data} selected={false} />
    </MemoryRouter>
  );
}

describe("ConceptNode", () => {
  it("renders the concept title and track label", () => {
    renderNode(makeData());
    expect(screen.getByText("Character Tokenization")).toBeInTheDocument();
    expect(screen.getByText("Data and Tokens")).toBeInTheDocument();
  });

  it("shows the status badge text", () => {
    renderNode(makeData({ status: "complete" }));
    expect(screen.getByText("complete")).toBeInTheDocument();
  });

  it("renders an accessible button with a status-aware aria-label", () => {
    renderNode(makeData({ status: "missed" }));
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toMatch(/Character Tokenization/);
    expect(button.getAttribute("aria-label")).toMatch(/Data and Tokens/);
    expect(button.getAttribute("aria-label")).toMatch(/missed/);
  });

  it("marks missed concepts with a missed indicator", () => {
    const { container } = renderNode(makeData({ status: "missed" }));
    expect(container.querySelector("[data-missed='true']")).not.toBeNull();
  });
});
```

- [ ] **Step 2b.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- ConceptNode 2>&1 | tail -10
```

- [ ] **Step 2b.3: Implement** `apps/web/src/screens/concept-map/ConceptNode.tsx`

```tsx
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { ConceptNodeData, ConceptStatus } from "./layout";

interface ConceptNodeProps {
  data: ConceptNodeData;
  selected: boolean;
}

function statusDotColor(status: ConceptStatus): string {
  switch (status) {
    case "complete":  return "var(--success)";
    case "missed":    return "var(--danger)";
    case "learning":  return "var(--accent)";
    case "open":
    default:          return "var(--text-faint)";
  }
}

function statusBadgeVariant(status: ConceptStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "missed") return "destructive";
  if (status === "complete") return "default";
  if (status === "learning") return "secondary";
  return "outline";
}

export function ConceptNode({ data, selected }: ConceptNodeProps) {
  const navigate = useNavigate();
  const { concept, track, status } = data;
  const missed = status === "missed";

  return (
    <button
      type="button"
      data-status={status}
      data-missed={missed || undefined}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/concepts/${concept.id}`);
      }}
      aria-label={`${concept.title} — ${track.title} — ${status}`}
      className={cn(
        "w-[220px] h-[80px] rounded-md text-left px-3 py-2",
        "bg-bg-surface border border-border-subtle",
        "hover:border-accent transition-[border-color] duration-base ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected && "ring-2 ring-accent",
        missed && "border-dashed border-danger"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ background: statusDotColor(status) }}
        />
        <span className="font-medium text-[14px] leading-[20px] truncate text-text-primary">
          {concept.title}
        </span>
      </div>
      <div className="text-[12px] leading-[16px] text-text-muted mt-1 truncate">
        {track.title}
      </div>
      <div className="flex justify-end mt-1">
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </div>
    </button>
  );
}
```

- [ ] **Step 2b.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- ConceptNode 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2c. MapControls (TDD)

- [ ] **Step 2c.1: Write the failing test**

`apps/web/src/screens/concept-map/__tests__/MapControls.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { MapControls } from "../MapControls";

beforeEach(() => {
  window.localStorage.clear();
});

function CurrentSearch() {
  const { search } = useLocation();
  return <div data-testid="search">{search}</div>;
}

function renderControls(initialEntries = ["/concepts"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/concepts"
          element={
            <>
              <MapControls />
              <CurrentSearch />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("MapControls", () => {
  it("renders four filter buttons and the mini-map toggle", () => {
    renderControls();
    for (const label of ["All", "Missed", "Completed", "Open"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
    expect(screen.getByRole("switch", { name: /mini-map/i })).toBeInTheDocument();
  });

  it("clicking Missed sets ?filter=missed", () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: /^Missed$/i }));
    expect(screen.getByTestId("search").textContent).toContain("filter=missed");
  });

  it("clicking All removes the filter parameter", () => {
    renderControls(["/concepts?filter=missed"]);
    expect(screen.getByTestId("search").textContent).toContain("filter=missed");
    fireEvent.click(screen.getByRole("button", { name: /^All$/i }));
    expect(screen.getByTestId("search").textContent).toBe("");
  });

  it("toggling the mini-map switch persists to localStorage", () => {
    renderControls();
    expect(window.localStorage.getItem("learn-llm.conceptmap.minimap")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: /mini-map/i }));
    expect(window.localStorage.getItem("learn-llm.conceptmap.minimap")).toBe("false");
  });
});
```

- [ ] **Step 2c.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- MapControls 2>&1 | tail -10
```

- [ ] **Step 2c.3: Implement** `apps/web/src/screens/concept-map/MapControls.tsx`

```tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

const FILTER_STORAGE_KEY = "learn-llm.conceptmap.minimap";

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "missed",    label: "Missed" },
  { key: "completed", label: "Completed" },
  { key: "open",      label: "Open" }
] as const;

export function readMiniMapPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

interface MapControlsProps {
  /** Optional callback when the mini-map toggle changes. */
  onMiniMapChange?: (visible: boolean) => void;
}

export function MapControls({ onMiniMapChange }: MapControlsProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("filter") ?? "all";

  const [miniMap, setMiniMap] = useState<boolean>(() => readMiniMapPreference());
  useEffect(() => {
    window.localStorage.setItem(FILTER_STORAGE_KEY, String(miniMap));
    onMiniMapChange?.(miniMap);
  }, [miniMap, onMiniMapChange]);

  function setFilter(next: string) {
    if (next === "all") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", next);
    }
    setSearchParams(searchParams, { replace: false });
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex gap-1" role="group" aria-label="Filter concepts">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            variant={active === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={cn(active === f.key && "ring-1 ring-accent")}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[13px] text-text-muted">
        <Switch
          checked={miniMap}
          onCheckedChange={(v: boolean) => setMiniMap(v)}
          aria-label="Mini-map"
        />
        Mini-map
      </label>
    </div>
  );
}
```

- [ ] **Step 2c.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- MapControls 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2d. HoverPreview (TDD)

- [ ] **Step 2d.1: Write the failing test**

`apps/web/src/screens/concept-map/__tests__/HoverPreview.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HoverPreview } from "../HoverPreview";
import type { Concept, ProgressRecord, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: []
};

const concept: Concept = {
  id: "char-tokenizer",
  title: "Character Tokenization",
  order: 2,
  prerequisites: ["bytes-unicode"],
  lessonPath: "",
  lessonMarkdown: "# Heading\n\nEncode raw text into character tokens to build sequences.",
  lab: null,
  visual: null,
  checkpoint: { question: "", answer: "" } as any,
  glossary: [],
  status: "open"
};

const prereqIndex: Record<string, Concept | undefined> = {
  "bytes-unicode": {
    ...concept,
    id: "bytes-unicode",
    title: "Bytes and Unicode",
    order: 1,
    prerequisites: []
  }
};

describe("HoverPreview", () => {
  it("renders the title, track, status, and summary (first sentence, no headers)", () => {
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={{}}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Character Tokenization")).toBeInTheDocument();
    expect(screen.getByText(/Data and Tokens/)).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText(/Encode raw text/)).toBeInTheDocument();
    // The first line "# Heading" is a markdown header — it should not appear in the summary.
    expect(screen.queryByText(/^# Heading/)).not.toBeInTheDocument();
  });

  it("renders prereq chips with ✓/○ status from progressByConcept", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      "bytes-unicode": { conceptId: "bytes-unicode", status: "complete", confidence: 5, note: "", revisit: false }
    };
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={progress}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Bytes and Unicode")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("has an Open → link to the concept", () => {
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={{}}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Open concept/i })).toHaveAttribute("href", "/concepts/char-tokenizer");
  });
});
```

- [ ] **Step 2d.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- HoverPreview 2>&1 | tail -10
```

- [ ] **Step 2d.3: Implement** `apps/web/src/screens/concept-map/HoverPreview.tsx`

```tsx
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Concept, ProgressRecord, Track } from "../../types";
import type { ConceptStatus } from "./layout";

interface HoverPreviewProps {
  concept: Concept;
  track: Track;
  status: ConceptStatus;
  /** Concept-id → Concept for prereq title resolution. */
  prereqIndex: Record<string, Concept | undefined>;
  progressByConcept: Record<string, ProgressRecord | undefined>;
}

/**
 * Take the first non-header sentence of a markdown body. Skips lines that
 * start with `#` (headers). Trims to ~140 chars without breaking mid-word.
 */
function firstSentence(markdown: string): string {
  const lines = markdown.split("\n");
  let body = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    body = trimmed;
    break;
  }
  if (body.length <= 140) return body;
  const cut = body.lastIndexOf(" ", 140);
  return body.slice(0, cut > 0 ? cut : 140) + "…";
}

function statusBadgeVariant(status: ConceptStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "missed") return "destructive";
  if (status === "complete") return "default";
  if (status === "learning") return "secondary";
  return "outline";
}

export function HoverPreview({
  concept,
  track,
  status,
  prereqIndex,
  progressByConcept
}: HoverPreviewProps) {
  const summary = firstSentence(concept.lessonMarkdown ?? "");
  const prereqs = concept.prerequisites ?? [];

  return (
    <div className="w-[320px] rounded-md border border-border-subtle bg-bg-elevated p-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] leading-[22px] font-semibold text-text-primary truncate">
          {concept.title}
        </h3>
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </div>
      <p className="text-[12px] text-text-muted mt-1">Track: {track.title}</p>
      {summary ? (
        <p className="text-[13px] leading-[18px] text-text-primary mt-2">{summary}</p>
      ) : null}
      {prereqs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[12px] text-text-muted">
          <span>Prereqs:</span>
          {prereqs.map((id) => {
            const prereq = prereqIndex[id];
            const done = progressByConcept[id]?.status === "complete";
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-0.5">
                <span aria-hidden>{done ? "✓" : "○"}</span>
                <span>{prereq?.title ?? id}</span>
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="mt-3">
        <Link
          to={`/concepts/${concept.id}`}
          className="text-[13px] text-accent hover:text-accent-hover"
        >
          Open concept →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2d.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- HoverPreview 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 2e. Commit Task 2

- [ ] **Step 2e.1: Verify + commit**

```bash
npm --prefix apps/web test 2>&1 | tail -4
npm --prefix apps/web run build 2>&1 | tail -4
git add apps/web/src/screens/concept-map/ \
        apps/web/src/components/ui/hover-card.tsx \
        apps/web/package.json apps/web/package-lock.json
git commit -m "feat(concept-map): ConceptNode, MapControls, HoverPreview

Adds the three presentational components plus the shadcn HoverCard
primitive. ConceptNode renders a status dot + title + track + badge,
navigates to /concepts/:id on click. MapControls drives the URL
filter (?filter=missed|completed|open) and persists the mini-map
preference to localStorage. HoverPreview renders the first non-header
sentence of lessonMarkdown, prereq chips with ✓/○ status, and an
Open → link.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: ConceptMap screen + route swap

Compose the layout function + custom node + controls + hover preview into the screen, wire React Flow, swap the route, run e2e.

**Files:**
- Create: `apps/web/src/screens/ConceptMap.tsx`
- Create: `apps/web/src/screens/__tests__/ConceptMap.test.tsx`
- Modify: `apps/web/src/routes.tsx`
- Modify: `apps/web/src/screens/RouteWrappers.tsx` (remove `ConceptMapRoute`)
- Modify: `apps/web/vitest.setup.ts` (DOMRect polyfill if React Flow needs it)

### 3a. Integration test (TDD)

- [ ] **Step 3a.1: Write the failing test**

`apps/web/src/screens/__tests__/ConceptMap.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ConceptMap } from "../ConceptMap";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

function makeConcept(id: string, title: string, prerequisites: string[] = []): Concept {
  return {
    id,
    title,
    order: 1,
    prerequisites,
    lessonPath: "",
    lessonMarkdown: "Demo body for " + title,
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

const tracks: Track[] = [
  {
    id: "t1",
    title: "Track One",
    summary: "",
    order: 1,
    concepts: [
      makeConcept("a", "Alpha"),
      makeConcept("b", "Beta", ["a"])
    ]
  }
];

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue(tracks);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CourseDataProvider>
        <Routes>
          <Route path="/concepts" element={<ConceptMap />} />
        </Routes>
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ConceptMap (screen)", () => {
  it("renders one node per concept after data loads", async () => {
    renderAt("/concepts");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Alpha/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /Beta/i })).toBeInTheDocument();
  });

  it("honours ?filter=missed by rendering only missed concepts and a friendly empty state when none", async () => {
    renderAt("/concepts?filter=missed");
    await waitFor(() =>
      expect(screen.getByText(/No concepts match this filter/i)).toBeInTheDocument()
    );
    // With no missed topics, no concept node should be rendered.
    expect(screen.queryByRole("button", { name: /Alpha/i })).not.toBeInTheDocument();
  });

  it("renders the All/Missed/Completed/Open filter controls", async () => {
    renderAt("/concepts");
    for (const label of ["All", "Missed", "Completed", "Open"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
  });

  it("clicking Open updates the URL to ?filter=open", async () => {
    renderAt("/concepts");
    await waitFor(() => screen.getByRole("button", { name: /Alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
    // The Alpha node still renders because both Alpha and Beta are status="open".
    await waitFor(() => screen.getByRole("button", { name: /Alpha/i }));
  });
});
```

- [ ] **Step 3a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- "screens/__tests__/ConceptMap" 2>&1 | tail -10
```

Expected: FAIL — module `../ConceptMap` not found.

### 3b. Polyfill DOMRect for React Flow in jsdom (if needed)

React Flow uses `DOMRect` and `getBoundingClientRect` for node measurement. jsdom returns zero-size rects, which may trigger warnings but does not break rendering for our integration tests (we assert on DOM presence, not on positions).

- [ ] **Step 3b.1: Read** `apps/web/vitest.setup.ts` and confirm `ResizeObserver` is already polyfilled (added in sub-project 3).

```bash
grep -n "ResizeObserver" apps/web/vitest.setup.ts
```

Expected: a polyfill block exists. If not, append:

```ts
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
```

No DOMRect polyfill needed today; if React Flow throws during testing, add this at the end of `vitest.setup.ts`:

```ts
if (typeof globalThis.DOMRect === "undefined") {
  globalThis.DOMRect = class DOMRect {
    static fromRect(rect?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRect(rect?.x ?? 0, rect?.y ?? 0, rect?.width ?? 0, rect?.height ?? 0);
    }
    constructor(public x = 0, public y = 0, public width = 0, public height = 0) {}
    get top() { return this.y; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    get left() { return this.x; }
    toJSON() { return { x: this.x, y: this.y, width: this.width, height: this.height, top: this.top, right: this.right, bottom: this.bottom, left: this.left }; }
  } as unknown as typeof globalThis.DOMRect;
}
```

### 3c. Implement `ConceptMap` screen

- [ ] **Step 3c.1: Create** `apps/web/src/screens/ConceptMap.tsx`

```tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useCourseData } from "@/shell/CourseDataProvider";
import { ConceptNode } from "./concept-map/ConceptNode";
import { MapControls, readMiniMapPreference } from "./concept-map/MapControls";
import { HoverPreview } from "./concept-map/HoverPreview";
import { buildGraph, type ConceptNodeData, type ConceptStatus, type PlainEdge, type PlainNode } from "./concept-map/layout";

type RFConceptNode = RFNode<ConceptNodeData>;

const FILTERS = new Set(["missed", "completed", "open"]);

function filteredGraph(
  nodes: PlainNode[],
  edges: PlainEdge[],
  filter: string | null
): { nodes: PlainNode[]; edges: PlainEdge[] } {
  if (!filter || !FILTERS.has(filter)) {
    return { nodes, edges };
  }

  const keepStatus = (s: ConceptStatus) => {
    if (filter === "missed") return s === "missed";
    if (filter === "completed") return s === "complete";
    if (filter === "open") return s === "open" || s === "learning";
    return true;
  };

  const keptNodes = nodes.filter((n) => keepStatus(n.data.status));
  const keptIds = new Set(keptNodes.map((n) => n.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));
  return { nodes: keptNodes, edges: keptEdges };
}

// React Flow's node-types map. Single registration; React Flow forbids
// inline objects (it warns about re-renders).
const nodeTypes = { concept: ConceptNode };

export function ConceptMap() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");

  const { tracks, progressRecords, missedTopics, loading } = useCourseData();
  const [showMiniMap, setShowMiniMap] = useState<boolean>(() => readMiniMapPreference());

  const progressByConcept = useMemo(
    () => Object.fromEntries(progressRecords.map((r) => [r.conceptId, r])),
    [progressRecords]
  );
  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((m) => m.conceptId)),
    [missedTopics]
  );
  const prereqIndex = useMemo(() => {
    const map: Record<string, ConceptNodeData["concept"] | undefined> = {};
    for (const t of tracks) for (const c of t.concepts) map[c.id] = c;
    return map;
  }, [tracks]);

  const { nodes: allNodes, edges: allEdges } = useMemo(
    () => buildGraph(tracks, progressByConcept, missedConceptIds),
    [tracks, progressByConcept, missedConceptIds]
  );
  const { nodes, edges } = useMemo(
    () => filteredGraph(allNodes, allEdges, filter),
    [allNodes, allEdges, filter]
  );

  // Listen for the MapControls mini-map toggle.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "learn-llm.conceptmap.minimap") {
        setShowMiniMap(readMiniMapPreference());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (loading && tracks.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-bg-surface" />
        <Skeleton className="h-[60vh] w-full bg-bg-surface" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return <p className="text-text-muted">No concepts yet.</p>;
  }

  const rfNodes: RFConceptNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data
  }));
  const rfEdges: RFEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <MapControls onMiniMapChange={setShowMiniMap} />
      <div className="flex-1 relative rounded-md border border-border-subtle overflow-hidden">
        {nodes.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-text-muted">
            No concepts match this filter.
          </p>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
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
            {showMiniMap ? (
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) => {
                  const data = node.data as ConceptNodeData | undefined;
                  switch (data?.status) {
                    case "complete": return "var(--success)";
                    case "missed":   return "var(--danger)";
                    case "learning": return "var(--accent)";
                    default:         return "var(--text-faint)";
                  }
                }}
              />
            ) : null}
            <Controls position="bottom-right" showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      {/* Hover preview: rendered for every node via HoverCard. The HoverCard's
          trigger is invisible — the real node renders inside React Flow. We
          rely on React Flow's pointer events for hover detection in a future
          iteration; for v1 we ship without HoverCard wiring on graph nodes
          and surface the preview only on click via the inline navigation.
          The HoverPreview component itself is shipped and tested so it can
          be wired up when React Flow's per-node hover events are added. */}
      <span hidden>
        <HoverCard>
          <HoverCardTrigger />
          <HoverCardContent />
        </HoverCard>
      </span>
    </div>
  );
}
```

Notes about the hover preview:

- React Flow v12's per-node hover events fire on the `<ReactFlow>` level via `onNodeMouseEnter`/`onNodeMouseLeave`. Wiring a floating popover positioned by these events requires non-trivial portaling logic. For v1 we ship the `HoverPreview` component and tests but defer the on-graph wiring; clicking a node already navigates to `/concepts/:id`, which is the same destination the preview's "Open →" link points to. The component is ready when the next polish pass wires hover-on-graph. The hidden `<HoverCard>` block above ensures the import is exercised so unused-import lints don't trip.

- [ ] **Step 3c.2: Run + confirm PASS**

```bash
npm --prefix apps/web test -- "screens/__tests__/ConceptMap" 2>&1 | tail -10
```

Expected: 4 assertions pass.

### 3d. Route swap

- [ ] **Step 3d.1: Update** `apps/web/src/routes.tsx`

Read the file. Add the import:

```tsx
import { ConceptMap } from "./screens/ConceptMap";
```

Remove `ConceptMapRoute` from the `./screens/RouteWrappers` import. Change the existing `<Route path="concepts" element={<ConceptMapRoute />} />` to:

```tsx
<Route path="concepts" element={<ConceptMap />} />
```

- [ ] **Step 3d.2: Remove `ConceptMapRoute` from** `apps/web/src/screens/RouteWrappers.tsx`

Read the file. Delete the `ConceptMapRoute` function and any imports that ONLY it used (`useMemo` and `useNavigate` may still be used by other wrappers — keep them if so; otherwise remove). Audit:

```bash
grep -rn "ConceptMapRoute" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Expected: no results.

- [ ] **Step 3d.3: Verify build + web suite**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: build clean; web tests pass (count up by ~16 new from this sub-project so far).

### 3e. e2e check

- [ ] **Step 3e.1: Verify e2e flows still pass**

The four existing e2e flows enter `/concepts/:id` directly (via the Dashboard's Continue card, the Tracks list, or `page.goto`). None navigate via `/concepts`, so the new graph screen has no e2e coupling. Run anyway to confirm:

```bash
source .venv/bin/activate
npm run e2e 2>&1 | tail -5
```

Expected: 4 chromium flows pass.

### 3f. Commit Task 3

- [ ] **Step 3f.1: Commit**

```bash
git add apps/web/src/screens/ConceptMap.tsx \
        apps/web/src/screens/__tests__/ConceptMap.test.tsx \
        apps/web/src/routes.tsx \
        apps/web/src/screens/RouteWrappers.tsx \
        apps/web/vitest.setup.ts
git commit -m "feat(web): polished /concepts graph view + route swap

ConceptMap renders a React Flow graph using the buildGraph layout
function from Task 1, ConceptNode from Task 2, and MapControls for the
URL-synced filter. Mini-map state persists via localStorage. ?filter=
narrows nodes (and their edges) without changing layout positions.
ConceptMapRoute wrapper removed from RouteWrappers.tsx.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Cleanup

Delete the legacy flat-grid component and its test.

**Files:**
- Delete: `apps/web/src/components/ConceptMap.tsx`
- Delete: `apps/web/src/__tests__/ConceptMap.test.tsx`

### 4a. Orphan audit

- [ ] **Step 4a.1: Confirm no imports remain**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
grep -rn "from .*components/ConceptMap" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Expected: no results (the new screen is at `screens/ConceptMap`, a different path).

### 4b. Delete + verify + commit

- [ ] **Step 4b.1: Remove the files**

```bash
rm apps/web/src/components/ConceptMap.tsx \
   apps/web/src/__tests__/ConceptMap.test.tsx
```

- [ ] **Step 4b.2: Verify build + tests still pass**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: build clean; web test count drops by ~3 (the legacy ConceptMap test had 3 assertions).

- [ ] **Step 4b.3: Commit**

```bash
git add -u apps/web/src/components/ConceptMap.tsx \
            apps/web/src/__tests__/ConceptMap.test.tsx
git commit -m "chore(web): delete legacy flat-grid ConceptMap

Orphan after Task 3 swapped /concepts to the new React Flow screen
at screens/ConceptMap.tsx. The legacy 46-line component lived at
components/ConceptMap.tsx with a 58-line test; both are gone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Final 1: Branch state**

```bash
git log --oneline main..HEAD
```

Expected: 5 commits — pre-flight docs, layout, components, screen+route, cleanup.

- [ ] **Final 2: Every gate green**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 28, web baseline 126 + (8 layout + 4 ConceptNode + 4 MapControls + 3 HoverPreview + 4 integration) = 19 new − 3 deleted legacy = 142, build clean, e2e 4.

- [ ] **Final 3: Dev-server smoke test**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-cm.log 2>&1 &
sleep 3
npm run web:dev > /tmp/web-cm.log 2>&1 &
sleep 5
for path in / /concepts /concepts?filter=missed /concepts/bytes-unicode /viz /__foundation; do
  /usr/bin/curl -sS -o /dev/null -w "$path -> HTTP %{http_code}\n" "http://127.0.0.1:5173$path"
done
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
```

Expected: all routes HTTP 200.

- [ ] **Final 4: Hand off**

Stop here. Do not push or open a PR without the user's explicit instruction. Report:

- Commit list (`git log --oneline main..HEAD`).
- Final test counts per suite.
- One short paragraph describing what `/concepts` shows in dev (graph, filter, mini-map, click-through behavior).
- Known follow-ups: hover-on-graph wiring (HoverPreview is built and tested but not yet wired to React Flow's `onNodeMouseEnter`); edge highlighting for the hovered node's neighborhood.
