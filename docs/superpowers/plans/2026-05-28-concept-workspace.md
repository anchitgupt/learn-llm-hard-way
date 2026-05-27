# Concept Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the un-styled `ConceptRoute` wrapper at `/concepts/:id` with a polished Concept Workspace screen built on the foundation: concept header (breadcrumb, status badges, prereqs, prev/next), and a five-tab content area (Explanation / Lab / Experiment / Checkpoint / Notes) with URL-synced tab state. The Experiment tab consumes the viz library via a registry, with `ChatPlayground` treated as the experiment for chat concepts.

**Architecture:** Pure-presentation tab components fed by `useCourseData()` and `useExperimentData()`. One small API touch-up (`GET /api/checkpoints/:id/attempts`) backs the Checkpoint tab's attempt history. Every concept JSON's `visual` field migrates to a `ConceptVizKey` value; a `"token-flow-svg"` alias keeps half-migrated state working during the rollout and is retired at the end.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 3.4, shadcn/ui, Motion-for-React, react-router-dom@^6, react-markdown, FastAPI + SQLite.

**Spec:** [docs/superpowers/specs/2026-05-27-concept-workspace-design.md](../specs/2026-05-27-concept-workspace-design.md)

---

## Pre-flight

- [ ] **Pre-flight Step 1: Create a feature branch from `main`**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout main
git pull --ff-only
git checkout -b concept-workspace
git status
```

Expected: branch `concept-workspace` checked out; working tree clean except for the new spec/plan files.

- [ ] **Pre-flight Step 2: Commit spec + plan as the branch's docs baseline**

```bash
git add docs/superpowers/specs/2026-05-27-concept-workspace-design.md \
        docs/superpowers/plans/2026-05-28-concept-workspace.md
git commit -m "docs: concept workspace spec and plan

Sub-project 4 of the 7-part UI overhaul. Replaces the un-styled
/concepts/:id route with a polished workspace: header + breadcrumb +
prev/next, five tabs (Explanation/Lab/Experiment/Checkpoint/Notes),
viz-registry-backed Experiment tab, URL-synced tab state.

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

Expected: labs 40, api 25, web 95, e2e 4.

---

## Task 1: API touch-up — `GET /api/checkpoints/:id/attempts`

**Files:**
- Modify: `apps/api/learn_llm_api/progress_store.py`
- Modify: `apps/api/learn_llm_api/app.py`
- Modify: `apps/api/tests/test_progress_store.py`
- Modify: `apps/api/tests/test_app.py`
- Modify: `apps/web/src/api.ts`

### 1a. `list_checkpoint_attempts` on ProgressStore (TDD)

- [ ] **Step 1a.1: Write the failing test**

Append to `apps/api/tests/test_progress_store.py`:

```python
def test_list_checkpoint_attempts_returns_most_recent_first(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    store.record_checkpoint_attempt(
        concept_id="bytes-unicode",
        submitted_answer="first",
        correct=False,
        feedback="try again",
        confidence=2,
    )
    store.record_checkpoint_attempt(
        concept_id="bytes-unicode",
        submitted_answer="second",
        correct=True,
        feedback="Checkpoint passed.",
        confidence=4,
    )
    store.record_checkpoint_attempt(
        concept_id="character-tokenization",
        submitted_answer="other concept",
        correct=False,
        feedback="...",
        confidence=2,
    )

    attempts = store.list_checkpoint_attempts("bytes-unicode")
    assert len(attempts) == 2
    assert attempts[0]["submittedAnswer"] == "second"
    assert attempts[0]["correct"] is True
    assert attempts[1]["submittedAnswer"] == "first"
    assert attempts[1]["correct"] is False


def test_list_checkpoint_attempts_returns_empty_for_unknown_concept(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    assert store.list_checkpoint_attempts("never-recorded") == []
```

- [ ] **Step 1a.2: Run + confirm FAIL**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py::test_list_checkpoint_attempts_returns_most_recent_first -v 2>&1 | tail -8
```

Expected: FAIL — `ProgressStore` has no attribute `list_checkpoint_attempts`.

- [ ] **Step 1a.3: Implement `list_checkpoint_attempts`**

In `apps/api/learn_llm_api/progress_store.py`, add this method immediately after `record_checkpoint_attempt`:

```python
    def list_checkpoint_attempts(self, concept_id: str) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT concept_id, submitted_answer, correct, feedback, confidence
                FROM checkpoint_attempts
                WHERE concept_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (concept_id,),
            ).fetchall()
        return [self._row_to_checkpoint_attempt(row) for row in rows]
```

- [ ] **Step 1a.4: Run + confirm PASS**

```bash
pytest apps/api/tests/test_progress_store.py -v 2>&1 | tail -10
```

Expected: both new tests pass; existing progress_store tests still pass.

### 1b. `GET /api/checkpoints/:id/attempts` (TDD)

- [ ] **Step 1b.1: Write the failing test**

Append to `apps/api/tests/test_app.py`:

```python
def test_get_checkpoint_attempts_returns_history(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from learn_llm_api.app import create_app

    monkeypatch.setenv("LEARN_LLM_DATABASE_PATH", str(tmp_path / "progress.sqlite"))
    client = TestClient(create_app(database_path=tmp_path / "progress.sqlite"))

    # No attempts yet.
    response = client.get("/api/checkpoints/bytes-unicode/attempts")
    assert response.status_code == 200
    assert response.json() == []

    # Submit an attempt via the existing endpoint.
    submit = client.post(
        "/api/checkpoints/bytes-unicode/attempts",
        json={"submittedAnswer": "utf-8 maps characters to byte sequences", "confidence": 4},
    )
    assert submit.status_code == 200

    listed = client.get("/api/checkpoints/bytes-unicode/attempts").json()
    assert len(listed) == 1
    assert listed[0]["submittedAnswer"] == "utf-8 maps characters to byte sequences"
```

- [ ] **Step 1b.2: Run + confirm FAIL**

```bash
pytest apps/api/tests/test_app.py::test_get_checkpoint_attempts_returns_history -v 2>&1 | tail -10
```

Expected: FAIL — endpoint returns 405 (POST exists at same path, GET does not).

- [ ] **Step 1b.3: Add the endpoint**

In `apps/api/learn_llm_api/app.py`, alongside the existing `submit_checkpoint` handler at `@app.post("/api/checkpoints/{concept_id}/attempts")`, add:

```python
    @app.get("/api/checkpoints/{concept_id}/attempts")
    def get_checkpoint_attempts(concept_id: str) -> list[dict[str, Any]]:
        return store.list_checkpoint_attempts(concept_id)
```

- [ ] **Step 1b.4: Run + confirm PASS**

```bash
pytest apps/api/tests/test_app.py -v 2>&1 | tail -8
```

Expected: 27 api tests pass.

### 1c. Frontend `fetchCheckpointAttempts` helper

- [ ] **Step 1c.1: Read `apps/web/src/api.ts` to find the right placement**

```bash
grep -n "submitCheckpoint\|CheckpointAttempt" apps/web/src/api.ts | head
```

(Locate `submitCheckpoint` so the new fetcher lives next to it.)

- [ ] **Step 1c.2: Add `fetchCheckpointAttempts`**

In `apps/web/src/api.ts`, add immediately after the existing `submitCheckpoint` function:

```ts
export async function fetchCheckpointAttempts(conceptId: string): Promise<CheckpointAttempt[]> {
  return readJson<CheckpointAttempt[]>(
    await fetch(`${API_BASE}/api/checkpoints/${conceptId}/attempts`)
  );
}
```

- [ ] **Step 1c.3: Verify build + web suite**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: build clean; 95 web tests pass (no new tests yet).

### 1d. Commit

- [ ] **Step 1d.1: Commit Task 1**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/api/learn_llm_api/progress_store.py \
        apps/api/learn_llm_api/app.py \
        apps/api/tests/test_progress_store.py \
        apps/api/tests/test_app.py \
        apps/web/src/api.ts
git commit -m "feat(api): expose GET /api/checkpoints/:id/attempts

Adds list_checkpoint_attempts to ProgressStore and a corresponding
GET endpoint. Concept Workspace's Checkpoint tab will use this to
render attempt history.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Viz registry + concept JSON migration

**Files:**
- Create: `apps/web/src/screens/concept/vizRegistry.ts`
- Create: `apps/web/src/screens/concept/__tests__/vizRegistry.test.ts`
- Modify: `content/concepts/data-and-tokens.json`
- Modify: `content/concepts/math-for-models.json`
- Modify: `content/concepts/early-neural-nets.json`
- Modify: `content/concepts/transformer.json`
- Modify: `content/concepts/chat-product.json`

### 2a. Registry (TDD)

- [ ] **Step 2a.1: Write the failing test**

Create `apps/web/src/screens/concept/__tests__/vizRegistry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { registeredKeys, resolveViz } from "../vizRegistry";

describe("vizRegistry", () => {
  it("registers all six concept viz keys", () => {
    expect(registeredKeys).toEqual([
      "token-flow",
      "attention-map",
      "loss-curve",
      "sampling-plot",
      "embedding-space",
      "chat-playground"
    ]);
  });

  it("resolves each known key to an entry with Component and hint", () => {
    for (const key of registeredKeys) {
      const entry = resolveViz(key);
      expect(entry).not.toBeNull();
      expect(typeof entry?.Component).toBe("function");
      expect(typeof entry?.hint).toBe("string");
      expect((entry?.hint ?? "").length).toBeGreaterThan(0);
    }
  });

  it("returns null for unknown or null keys", () => {
    expect(resolveViz(null)).toBeNull();
    expect(resolveViz(undefined)).toBeNull();
    expect(resolveViz("")).toBeNull();
    expect(resolveViz("nope")).toBeNull();
  });

  it("treats 'token-flow-svg' as an alias for 'token-flow' during the migration", () => {
    const canonical = resolveViz("token-flow");
    const alias = resolveViz("token-flow-svg");
    expect(alias).not.toBeNull();
    expect(alias?.Component).toBe(canonical?.Component);
  });
});
```

- [ ] **Step 2a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- vizRegistry 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 2a.3: Implement `vizRegistry`**

Create `apps/web/src/screens/concept/vizRegistry.ts`:

```ts
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

export interface RegistryEntry {
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

// Migration-window aliases. Removed in Task 5 once every concept JSON
// has been updated to the canonical keys above.
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

- [ ] **Step 2a.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- vizRegistry 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2b. Migrate concept JSONs

The mapping below is the canonical decision. The `"token-flow-svg"` alias in the registry keeps any half-migrated state working between this task and Task 5.

| File | Concept | New `visual` |
|------|---------|---------------|
| `data-and-tokens.json` | bytes-unicode | `"token-flow"` |
| `data-and-tokens.json` | character-tokenization | `"token-flow"` |
| `data-and-tokens.json` | byte-pair-encoding | `"token-flow"` |
| `math-for-models.json` | vectors | `"sampling-plot"` |
| `math-for-models.json` | dot-products | `"sampling-plot"` |
| `math-for-models.json` | logits-softmax | `"sampling-plot"` |
| `early-neural-nets.json` | scalar-gradient | `null` (no `lossHistory` artifact today) |
| `early-neural-nets.json` | tiny-linear-model | `"loss-curve"` (the mini training demo produces `lossHistory`) |
| `transformer.json` | every concept whose id contains `attention` or `mask` | `"attention-map"` |
| `transformer.json` | every concept whose id contains `training`, `mini-training`, or `loss` | `"loss-curve"` |
| `transformer.json` | other transformer concepts (e.g. `transformer-blocks`, `positional-encoding`) | `"attention-map"` |
| `chat-product.json` | every concept | `"chat-playground"` |

- [ ] **Step 2b.1: Read each concept JSON and apply the mapping**

For each of the five concept JSON files, find every `"visual": ...` field and replace its value with the new key per the table above. Use `Edit` with sufficient context (concept id) so each replacement is unique.

Sanity-check by grepping after edits:

```bash
grep -rh '"visual":' content/concepts/ | sort | uniq -c
```

Expected output: only the canonical keys (or `null`), no `"token-flow-svg"`.

- [ ] **Step 2b.2: Verify content_loader still accepts the files**

The `content_loader.py` doesn't validate `visual` against any whitelist, so the JSON change is transparent at the API layer.

```bash
source .venv/bin/activate
npm run api:test 2>&1 | tail -3
```

Expected: 27 tests pass (no regression).

- [ ] **Step 2b.3: Smoke check the dev server**

```bash
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-task2.log 2>&1 &
sleep 3
/usr/bin/curl -sS http://127.0.0.1:8000/api/tracks | head -c 600 ; echo "…"
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null
```

Expected: response contains the new `visual` values for known concepts.

- [ ] **Step 2b.4: Verify existing route wrapper still renders**

The current `/concepts/:id` route (via `RouteWrappers.tsx`'s `ConceptRoute`) renders the old `ConceptWorkspace` with the legacy `VisualExperiment` component, which reads `concept.visual` and renders a `TokenFlowSvg` when the string equals `"token-flow-svg"`. With the alias in place but `VisualExperiment` itself unchanged, the legacy panel may render nothing for the new keys until Task 4 swaps the route. This is acceptable — Task 4 lands the new screen, which uses the registry directly. The temporary "no visual" state during Task 2/3 is allowed; e2e flows do not assert on the visual rendering.

```bash
npm --prefix apps/web test 2>&1 | tail -3
```

Expected: web tests pass (no regression — no test asserts on the legacy panel rendering a specific viz for these keys).

### 2c. Commit

- [ ] **Step 2c.1: Commit Task 2**

```bash
git add apps/web/src/screens/concept/vizRegistry.ts \
        apps/web/src/screens/concept/__tests__/vizRegistry.test.ts \
        content/concepts/
git commit -m "feat(web): viz registry + migrate concept JSONs to ConceptVizKey

Maps the six ConceptVizKey values to viz library components plus
ChatPlayground. The legacy 'token-flow-svg' value is kept as a
migration alias and will be retired in Task 5. Every concept JSON's
'visual' field migrated to canonical keys.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Per-tab components and header

Build the six presentational pieces of the workspace. Each is a pure component; none is mounted in a route yet.

**Files:**
- Create: `apps/web/src/screens/concept/useDebouncedCallback.ts`
- Create: `apps/web/src/screens/concept/useExperimentData.ts`
- Create: `apps/web/src/screens/concept/ConceptHeader.tsx`
- Create: `apps/web/src/screens/concept/ExplanationTab.tsx`
- Create: `apps/web/src/screens/concept/LabTab.tsx`
- Create: `apps/web/src/screens/concept/ExperimentTab.tsx`
- Create: `apps/web/src/screens/concept/CheckpointTab.tsx`
- Create: `apps/web/src/screens/concept/NotesTab.tsx`
- Create: `apps/web/src/screens/concept/__tests__/ConceptHeader.test.tsx`
- Create: `apps/web/src/screens/concept/__tests__/ExplanationTab.test.tsx`
- Create: `apps/web/src/screens/concept/__tests__/LabTab.test.tsx`
- Create: `apps/web/src/screens/concept/__tests__/ExperimentTab.test.tsx`
- Create: `apps/web/src/screens/concept/__tests__/CheckpointTab.test.tsx`
- Create: `apps/web/src/screens/concept/__tests__/NotesTab.test.tsx`

### 3a. `useDebouncedCallback` (helper, used by NotesTab)

- [ ] **Step 3a.1: Implement** `apps/web/src/screens/concept/useDebouncedCallback.ts`

```ts
import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `fn` plus a `flush()` that fires any
 * pending call immediately. Used by NotesTab so a pending save is not
 * lost when the tab unmounts.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): { call: (...args: A) => void; flush: () => void } {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<A | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const call = useCallback((...args: A) => {
    pendingArgsRef.current = args;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (pendingArgsRef.current) {
        const a = pendingArgsRef.current;
        pendingArgsRef.current = null;
        fnRef.current(...a);
      }
    }, delayMs);
  }, [delayMs]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingArgsRef.current) {
      const a = pendingArgsRef.current;
      pendingArgsRef.current = null;
      fnRef.current(...a);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { call, flush };
}
```

No standalone test — exercised by `NotesTab.test.tsx`.

### 3b. `useExperimentData` (helper, used by ExperimentTab)

- [ ] **Step 3b.1: Implement** `apps/web/src/screens/concept/useExperimentData.ts`

```ts
import { useMemo } from "react";
import { useCourseData } from "@/shell/CourseDataProvider";
import { demoEmbeddings } from "@/viz/data/demoEmbeddings";
import type { AttentionMatrix, TokenItem } from "@/viz/data/types";
import type { Concept } from "../../types";
import { resolveViz } from "./vizRegistry";

interface SamplingCandidate {
  token: string;
  probability: number;
}

/**
 * Returns the props the chosen viz expects for this concept. Falls back
 * to a deterministic demo when no real artifact is available so the
 * tab is never empty.
 */
export function useExperimentData(concept: Concept): Record<string, unknown> {
  const { recentArtifacts } = useCourseData();
  const key = concept.visual ?? null;
  const entry = resolveViz(key);

  return useMemo(() => {
    if (!entry) return {};

    // ChatPlayground owns its own state.
    if (key === "chat-playground" || (key === "token-flow-svg")) {
      // (alias resolved above; this branch is for chat keys only)
    }

    switch (key) {
      case "chat-playground":
        return {};

      case "token-flow":
      case "token-flow-svg": {
        // Derive tokens from the concept title as a deterministic demo.
        const words = (concept.title ?? "tokens").split(/\s+/).filter(Boolean);
        const tokens: TokenItem[] = words.map((text, i) => ({
          id: 100 + i,
          text
        }));
        return { tokens };
      }

      case "attention-map": {
        const demo: AttentionMatrix = {
          tokens: ["the", "tiny", "model"],
          scores: [
            [1.0, -Infinity, -Infinity],
            [0.5, 0.5, -Infinity],
            [0.34, 0.33, 0.33]
          ]
        };
        return { data: demo };
      }

      case "loss-curve": {
        const series = [
          {
            label: "train",
            values: Array.from({ length: 60 }, (_, i) => 2.5 * Math.exp(-i / 18) + 0.4)
          }
        ];
        return { series, showRollingMean: true };
      }

      case "sampling-plot": {
        const candidates: SamplingCandidate[] = [
          { token: "the", probability: 0.51 },
          { token: "a",   probability: 0.30 },
          { token: "an",  probability: 0.19 }
        ];
        return { candidates, selectedToken: "the", temperature: 1.0 };
      }

      case "embedding-space":
        return { points: demoEmbeddings, selectedId: "cat" };

      default:
        return {};
    }
    // recentArtifacts intentionally read but not yet consumed; future
    // iteration will derive real props per concept from artifacts.
    void recentArtifacts;
  }, [entry, key, concept.title, recentArtifacts]);
}
```

No standalone test — covered by `ExperimentTab.test.tsx`.

### 3c. `ConceptHeader` (TDD)

- [ ] **Step 3c.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/ConceptHeader.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConceptHeader } from "../ConceptHeader";
import type { Concept, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode",          title: "Bytes and Unicode" } as unknown as Concept,
    { id: "character-tokenization", title: "Character Tokenization", prerequisites: ["bytes-unicode"] } as unknown as Concept,
    { id: "byte-pair-encoding",     title: "Byte Pair Encoding", prerequisites: ["character-tokenization"] } as unknown as Concept
  ]
};

describe("ConceptHeader", () => {
  it("renders breadcrumb, title, and position", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Character Tokenization/i })).toBeInTheDocument();
    expect(screen.getByText(/Concept 2 of 3 in Data and Tokens/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tracks/i })).toHaveAttribute("href", "/tracks");
  });

  it("renders prev and next links pointing at neighbouring concepts", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Bytes and Unicode/i }))
      .toHaveAttribute("href", "/concepts/bytes-unicode");
    expect(screen.getByRole("link", { name: /Byte Pair Encoding/i }))
      .toHaveAttribute("href", "/concepts/byte-pair-encoding");
  });

  it("hides prev/next at the track ends", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[0]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    // No prev link at the start.
    expect(screen.queryByRole("link", { name: /^← /i })).not.toBeInTheDocument();
  });

  it("renders an 'in missed queue' badge when listed", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set(["character-tokenization"])}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/in missed queue/i)).toBeInTheDocument();
  });

  it("renders prerequisite chips with ✓ / ○ based on progress", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{ "bytes-unicode": { status: "complete", confidence: 5, note: "", revisit: false } as any }}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    // The prereq chip should show the title text.
    expect(screen.getByRole("link", { name: /Bytes and Unicode/i })).toBeInTheDocument();
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3c.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- ConceptHeader 2>&1 | tail -10
```

- [ ] **Step 3c.3: Implement** `apps/web/src/screens/concept/ConceptHeader.tsx`

```tsx
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Concept, ProgressRecord, Track } from "../../types";

interface ConceptHeaderProps {
  concept: Concept;
  track: Track;
  progressByConcept: Record<string, ProgressRecord | undefined>;
  missedConceptIds: Set<string>;
}

export function ConceptHeader({
  concept,
  track,
  progressByConcept,
  missedConceptIds
}: ConceptHeaderProps) {
  const positionIndex = track.concepts.findIndex((c) => c.id === concept.id);
  const total = track.concepts.length;
  const prev = positionIndex > 0 ? track.concepts[positionIndex - 1] : null;
  const next = positionIndex < total - 1 ? track.concepts[positionIndex + 1] : null;

  const myProgress = progressByConcept[concept.id];
  const isMissed = missedConceptIds.has(concept.id);

  const status = myProgress?.status ?? concept.status ?? "open";
  const confidence = myProgress?.confidence;

  const prereqs = concept.prerequisites ?? [];

  return (
    <header className="space-y-4 mb-6">
      {/* Breadcrumb */}
      <p className="text-[13px] text-text-muted">
        <Link to="/tracks" className="hover:text-text-primary">← Tracks</Link>
        {" · "}
        <span>{track.title}</span>
        {" · "}
        <span>Concept {positionIndex + 1} of {total}</span>
      </p>

      {/* Title */}
      <h1 className="text-[28px] leading-[36px] font-semibold">{concept.title}</h1>

      {/* Status row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={status === "complete" ? "default" : "secondary"}>{status}</Badge>
        {typeof confidence === "number" ? (
          <Badge variant="outline">confidence {confidence}/5</Badge>
        ) : null}
        {isMissed ? <Badge variant="destructive">in missed queue</Badge> : null}
      </div>

      {/* Prerequisites */}
      {prereqs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
          <span>Prerequisites:</span>
          {prereqs.map((prereqId) => {
            const prereqConcept = track.concepts.find((c) => c.id === prereqId);
            const done = progressByConcept[prereqId]?.status === "complete";
            return (
              <Link
                key={prereqId}
                to={`/concepts/${prereqId}`}
                className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-0.5 hover:text-text-primary"
              >
                <span aria-hidden>{done ? "✓" : "○"}</span>
                <span>{prereqConcept?.title ?? prereqId}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Prev / Next */}
      <div className="flex gap-2">
        {prev ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/concepts/${prev.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {prev.title}
            </Link>
          </Button>
        ) : null}
        {next ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/concepts/${next.id}`}>
              {next.title} <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 3c.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- ConceptHeader 2>&1 | tail -8
```

Expected: 5 assertions pass.

### 3d. `ExplanationTab` (TDD)

- [ ] **Step 3d.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/ExplanationTab.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExplanationTab } from "../ExplanationTab";
import type { Concept } from "../../../types";

function makeConcept(markdown: string): Concept {
  return {
    id: "test",
    title: "Test",
    order: 1,
    prerequisites: [],
    lessonPath: "",
    lessonMarkdown: markdown,
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

describe("ExplanationTab", () => {
  it("renders markdown as parsed HTML", () => {
    render(<ExplanationTab concept={makeConcept("# Heading One\n\nFirst paragraph.")} />);
    expect(screen.getByRole("heading", { name: /Heading One/i })).toBeInTheDocument();
    expect(screen.getByText(/First paragraph/i)).toBeInTheDocument();
  });

  it("renders fenced code blocks inside <pre><code> with font-mono", () => {
    const md = "Inline `x` here.\n\n```python\nprint('hi')\n```\n";
    const { container } = render(<ExplanationTab concept={makeConcept(md)} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toMatch(/font-mono/);
    expect(pre?.textContent).toContain("print('hi')");
  });

  it("renders an empty state when lessonMarkdown is empty", () => {
    render(<ExplanationTab concept={makeConcept("")} />);
    expect(screen.getByText(/No explanation yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3d.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- ExplanationTab 2>&1 | tail -10
```

- [ ] **Step 3d.3: Implement** `apps/web/src/screens/concept/ExplanationTab.tsx`

```tsx
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/ui/code-block";
import type { Concept } from "../../types";

interface ExplanationTabProps {
  concept: Concept;
}

export function ExplanationTab({ concept }: ExplanationTabProps) {
  const md = concept.lessonMarkdown ?? "";
  if (md.trim().length === 0) {
    return <p className="text-text-muted">No explanation yet.</p>;
  }
  return (
    <article className="prose-lesson max-w-3xl">
      <ReactMarkdown
        components={{
          // react-markdown v10 calls this for both inline and block code.
          // Block code arrives wrapped in a <pre> by default; we override
          // the entire pre+code by inspecting whether the parent is <pre>.
          code({ inline, children, ...props }: any) {
            const text = String(children ?? "").replace(/\n$/, "");
            if (inline) return <code {...props}>{children}</code>;
            return <CodeBlock copyable rawContent={text}>{text}</CodeBlock>;
          },
          // Prevent react-markdown from wrapping CodeBlock in <pre>.
          pre({ children }: any) {
            return <>{children}</>;
          }
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
```

- [ ] **Step 3d.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- ExplanationTab 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 3e. `LabTab` (TDD)

- [ ] **Step 3e.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/LabTab.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LabTab } from "../LabTab";
import * as api from "../../../api";

const labArtifact = {
  labId: "character-tokenizer",
  conceptId: "character-tokenization",
  artifactPath: "artifacts/labs/character-tokenizer.json",
  status: "ok",
  error: ""
};

beforeEach(() => {
  vi.spyOn(api, "runLab").mockResolvedValue(labArtifact as any);
});
afterEach(() => vi.restoreAllMocks());

describe("LabTab", () => {
  it("renders the lab id and run button when concept.lab is set", () => {
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/character-tokenizer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run lab/i })).toBeInTheDocument();
  });

  it("disables the run button while running and re-enables on success", async () => {
    const onRunComplete = vi.fn();
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={onRunComplete} />
      </MemoryRouter>
    );
    const button = screen.getByRole("button", { name: /run lab/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(onRunComplete).toHaveBeenCalled());
    expect(button).not.toBeDisabled();
  });

  it("renders an inline alert on run failure with a retry button", async () => {
    vi.spyOn(api, "runLab").mockRejectedValueOnce(new Error("lab blew up"));
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={() => {}} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /run lab/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/lab blew up/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3e.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- LabTab 2>&1 | tail -10
```

- [ ] **Step 3e.3: Implement** `apps/web/src/screens/concept/LabTab.tsx`

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runLab } from "../../api";

interface LabTabProps {
  labId: string;
  conceptId: string;
  onRunComplete: () => void;
}

export function LabTab({ labId, conceptId, onRunComplete }: LabTabProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      await runLab(labId);
      onRunComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lab failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[15px] leading-[22px] font-mono">{labId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-text-muted text-[14px]">
          Runs the lab on a small deterministic input and writes the artifact to
          {" "}<span className="font-mono">artifacts/labs/</span>.
        </p>
        <div>
          <Button type="button" onClick={handleRun} disabled={running}>
            <Play className="h-4 w-4 mr-1" />
            {running ? "Running…" : "Run lab"}
          </Button>
        </div>
        {error ? (
          <div role="alert" className="flex items-start gap-3 p-3 border border-danger/40 rounded-md bg-bg-elevated">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-danger shrink-0" />
            <div className="flex-1 text-[13px] text-text-primary">
              <span className="font-medium">Lab run failed.</span>{" "}
              <span className="text-text-muted">{error}</span>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleRun}>
              Try again
            </Button>
          </div>
        ) : null}
        <p className="text-[12px] text-text-muted">
          See the latest output in <Link to="/artifacts" className="text-accent hover:text-accent-hover">Artifacts</Link>.
        </p>
        <span className="hidden" data-concept={conceptId} />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3e.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- LabTab 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 3f. `ExperimentTab` (TDD)

- [ ] **Step 3f.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/ExperimentTab.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import { ExperimentTab } from "../ExperimentTab";
import * as api from "../../../api";
import type { Concept } from "../../../types";

function makeConcept(visual: string | null, title = "Demo"): Concept {
  return {
    id: "demo",
    title,
    order: 1,
    prerequisites: [],
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

function renderTab(concept: Concept) {
  return render(
    <MemoryRouter>
      <CourseDataProvider>
        <ExperimentTab concept={concept} />
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ExperimentTab", () => {
  it("renders an empty state when concept.visual is null", () => {
    renderTab(makeConcept(null));
    expect(screen.getByText(/No experiment for this concept yet/i)).toBeInTheDocument();
  });

  it("renders the registry hint for a known viz key", () => {
    renderTab(makeConcept("token-flow", "Bytes and Unicode"));
    expect(screen.getByText(/Tokens through stages/i)).toBeInTheDocument();
  });

  it("renders an AttentionMap for the attention-map key", () => {
    const { container } = renderTab(makeConcept("attention-map"));
    expect(container.querySelectorAll("[data-cell]").length).toBeGreaterThan(0);
  });

  it("renders a LossCurve for the loss-curve key", () => {
    const { container } = renderTab(makeConcept("loss-curve"));
    expect(container.querySelectorAll("[data-series]").length).toBeGreaterThan(0);
  });

  it("renders a SamplingPlot for the sampling-plot key", () => {
    const { container } = renderTab(makeConcept("sampling-plot"));
    expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(0);
  });

  it("renders an EmbeddingSpace for the embedding-space key", () => {
    const { container } = renderTab(makeConcept("embedding-space"));
    expect(container.querySelectorAll("[data-point]").length).toBeGreaterThan(0);
  });

  it("renders a TokenFlow for the token-flow key", () => {
    const { container } = renderTab(makeConcept("token-flow", "the model reads"));
    expect(container.querySelectorAll("[data-token-cell]").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3f.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- ExperimentTab 2>&1 | tail -10
```

- [ ] **Step 3f.3: Implement** `apps/web/src/screens/concept/ExperimentTab.tsx`

```tsx
import type { Concept } from "../../types";
import { resolveViz } from "./vizRegistry";
import { useExperimentData } from "./useExperimentData";

interface ExperimentTabProps {
  concept: Concept;
}

export function ExperimentTab({ concept }: ExperimentTabProps) {
  const entry = resolveViz(concept.visual);
  const props = useExperimentData(concept);

  if (!entry) {
    return (
      <p className="text-text-muted">
        No experiment for this concept yet. Run the lab to see its artifact, or open the chat playground.
      </p>
    );
  }
  const { Component, hint } = entry;
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-text-muted">{hint}</p>
      <Component {...props} />
    </div>
  );
}
```

- [ ] **Step 3f.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- ExperimentTab 2>&1 | tail -8
```

Expected: 7 assertions pass.

### 3g. `CheckpointTab` (TDD)

- [ ] **Step 3g.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/CheckpointTab.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckpointTab } from "../CheckpointTab";
import * as api from "../../../api";

const checkpoint = { question: "Why bytes?", answer: "Because text is encoded." };

beforeEach(() => {
  vi.spyOn(api, "submitCheckpoint").mockResolvedValue({
    conceptId: "bytes-unicode",
    submittedAnswer: "encoded",
    correct: true,
    feedback: "Checkpoint passed.",
    confidence: 4
  } as any);
  vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([] as any);
});
afterEach(() => vi.restoreAllMocks());

describe("CheckpointTab", () => {
  it("renders the question", () => {
    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={() => {}} />);
    expect(screen.getByText(/Why bytes\?/)).toBeInTheDocument();
  });

  it("submits answer + confidence and renders feedback", async () => {
    const onSubmitted = vi.fn();
    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={onSubmitted} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "encoded" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(screen.getByText(/Checkpoint passed/i)).toBeInTheDocument();
    expect(api.submitCheckpoint).toHaveBeenCalledWith("bytes-unicode", {
      submittedAnswer: "encoded",
      confidence: 3
    });
  });

  it("renders prior attempt history", async () => {
    vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([
      { conceptId: "bytes-unicode", submittedAnswer: "first try", correct: false, feedback: "no", confidence: 2 },
      { conceptId: "bytes-unicode", submittedAnswer: "second try", correct: true,  feedback: "yes", confidence: 4 }
    ] as any);

    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={() => {}} />);
    await waitFor(() => expect(screen.getByText(/first try/i)).toBeInTheDocument());
    expect(screen.getByText(/second try/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3g.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- CheckpointTab 2>&1 | tail -10
```

- [ ] **Step 3g.3: Implement** `apps/web/src/screens/concept/CheckpointTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchCheckpointAttempts, submitCheckpoint } from "../../api";
import type { Checkpoint, CheckpointAttempt } from "../../types";

interface CheckpointTabProps {
  conceptId: string;
  checkpoint: Checkpoint;
  onSubmitted: () => void;
}

export function CheckpointTab({ conceptId, checkpoint, onSubmitted }: CheckpointTabProps) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CheckpointAttempt[]>([]);

  useEffect(() => {
    setFeedback(null);
    setAnswer("");
    fetchCheckpointAttempts(conceptId).then(setAttempts).catch(() => setAttempts([]));
  }, [conceptId]);

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitCheckpoint(conceptId, { submittedAnswer: answer, confidence });
      setFeedback(result.feedback);
      setAttempts((prev) => [result, ...prev]);
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-[17px] leading-[24px]">Checkpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-primary">{checkpoint.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary font-mono"
            aria-label="Your answer"
          />
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-text-muted">Confidence</label>
            <input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              aria-label="Confidence"
            />
            <span className="font-mono text-[13px]">{confidence}/5</span>
          </div>
          <div>
            <Button type="button" onClick={handleSubmit} disabled={submitting || !answer.trim()}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
          {feedback ? (
            <p role="status" className="text-[14px] text-text-primary p-3 rounded-md bg-bg-elevated border border-border-subtle">
              {feedback}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {attempts.length > 0 ? (
        <Card className="bg-bg-surface">
          <CardHeader>
            <CardTitle className="text-[15px] leading-[22px]">Attempt history</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <ul className="space-y-2">
                {attempts.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px]">
                    <Badge variant={a.correct ? "default" : "destructive"}>
                      {a.correct ? "passed" : "failed"}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-mono text-text-primary">{a.submittedAnswer}</div>
                      <div className="text-text-muted">confidence {a.confidence}/5</div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3g.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- CheckpointTab 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 3h. `NotesTab` (TDD)

- [ ] **Step 3h.1: Write the failing test**

`apps/web/src/screens/concept/__tests__/NotesTab.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotesTab } from "../NotesTab";
import * as api from "../../../api";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(api, "saveProgress").mockResolvedValue({} as any);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("NotesTab", () => {
  it("renders existing note as initial textarea value", () => {
    render(<NotesTab conceptId="x" existing={{ status: "learning", confidence: 3, note: "earlier note", revisit: false }} onSaved={() => {}} />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("earlier note");
  });

  it("debounces typing and calls saveProgress", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new" } });
    expect(api.saveProgress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(api.saveProgress).toHaveBeenCalledTimes(1);
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ note: "new" }));
  });

  it("toggling revisit triggers an immediate save", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: /revisit/i }));
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ revisit: true }));
  });

  it("'Mark complete' sets status=complete", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ status: "complete" }));
  });
});
```

- [ ] **Step 3h.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- NotesTab 2>&1 | tail -10
```

- [ ] **Step 3h.3: Implement** `apps/web/src/screens/concept/NotesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { saveProgress } from "../../api";
import type { ProgressRecord } from "../../types";
import { useDebouncedCallback } from "./useDebouncedCallback";

interface NotesTabProps {
  conceptId: string;
  existing: ProgressRecord | undefined;
  onSaved: () => void;
}

export function NotesTab({ conceptId, existing, onSaved }: NotesTabProps) {
  const [note, setNote] = useState(existing?.note ?? "");
  const [confidence, setConfidence] = useState(existing?.confidence ?? 3);
  const [revisit, setRevisit] = useState(existing?.revisit ?? false);
  const [status, setStatus] = useState(existing?.status ?? "learning");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function persist(next: { note?: string; confidence?: number; revisit?: boolean; status?: string }) {
    const payload = {
      status: next.status ?? status,
      confidence: next.confidence ?? confidence,
      note: next.note ?? note,
      revisit: next.revisit ?? revisit
    };
    await saveProgress(conceptId, payload);
    setSavedAt(new Date());
    onSaved();
  }

  const { call: debouncedSave, flush } = useDebouncedCallback((value: string) => {
    void persist({ note: value });
  }, 400);

  // Flush pending debounced save on unmount.
  useEffect(() => flush, [flush]);

  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[17px] leading-[24px]">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            debouncedSave(e.target.value);
          }}
          rows={8}
          aria-label="Notes"
          className="w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary"
        />

        <div className="flex items-center gap-3">
          <label className="text-[13px] text-text-muted">Confidence</label>
          <input
            type="range"
            min={1}
            max={5}
            value={confidence}
            onChange={(e) => {
              const c = Number(e.target.value);
              setConfidence(c);
              void persist({ confidence: c });
            }}
            aria-label="Confidence"
          />
          <span className="font-mono text-[13px]">{confidence}/5</span>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            aria-label="Add to revisit queue"
            checked={revisit}
            onCheckedChange={(value: boolean) => {
              setRevisit(value);
              void persist({ revisit: value });
            }}
          />
          <span className="text-[13px] text-text-muted">Add to revisit queue</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStatus("complete");
              void persist({ status: "complete" });
            }}
          >
            Mark complete
          </Button>
          {savedAt ? (
            <span className="text-[12px] text-text-muted">Saved · {savedAt.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3h.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- NotesTab 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 3i. Verify + commit

- [ ] **Step 3i.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: previous total + ~25 new (5 + 3 + 3 + 7 + 3 + 4 + 4 registry) ≈ 120 tests, build clean.

- [ ] **Step 3i.2: Commit Task 3**

```bash
git add apps/web/src/screens/concept/
git commit -m "feat(web): concept workspace per-tab components + header

Adds ConceptHeader (breadcrumb, prereqs, prev/next), ExplanationTab
(markdown via react-markdown with <CodeBlock>), LabTab (run-lab UI),
ExperimentTab (viz-registry-backed), CheckpointTab (submit + history),
NotesTab (debounced save, revisit toggle, mark complete). Plus the
useExperimentData resolver and useDebouncedCallback helper. None are
mounted in a route yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ConceptWorkspace screen + route swap + e2e selector updates

**Files:**
- Create: `apps/web/src/screens/ConceptWorkspace.tsx`
- Create: `apps/web/src/screens/__tests__/ConceptWorkspace.test.tsx`
- Modify: `apps/web/src/routes.tsx`
- Modify: `apps/web/src/screens/RouteWrappers.tsx` (remove `ConceptRoute`)
- Modify: e2e specs as required

### 4a. ConceptWorkspace integration test (TDD)

- [ ] **Step 4a.1: Write the failing test**

`apps/web/src/screens/__tests__/ConceptWorkspace.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ConceptWorkspace } from "../ConceptWorkspace";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

const concept = {
  id: "bytes-unicode",
  title: "Bytes and Unicode",
  order: 1,
  prerequisites: [],
  lessonPath: "",
  lessonMarkdown: "# Bytes\n\nText is encoded into bytes.",
  lab: null,
  visual: "token-flow",
  checkpoint: { question: "Why bytes?", answer: "encoded" },
  glossary: [],
  status: "open"
} as unknown as Concept;

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [concept]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
  vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([] as any);
  vi.spyOn(api, "touchConcept").mockResolvedValue(undefined as any);
});
afterEach(() => vi.restoreAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CourseDataProvider>
        <Routes>
          <Route path="/concepts/:id" element={<ConceptWorkspace />} />
        </Routes>
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ConceptWorkspace", () => {
  it("renders header + tabs after data loads", async () => {
    renderAt("/concepts/bytes-unicode");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Bytes and Unicode/i })).toBeInTheDocument()
    );
    for (const tab of ["Explanation", "Experiment", "Checkpoint", "Notes"]) {
      expect(screen.getByRole("tab", { name: new RegExp(tab, "i") })).toBeInTheDocument();
    }
    // Lab tab hidden because concept.lab is null.
    expect(screen.queryByRole("tab", { name: /^lab$/i })).not.toBeInTheDocument();
  });

  it("clicking a tab updates the ?tab= query parameter", async () => {
    renderAt("/concepts/bytes-unicode");
    const checkpointTab = await screen.findByRole("tab", { name: /Checkpoint/i });
    fireEvent.click(checkpointTab);
    await waitFor(() => {
      expect(window.location.search === "" || window.location.search.includes("tab=checkpoint")).toBe(true);
    });
    // The tab is selected.
    expect(checkpointTab.getAttribute("data-state")).toBe("active");
  });

  it("?tab=experiment in the URL selects the Experiment tab on mount", async () => {
    renderAt("/concepts/bytes-unicode?tab=experiment");
    const experimentTab = await screen.findByRole("tab", { name: /Experiment/i });
    await waitFor(() => expect(experimentTab.getAttribute("data-state")).toBe("active"));
  });

  it("renders 'Concept not found' for an unknown id", async () => {
    renderAt("/concepts/does-not-exist");
    await waitFor(() => expect(screen.getByText(/Concept not found/i)).toBeInTheDocument());
  });

  it("calls touchConcept on mount", async () => {
    renderAt("/concepts/bytes-unicode");
    await waitFor(() => expect(api.touchConcept).toHaveBeenCalledWith("bytes-unicode"));
  });
});
```

- [ ] **Step 4a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- ConceptWorkspace 2>&1 | tail -10
```

### 4b. Implement `ConceptWorkspace`

- [ ] **Step 4b.1: Create** `apps/web/src/screens/ConceptWorkspace.tsx`

```tsx
import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseData } from "@/shell/CourseDataProvider";
import { touchConcept } from "../api";
import { ConceptHeader } from "./concept/ConceptHeader";
import { ExplanationTab } from "./concept/ExplanationTab";
import { LabTab } from "./concept/LabTab";
import { ExperimentTab } from "./concept/ExperimentTab";
import { CheckpointTab } from "./concept/CheckpointTab";
import { NotesTab } from "./concept/NotesTab";

const VALID_TABS = ["explanation", "lab", "experiment", "checkpoint", "notes"] as const;
type TabKey = (typeof VALID_TABS)[number];

function defaultTabFor(visual: string | null | undefined): TabKey {
  // Chat concepts default to Experiment so deep-links don't lose the chat product.
  return visual === "chat-playground" ? "experiment" : "explanation";
}

export function ConceptWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tracks, progressRecords, missedTopics, loading, refresh } = useCourseData();

  const { concept, track } = useMemo(() => {
    if (!id) return { concept: null, track: null };
    for (const t of tracks) {
      const c = t.concepts.find((concept) => concept.id === id);
      if (c) return { concept: c, track: t };
    }
    return { concept: null, track: null };
  }, [tracks, id]);

  useEffect(() => {
    if (!id) return;
    void touchConcept(id).catch(() => { /* best-effort */ });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 bg-bg-surface" />
        <Skeleton className="h-10 w-96 bg-bg-surface" />
        <Skeleton className="h-8 w-full bg-bg-surface" />
      </div>
    );
  }

  if (!concept || !track) {
    return (
      <div className="space-y-4">
        <h1 className="text-[24px] leading-[32px] font-semibold">Concept not found</h1>
        <p className="text-text-muted">
          We couldn't find a concept with id <span className="font-mono">{id}</span>.
        </p>
      </div>
    );
  }

  const progressByConcept = Object.fromEntries(progressRecords.map((r) => [r.conceptId, r]));
  const missedConceptIds = new Set(missedTopics.map((m) => m.conceptId));
  const myProgress = progressByConcept[concept.id];

  const hasLab = concept.lab !== null && concept.lab !== undefined;
  const hasExperiment = concept.visual !== null && concept.visual !== undefined;

  const requestedTab = searchParams.get("tab");
  const fallback = defaultTabFor(concept.visual);
  let activeTab: TabKey = fallback;
  if (requestedTab && (VALID_TABS as readonly string[]).includes(requestedTab)) {
    const r = requestedTab as TabKey;
    if ((r === "lab" && !hasLab) || (r === "experiment" && !hasExperiment)) {
      // eslint-disable-next-line no-console
      console.warn(`Tab '${r}' not available for concept ${concept.id}; falling back to ${fallback}.`);
      activeTab = fallback;
    } else {
      activeTab = r;
    }
  }

  function setActiveTab(next: string) {
    if (next === fallback) {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: false });
  }

  return (
    <div className="space-y-6">
      <ConceptHeader
        concept={concept}
        track={track}
        progressByConcept={progressByConcept}
        missedConceptIds={missedConceptIds}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
          {hasLab ? <TabsTrigger value="lab">Lab</TabsTrigger> : null}
          {hasExperiment ? <TabsTrigger value="experiment">Experiment</TabsTrigger> : null}
          <TabsTrigger value="checkpoint">Checkpoint</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="explanation" className="pt-6">
          <ExplanationTab concept={concept} />
        </TabsContent>

        {hasLab && concept.lab ? (
          <TabsContent value="lab" className="pt-6">
            <LabTab labId={concept.lab} conceptId={concept.id} onRunComplete={() => void refresh()} />
          </TabsContent>
        ) : null}

        {hasExperiment ? (
          <TabsContent value="experiment" className="pt-6">
            <ExperimentTab concept={concept} />
          </TabsContent>
        ) : null}

        <TabsContent value="checkpoint" className="pt-6">
          <CheckpointTab
            conceptId={concept.id}
            checkpoint={concept.checkpoint}
            onSubmitted={() => void refresh()}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
          <NotesTab
            conceptId={concept.id}
            existing={myProgress}
            onSaved={() => void refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4b.2: Run + confirm PASS**

```bash
npm --prefix apps/web test -- ConceptWorkspace 2>&1 | tail -10
```

Expected: 5 assertions pass.

### 4c. Route swap

- [ ] **Step 4c.1: Update** `apps/web/src/routes.tsx`

Read the file, find the `ConceptRoute` import + usage, and replace with the new screen:

```tsx
// At the top:
import { ConceptWorkspace } from "./screens/ConceptWorkspace";
// Remove ConceptRoute from the RouteWrappers import.

// Inside <Routes>:
<Route path="concepts/:id" element={<ConceptWorkspace />} />
```

- [ ] **Step 4c.2: Remove `ConceptRoute` from** `apps/web/src/screens/RouteWrappers.tsx`

Read the file. Delete the `ConceptRoute` function and any imports it solely used (`touchConcept`, `submitCheckpoint`, `runLab`, the `chatConceptIds` set, `useParams`, `useEffect`, `ConceptWorkspace as legacy`, etc.). Other wrappers (`TracksRoute`, `ConceptMapRoute`, ...) stay.

Sanity check that no other file imports `ConceptRoute`:

```bash
grep -rn "ConceptRoute" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Expected: no results.

### 4d. e2e selector updates

- [ ] **Step 4d.1: Read each e2e spec and identify selectors that reference the legacy concept screen**

```bash
for f in tests/e2e/phase{1-learning-path,2-learning-core,3-mini-llm,4-chat-mechanics}.spec.ts; do
  echo "=== $f ==="
  cat "$f"
  echo "---"
done
```

Common selectors that will change:

- `getByRole("tab", { name: /Lesson/i })` → `name: /Explanation/i` (Lesson tab renamed).
- `getByRole("tab", { name: /Visual/i })` → `name: /Experiment/i` (Visual tab renamed).
- Any reliance on the second un-styled `<ChatPlayground />` block rendered below the workspace — that no longer renders for chat concepts. Either replace with a `page.goto("/chat")` call or with clicking the Experiment tab (which now hosts ChatPlayground for chat concepts).
- Any reliance on the inline missed-topics aside that the legacy `ConceptRoute` rendered — gone. If a test asserts on missed-topic text from the concept page, route the assertion through the Dashboard or rewrite to use the new "in missed queue" badge in the header.

- [ ] **Step 4d.2: Update each e2e spec**

Apply selector replacements per the analysis above. Add a one-line comment above each replacement:

```ts
// Concept Workspace sub-project: tabs renamed Lesson→Explanation, Visual→Experiment.
await page.getByRole("tab", { name: /Explanation/i }).click();
```

- [ ] **Step 4d.3: Run e2e**

```bash
source .venv/bin/activate
npm run e2e 2>&1 | tail -8
```

Expected: 4 flows pass. If a flow fails for a reason other than navigation/selectors, STOP and report — that would be a real regression.

### 4e. Verify + commit

- [ ] **Step 4e.1: Full suite + build**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 27, web ≥ 120, build clean, e2e 4.

- [ ] **Step 4e.2: Commit Task 4**

```bash
git add apps/web/src/screens/ConceptWorkspace.tsx \
        apps/web/src/screens/__tests__/ConceptWorkspace.test.tsx \
        apps/web/src/routes.tsx \
        apps/web/src/screens/RouteWrappers.tsx \
        tests/e2e/
git commit -m "feat(web): polished /concepts/:id screen + route swap

ConceptWorkspace replaces RouteWrappers.tsx's ConceptRoute. Header
+ 5 tabs (Explanation/Lab/Experiment/Checkpoint/Notes) with URL-synced
?tab= state. Lab and Experiment tabs are conditional on concept fields.
Chat concepts default to the Experiment tab so deep-links don't lose
the chat product. e2e selectors updated for renamed tabs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Cleanup + alias retirement

**Files:**
- Delete: `apps/web/src/components/ConceptWorkspace.tsx`
- Delete: `apps/web/src/components/VisualExperiment.tsx`
- Delete: `apps/web/src/components/LabPanel.tsx`
- Delete: `apps/web/src/components/CheckpointPanel.tsx`
- Delete: `apps/web/src/components/ProgressPanel.tsx`
- Delete: `apps/web/src/__tests__/CheckpointPanel.test.tsx` (if exists)
- Delete: `apps/web/src/__tests__/LabPanel.test.tsx` (if exists)
- Modify: `apps/web/src/screens/concept/vizRegistry.ts` (remove alias)
- Modify: `apps/web/src/screens/concept/__tests__/vizRegistry.test.ts` (remove alias test)

### 5a. Orphan audit

- [ ] **Step 5a.1: For each legacy file, check who imports it**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
for f in ConceptWorkspace VisualExperiment LabPanel CheckpointPanel ProgressPanel; do
  echo "=== $f ==="
  grep -rln "from .*components/$f\|from .*components.*$f" apps/web/src/ --include="*.tsx" --include="*.ts"
done
```

Expected: each grep returns only the file itself (a self-reference) plus possibly its own legacy test file. If anything else imports it (not subsumed by the new screens), STOP and report.

`GlossaryPanel` is NOT in the deletion list because the `/glossary` route's wrapper still imports it. Confirm via:

```bash
grep -rln "GlossaryPanel" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Expected: `RouteWrappers.tsx` plus the file itself.

### 5b. Delete the orphans

- [ ] **Step 5b.1: Remove the files**

```bash
rm apps/web/src/components/ConceptWorkspace.tsx \
   apps/web/src/components/VisualExperiment.tsx \
   apps/web/src/components/LabPanel.tsx \
   apps/web/src/components/CheckpointPanel.tsx \
   apps/web/src/components/ProgressPanel.tsx

# Their tests, if they exist (no-op if not):
rm -f apps/web/src/__tests__/CheckpointPanel.test.tsx \
      apps/web/src/__tests__/LabPanel.test.tsx
```

- [ ] **Step 5b.2: Verify build + tests still pass**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: build clean (no missing imports); tests still pass (count may drop a few from deleted legacy tests).

### 5c. Retire the `"token-flow-svg"` alias

- [ ] **Step 5c.1: Remove the alias from** `apps/web/src/screens/concept/vizRegistry.ts`

Edit the `aliases` block in `vizRegistry.ts` to be empty:

```ts
const aliases: Record<string, ConceptVizKey> = {};
```

Keep the file structure (the `aliases[key]` lookup in `resolveViz` continues to work, it just won't find anything).

- [ ] **Step 5c.2: Remove the alias test**

In `apps/web/src/screens/concept/__tests__/vizRegistry.test.ts`, delete the test case:

```ts
it("treats 'token-flow-svg' as an alias for 'token-flow' during the migration", () => { ... });
```

(Sub-project 4's purpose was to land the new keys; the alias is migration scaffolding.)

- [ ] **Step 5c.3: Sanity-check no concept JSON still uses the old key**

```bash
grep -rh '"visual":' content/concepts/ | sort | uniq -c
```

Expected: no `"token-flow-svg"` rows; only canonical `ConceptVizKey` values plus `null`.

- [ ] **Step 5c.4: Run + verify**

```bash
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: all tests pass; one fewer registry test than before.

### 5d. Commit

- [ ] **Step 5d.1: Commit Task 5**

```bash
git add -u apps/web/src/components/ConceptWorkspace.tsx \
            apps/web/src/components/VisualExperiment.tsx \
            apps/web/src/components/LabPanel.tsx \
            apps/web/src/components/CheckpointPanel.tsx \
            apps/web/src/components/ProgressPanel.tsx \
            apps/web/src/__tests__/CheckpointPanel.test.tsx \
            apps/web/src/__tests__/LabPanel.test.tsx 2>/dev/null
git add apps/web/src/screens/concept/vizRegistry.ts \
        apps/web/src/screens/concept/__tests__/vizRegistry.test.ts
git commit -m "chore(web): delete legacy concept panels + retire viz alias

ConceptWorkspace, VisualExperiment, LabPanel, CheckpointPanel,
ProgressPanel are now orphans (audited via grep). GlossaryPanel
stays — still consumed by /glossary's wrapper until sub-project 7.
The 'token-flow-svg' migration alias in vizRegistry is removed now
that every concept JSON uses canonical keys.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Final 1: Branch state**

```bash
git log --oneline main..HEAD
```

Expected: ~6 commits — pre-flight docs, API touch-up, registry+migration, per-tab components, workspace+route swap, cleanup.

- [ ] **Final 2: Every gate green**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | tail -5
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 27, web 115+ (depending on how many legacy tests were deleted), build clean, e2e 4.

- [ ] **Final 3: Dev-server smoke test**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-cw.log 2>&1 &
sleep 3
npm run web:dev > /tmp/web-cw.log 2>&1 &
sleep 5
for path in / /tracks /concepts /concepts/bytes-unicode /concepts/message-formatting /viz /__foundation; do
  /usr/bin/curl -sS -o /dev/null -w "$path -> HTTP %{http_code}\n" "http://127.0.0.1:5173$path"
done
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
```

Expected: all routes HTTP 200. Open `/concepts/bytes-unicode` in a browser to confirm: header + 5 tabs render (Explanation default), tab clicks update `?tab=`, refresh preserves the active tab. Open `/concepts/message-formatting` to confirm the Experiment tab is the default and ChatPlayground renders inside it.

- [ ] **Final 4: Hand off**

Stop here. Do not push or open a PR without the user's explicit instruction. Report:

- Commit list (`git log --oneline main..HEAD`).
- Final test counts per suite.
- One short paragraph describing what `/concepts/:id` shows in dev.
- Any known follow-ups (e.g. real artifact-derived viz props once labs produce richer data; mobile polish for the textarea).
