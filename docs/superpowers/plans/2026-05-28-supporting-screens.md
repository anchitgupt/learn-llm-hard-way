# Supporting Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the last four un-styled surfaces (Glossary, Artifacts, Failures, Tracks), add a chat memory drawer, add `DELETE /api/chat/memory/{id}`, and retire `RouteWrappers.tsx` + four legacy panels — closing the UI overhaul.

**Architecture:** Each screen is a screen-level orchestrator under `apps/web/src/screens/<Name>.tsx` with a sibling `screens/<name>/` folder for parts. Data flows from `useCourseData()` for Glossary/Tracks/Artifacts and from dedicated screen-local hooks for Failures (`useFailuresData`) and Memory (`useMemoryEditor`). The memory drawer mounts inside `ChatPlayground` via a composer button; no nav change.

**Tech Stack:** React 19 + Vite + TypeScript, react-router-dom v6 (URL-synced search via `useSearchParams`), Tailwind + shadcn/ui primitives (`Card`, `Badge`, `Button`, `Sheet`, `Skeleton`, `Separator`), `@/lib/motion` (`Stagger`, `Reveal`, `panelEnter`), Vitest + RTL, FastAPI + SQLite for the API delete endpoint.

**Spec:** `docs/superpowers/specs/2026-05-28-supporting-screens-design.md` — read for surface-level UX details if any task needs context.

---

## Pre-flight

- [ ] **Step 0.1: Verify branch**

Run: `git branch --show-current`
Expected: `supporting-screens`

- [ ] **Step 0.2: Verify baseline tests are green**

Run: `npm --prefix apps/web test -- --run`
Expected: 185 passing (≥)

Run: `npm --prefix apps/api test`
Expected: 30 passing

---

## Task 1: API delete-memory endpoint and store method

**Files:**
- Modify: `apps/api/learn_llm_api/progress_store.py` — add `delete_chat_memory`
- Modify: `apps/api/learn_llm_api/app.py` — add DELETE route
- Test: `apps/api/tests/test_app.py` — two new tests

**Context:** Memory rows live in the `chat_memories` SQLite table. The store already has `save_chat_memory` and `list_chat_memories` (see [progress_store.py:246-271](apps/api/learn_llm_api/progress_store.py#L246-L271)). The API route file already mounts `/api/chat/memory` GET and POST (see [app.py:194-200](apps/api/learn_llm_api/app.py#L194-L200)). We add a sibling DELETE.

- [ ] **Step 1.1: Write the failing tests**

Append to `apps/api/tests/test_app.py`:

```python
def test_delete_chat_memory_removes_existing_row(tmp_path: Path) -> None:
    client = _client(tmp_path)
    save_response = client.post("/api/chat/memory", json={"content": "remember this"})
    assert save_response.status_code == 200
    memory_id = save_response.json()["id"]

    delete_response = client.delete(f"/api/chat/memory/{memory_id}")
    assert delete_response.status_code == 204
    assert delete_response.content == b""

    list_response = client.get("/api/chat/memory")
    assert all(entry["id"] != memory_id for entry in list_response.json())


def test_delete_chat_memory_returns_404_for_unknown_id(tmp_path: Path) -> None:
    client = _client(tmp_path)
    delete_response = client.delete("/api/chat/memory/9999")
    assert delete_response.status_code == 404
    assert delete_response.json() == {"detail": "memory not found"}
```

If `_client` is named differently in `test_app.py`, use the same fixture/helper the existing `test_chat_endpoints_return_trace_failures_preference_and_memory` test uses (read that test to find the right name).

- [ ] **Step 1.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/api test -- -k "delete_chat_memory" -v`
Expected: 2 FAIL (route doesn't exist → 405 or 404 default).

- [ ] **Step 1.3: Add store method**

Append to `apps/api/learn_llm_api/progress_store.py` (under `list_chat_memories`):

```python
    def delete_chat_memory(self, memory_id: int) -> bool:
        with sqlite3.connect(self.database_path) as connection:
            cursor = connection.execute(
                "DELETE FROM chat_memories WHERE id = ?",
                (memory_id,),
            )
            return cursor.rowcount > 0
```

- [ ] **Step 1.4: Add DELETE route**

Insert after the POST `/api/chat/memory` route in `apps/api/learn_llm_api/app.py`:

```python
    @app.delete("/api/chat/memory/{memory_id}", status_code=204)
    def delete_chat_memory(memory_id: int) -> Response:
        deleted = store.delete_chat_memory(memory_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="memory not found")
        return Response(status_code=204)
```

Ensure `Response` is imported from `fastapi` at the top of the file (check existing imports — add `Response` to the existing import line if missing).

- [ ] **Step 1.5: Run tests and confirm PASS**

Run: `npm --prefix apps/api test -- -k "delete_chat_memory" -v`
Expected: 2 PASS.

Run the full API suite: `npm --prefix apps/api test`
Expected: 32 passing (30 baseline + 2 new).

- [ ] **Step 1.6: Commit**

```bash
git add apps/api/learn_llm_api/progress_store.py apps/api/learn_llm_api/app.py apps/api/tests/test_app.py
git commit -m "Add DELETE /api/chat/memory/{id}

Repository gains delete_chat_memory returning a bool for found/not-found.
Route returns 204 on success and 404 when no row matches. Two API tests
pin the contract."
```

---

## Task 2: Web client `deleteChatMemory`

**Files:**
- Modify: `apps/web/src/api.ts` — add helper
- Test: `apps/web/src/__tests__/api.test.ts` — add a single test if a file exists; otherwise inline-test via screens

**Context:** `apps/web/src/api.ts` already has `fetchChatMemory` and `saveChatMemory` (see [api.ts:110-122](apps/web/src/api.ts#L110-L122)). They use `readJson` which throws on non-OK. Delete returns 204 with empty body — needs a different path that doesn't try to parse JSON.

- [ ] **Step 2.1: Add the helper**

Insert after `saveChatMemory` in `apps/web/src/api.ts`:

```ts
export async function deleteChatMemory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/chat/memory/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete memory ${id}: ${response.status}`);
  }
}
```

- [ ] **Step 2.2: Sanity-check the type compiles**

Run: `npm --prefix apps/web exec -- tsc -p tsconfig.app.json --noEmit`
Expected: zero errors.

(No isolated unit test needed for this tiny helper — Task 3's memory editor tests will exercise it via `vi.spyOn(api, "deleteChatMemory")`.)

- [ ] **Step 2.3: Commit**

```bash
git add apps/web/src/api.ts
git commit -m "Add deleteChatMemory web client helper"
```

---

## Task 3: Memory drawer in /chat

**Files:**
- Create: `apps/web/src/screens/chat/MemoryDrawer.tsx`
- Create: `apps/web/src/screens/chat/MemoryList.tsx`
- Create: `apps/web/src/screens/chat/MemoryAddForm.tsx`
- Create: `apps/web/src/screens/chat/useMemoryEditor.ts`
- Modify: `apps/web/src/screens/chat/ChatComposer.tsx` — add "Memories" button
- Modify: `apps/web/src/screens/ChatPlayground.tsx` — drawer state + render
- Test: `apps/web/src/screens/__tests__/ChatPlayground.memory.test.tsx`

**Context:** The Sheet primitive is already installed at `apps/web/src/components/ui/sheet.tsx`. `ChatComposer`'s button row currently contains only Send. The composer's `onSend` and friends are passed as props from `ChatPlayground` via `useChatSession()` — keep that pattern; do NOT add memory state to `useChatSession`. The memory drawer state (open/close) lives in `ChatPlayground.tsx`; the memory data hook lives separately.

- [ ] **Step 3.1: Write the failing test**

Create `apps/web/src/screens/__tests__/ChatPlayground.memory.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatPlayground } from "../ChatPlayground";
import * as api from "../../api";
import type { ChatMemory } from "../../types";

const baseMemories: ChatMemory[] = [
  { id: 1, content: "user prefers tabs", createdAt: "2026-05-28T10:00:00Z" },
  { id: 2, content: "user is in IST",   createdAt: "2026-05-28T11:00:00Z" }
];

beforeEach(() => {
  vi.spyOn(api, "fetchChatMemory").mockResolvedValue([...baseMemories]);
  vi.spyOn(api, "saveChatMemory").mockImplementation(async (content: string) => ({
    id: 3, content, createdAt: "2026-05-28T12:00:00Z"
  }));
  vi.spyOn(api, "deleteChatMemory").mockResolvedValue();
  vi.spyOn(api, "runChatDemo").mockResolvedValue({} as never);
});
afterEach(() => vi.restoreAllMocks());

describe("ChatPlayground memory drawer", () => {
  it("opens the drawer when Memories is clicked and lists current memories", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
    expect(within(drawer).getByText(/user is in IST/)).toBeInTheDocument();
  });

  it("saving a new memory calls saveChatMemory and refreshes the list", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    const textarea = within(drawer).getByRole("textbox", { name: /new memory/i });
    fireEvent.change(textarea, { target: { value: "remember timezone" } });
    fireEvent.click(within(drawer).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(api.saveChatMemory).toHaveBeenCalledWith("remember timezone"));
  });

  it("clicking trash on a memory calls deleteChatMemory and removes it", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    const row = within(drawer).getByText(/user prefers tabs/).closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /delete memory 1/i }));
    await waitFor(() => expect(api.deleteChatMemory).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(within(drawer).queryByText(/user prefers tabs/)).not.toBeInTheDocument()
    );
  });

  it("failed delete restores the row and shows an inline alert", async () => {
    (api.deleteChatMemory as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(
      new Error("network down")
    );
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    const row = within(drawer).getByText(/user prefers tabs/).closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /delete memory 1/i }));
    await waitFor(() =>
      expect(within(drawer).getByText(/Couldn't delete memory/i)).toBeInTheDocument()
    );
    expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/web test -- src/screens/__tests__/ChatPlayground.memory.test.tsx --run`
Expected: all 4 FAIL — no Memories button yet.

- [ ] **Step 3.3: Create useMemoryEditor hook**

Create `apps/web/src/screens/chat/useMemoryEditor.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { deleteChatMemory, fetchChatMemory, saveChatMemory } from "../../api";
import type { ChatMemory } from "../../types";

export interface MemoryEditorState {
  memories: ChatMemory[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (content: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useMemoryEditor(open: boolean): MemoryEditorState {
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchChatMemory();
      setMemories(next);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const save = useCallback(async (content: string) => {
    setSaving(true);
    try {
      await saveChatMemory(content);
      await refresh();
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    const snapshot = memories;
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteChatMemory(id);
      setError(null);
    } catch {
      setMemories(snapshot);
      setError("Couldn't delete memory. Try again.");
    }
  }, [memories]);

  return { memories, loading, saving, error, refresh, save, remove };
}
```

- [ ] **Step 3.4: Create MemoryAddForm**

Create `apps/web/src/screens/chat/MemoryAddForm.tsx`:

```tsx
import { useState } from "react";
import { Button } from "../../components/ui/button";

interface MemoryAddFormProps {
  saving: boolean;
  onSave: (content: string) => Promise<void>;
}

export function MemoryAddForm({ saving, onSave }: MemoryAddFormProps) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!trimmed) return;
        await onSave(trimmed);
        setValue("");
      }}
    >
      <label htmlFor="memory-new" className="text-[12px] uppercase tracking-wide text-text-muted">
        New memory
      </label>
      <textarea
        id="memory-new"
        aria-label="new memory"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={saving}
        rows={3}
        className="w-full rounded-md border border-border bg-surface-1 p-2 text-[14px] font-mono"
        placeholder="Tell the assistant something to remember…"
      />
      <Button type="submit" disabled={saving || !trimmed} size="sm">
        Save
      </Button>
    </form>
  );
}
```

- [ ] **Step 3.5: Create MemoryList**

Create `apps/web/src/screens/chat/MemoryList.tsx`:

```tsx
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { ChatMemory } from "../../types";

interface MemoryListProps {
  memories: ChatMemory[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export function MemoryList({ memories, loading, onDelete }: MemoryListProps) {
  if (loading && memories.length === 0) {
    return <p className="text-text-muted text-[14px]">Loading memories…</p>;
  }
  if (memories.length === 0) {
    return <p className="text-text-muted text-[14px]">No memories saved yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {memories.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-1 p-2"
        >
          <div className="space-y-1">
            <p className="font-mono text-[13px] break-words">{m.content}</p>
            <p className="text-[11px] text-text-muted">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`delete memory ${m.id}`}
            onClick={() => onDelete(m.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3.6: Create MemoryDrawer**

Create `apps/web/src/screens/chat/MemoryDrawer.tsx`:

```tsx
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Separator } from "../../components/ui/separator";
import { MemoryAddForm } from "./MemoryAddForm";
import { MemoryList } from "./MemoryList";
import { useMemoryEditor } from "./useMemoryEditor";

interface MemoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemoryDrawer({ open, onOpenChange }: MemoryDrawerProps) {
  const editor = useMemoryEditor(open);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md space-y-4">
        <SheetHeader>
          <SheetTitle>Saved memories</SheetTitle>
          <SheetDescription>
            Memories the assistant can recall when memory mode is set to Saved.
          </SheetDescription>
        </SheetHeader>
        <MemoryAddForm saving={editor.saving} onSave={editor.save} />
        <Separator />
        {editor.error ? (
          <p role="alert" className="text-[13px] text-red-400">
            {editor.error}
          </p>
        ) : null}
        <MemoryList
          memories={editor.memories}
          loading={editor.loading}
          onDelete={(id) => void editor.remove(id)}
        />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3.7: Add the Memories button to the composer**

Modify `apps/web/src/screens/chat/ChatComposer.tsx`. Add an optional `onOpenMemories` prop to the interface; render a secondary button beside Send when the prop is provided. Concrete diff:

```tsx
// add to ChatComposerProps:
//   onOpenMemories?: () => void;

// at the bottom of the button row (next to <Button onClick={onSend}>Send</Button>):
{onOpenMemories ? (
  <Button type="button" variant="outline" size="sm" onClick={onOpenMemories}>
    Memories
  </Button>
) : null}
```

If the existing button row uses a `<div className="flex ...">`, put the new button inside that same row.

- [ ] **Step 3.8: Wire drawer into ChatPlayground**

Modify `apps/web/src/screens/ChatPlayground.tsx` — `ChatPlaygroundBody`:

```tsx
import { useState } from "react";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatReply } from "./chat/ChatReply";
import { TraceTimeline } from "./chat/TraceTimeline";
import { useChatSession } from "./chat/useChatSession";
import { MemoryDrawer } from "./chat/MemoryDrawer";

export function ChatPlaygroundBody() {
  const s = useChatSession();
  const [memoryOpen, setMemoryOpen] = useState(false);
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="space-y-4">
        <ChatComposer
          message={s.message}
          mode={s.mode}
          answerStyle={s.answerStyle}
          toolMode={s.toolMode}
          memoryMode={s.memoryMode}
          loading={s.loading}
          onMessageChange={s.setMessage}
          onModeChange={s.setMode}
          onAnswerStyleChange={s.setAnswerStyle}
          onToolModeChange={s.setToolMode}
          onMemoryModeChange={s.setMemoryMode}
          onSend={s.send}
          onOpenMemories={() => setMemoryOpen(true)}
        />
        <ChatReply
          finalReply={s.trace?.finalReply ?? null}
          loading={s.loading}
          error={s.error}
          onRetry={s.send}
        />
      </div>
      <div>
        <TraceTimeline trace={s.trace} loading={s.loading} />
      </div>
      <MemoryDrawer open={memoryOpen} onOpenChange={setMemoryOpen} />
    </div>
  );
}
```

(Keep the existing `ChatPlayground` exported page wrapper unchanged.)

- [ ] **Step 3.9: Run tests and confirm PASS**

Run: `npm --prefix apps/web test -- src/screens/__tests__/ChatPlayground.memory.test.tsx --run`
Expected: 4 PASS.

Run the full web suite: `npm --prefix apps/web test -- --run`
Expected: 189 passing (185 baseline + 4 new). Existing `ChatPlayground.test.tsx` must continue to pass.

- [ ] **Step 3.10: Commit**

```bash
git add apps/web/src/screens/chat apps/web/src/screens/ChatPlayground.tsx apps/web/src/screens/__tests__/ChatPlayground.memory.test.tsx
git commit -m "Add chat memory drawer

Drawer mounts inside ChatPlayground as a shadcn Sheet; useMemoryEditor
owns list/save/delete. Composer gains a 'Memories' button. Delete is
optimistic with snapshot rollback on failure plus an inline alert."
```

---

## Task 4: /glossary screen

**Files:**
- Create: `apps/web/src/screens/Glossary.tsx`
- Create: `apps/web/src/screens/glossary/GlossarySearch.tsx`
- Create: `apps/web/src/screens/glossary/GlossaryGrid.tsx`
- Create: `apps/web/src/screens/glossary/TermCard.tsx`
- Create: `apps/web/src/screens/glossary/useGlossaryFilter.ts`
- Modify: `apps/web/src/routes.tsx` — replace `GlossaryRoute` with `<Glossary>`
- Test: `apps/web/src/screens/__tests__/Glossary.test.tsx`

**Context:** `useCourseData()` exposes `glossaryEntries: GlossaryEntry[]`. The type has `term`, `shortDefinition`, `explanation`, `relatedConcepts` (see `apps/web/src/types.ts:36-42`). The existing `<GlossaryRoute>` in `apps/web/src/screens/RouteWrappers.tsx:34-44` passes all entries through the legacy `GlossaryPanel`. We replace that route with a polished search + grid + expandable cards.

- [ ] **Step 4.1: Write the failing test**

Create `apps/web/src/screens/__tests__/Glossary.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Glossary } from "../Glossary";
import { CourseDataProvider } from "../../shell/CourseDataProvider";
import type { GlossaryEntry } from "../../types";

const entries: GlossaryEntry[] = [
  { id: "g.token", term: "Token", shortDefinition: "An atomic chunk.", explanation: "A token is a unit produced by a tokenizer.", relatedConcepts: ["c.tokenization"] },
  { id: "g.attn", term: "Attention", shortDefinition: "A weighted lookup.", explanation: "Attention scores let one token look at others.", relatedConcepts: ["c.attention"] }
];

function renderWithProvider(initial = "/glossary") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <CourseDataProvider value={{ tracks: [], glossaryEntries: entries, recentArtifacts: [], missedTopics: [], progress: [], continueConceptId: null, loading: false, error: null, refresh: async () => {} }}>
        <Glossary />
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("Glossary", () => {
  it("renders all terms by default with the short definition visible", () => {
    renderWithProvider();
    expect(screen.getByRole("heading", { name: /Glossary/i })).toBeInTheDocument();
    expect(screen.getByText(/An atomic chunk/)).toBeInTheDocument();
    expect(screen.getByText(/A weighted lookup/)).toBeInTheDocument();
  });

  it("?q= filters the visible list case-insensitively", () => {
    renderWithProvider("/glossary?q=atte");
    expect(screen.queryByText(/An atomic chunk/)).not.toBeInTheDocument();
    expect(screen.getByText(/A weighted lookup/)).toBeInTheDocument();
  });

  it("typing in search updates the URL and the list", () => {
    renderWithProvider();
    fireEvent.change(screen.getByRole("searchbox", { name: /search terms/i }), { target: { value: "token" } });
    expect(screen.getByText(/An atomic chunk/)).toBeInTheDocument();
    expect(screen.queryByText(/A weighted lookup/)).not.toBeInTheDocument();
  });

  it("clicking a card reveals the long explanation and a related-concept link", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText(/An atomic chunk/));
    expect(screen.getByText(/A token is a unit produced/)).toBeInTheDocument();
    const chip = screen.getByRole("link", { name: /c\.tokenization/i });
    expect(chip).toHaveAttribute("href", "/concepts/c.tokenization");
  });

  it("shows an empty state when no terms match", () => {
    renderWithProvider("/glossary?q=zzz");
    expect(screen.getByText(/No terms match/i)).toBeInTheDocument();
  });
});
```

**Note:** if `CourseDataProvider` doesn't accept a `value` prop, instead use the existing test pattern from `apps/web/src/screens/__tests__/ChatPlayground.test.tsx`-style mocking — i.e. `vi.mock("../../shell/CourseDataProvider", () => ({ useCourseData: () => ({ glossaryEntries: entries }) }))`. Read `CourseDataProvider.tsx` once to determine the correct pattern; whichever is used elsewhere in the existing tests is the right one.

- [ ] **Step 4.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Glossary.test.tsx --run`
Expected: 5 FAIL — Glossary doesn't exist.

- [ ] **Step 4.3: Create useGlossaryFilter**

Create `apps/web/src/screens/glossary/useGlossaryFilter.ts`:

```ts
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { GlossaryEntry } from "../../types";

export function useGlossaryFilter(entries: GlossaryEntry[]) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      (e.term + " " + e.shortDefinition + " " + e.explanation).toLowerCase().includes(q)
    );
  }, [entries, query]);

  const setQuery = (next: string) => {
    const merged = new URLSearchParams(params);
    if (next.trim()) merged.set("q", next);
    else merged.delete("q");
    setParams(merged, { replace: true });
  };

  return { query, setQuery, filtered };
}
```

- [ ] **Step 4.4: Create GlossarySearch**

Create `apps/web/src/screens/glossary/GlossarySearch.tsx`:

```tsx
interface GlossarySearchProps {
  query: string;
  total: number;
  shown: number;
  onChange: (next: string) => void;
}

export function GlossarySearch({ query, total, shown, onChange }: GlossarySearchProps) {
  return (
    <div className="space-y-1">
      <input
        type="search"
        role="searchbox"
        aria-label="search terms"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search terms…"
        className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-[14px]"
      />
      <p className="text-[12px] text-text-muted">
        Showing {shown} of {total} terms
      </p>
    </div>
  );
}
```

- [ ] **Step 4.5: Create TermCard**

Create `apps/web/src/screens/glossary/TermCard.tsx`:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import type { GlossaryEntry } from "../../types";

interface TermCardProps {
  entry: GlossaryEntry;
}

export function TermCard({ entry }: TermCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      onClick={() => setExpanded((v) => !v)}
      className="cursor-pointer transition hover:border-accent"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-[16px] font-semibold">{entry.term}</CardTitle>
        {entry.relatedConcepts.length > 0 ? (
          <Badge variant="secondary">{entry.relatedConcepts.length} related</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[14px]">{entry.shortDefinition}</p>
        {expanded ? (
          <>
            <Separator />
            <p className="text-[13px] text-text-muted">{entry.explanation}</p>
            {entry.relatedConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {entry.relatedConcepts.map((id) => (
                  <Link
                    key={id}
                    to={`/concepts/${id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="outline">{id}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4.6: Create GlossaryGrid**

Create `apps/web/src/screens/glossary/GlossaryGrid.tsx`:

```tsx
import { Stagger, Reveal, panelEnter } from "../../lib/motion";
import { TermCard } from "./TermCard";
import type { GlossaryEntry } from "../../types";

interface GlossaryGridProps {
  entries: GlossaryEntry[];
  query: string;
}

export function GlossaryGrid({ entries, query }: GlossaryGridProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-text-muted py-12">
        No terms match <span className="font-mono">"{query}"</span>.
      </p>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((e) => (
        <Reveal key={e.id} variants={panelEnter}>
          <TermCard entry={e} />
        </Reveal>
      ))}
    </Stagger>
  );
}
```

Before implementing, verify the exports `Stagger`, `Reveal`, `panelEnter` exist in `apps/web/src/lib/motion.ts` (or `.tsx`). Use the same exports the existing `TraceTimeline` uses — match its imports literally.

- [ ] **Step 4.7: Create Glossary screen**

Create `apps/web/src/screens/Glossary.tsx`:

```tsx
import { useCourseData } from "../shell/CourseDataProvider";
import { useGlossaryFilter } from "./glossary/useGlossaryFilter";
import { GlossarySearch } from "./glossary/GlossarySearch";
import { GlossaryGrid } from "./glossary/GlossaryGrid";

export function Glossary() {
  const { glossaryEntries } = useCourseData();
  const { query, setQuery, filtered } = useGlossaryFilter(glossaryEntries);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Reference</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Glossary</h1>
        <p className="text-text-muted">Search every term you've encountered.</p>
      </header>
      <GlossarySearch
        query={query}
        total={glossaryEntries.length}
        shown={filtered.length}
        onChange={setQuery}
      />
      <GlossaryGrid entries={filtered} query={query} />
    </div>
  );
}
```

- [ ] **Step 4.8: Wire route**

Modify `apps/web/src/routes.tsx`:

- Replace import line `import { ArtifactsRoute, FailuresRoute, GlossaryRoute, TracksRoute } from "./screens/RouteWrappers";` to drop `GlossaryRoute`.
- Add `import { Glossary } from "./screens/Glossary";`.
- Change `<Route path="glossary" element={<GlossaryRoute />} />` to `<Route path="glossary" element={<Glossary />} />`.

- [ ] **Step 4.9: Run tests and confirm PASS**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Glossary.test.tsx --run`
Expected: 5 PASS.

- [ ] **Step 4.10: Commit**

```bash
git add apps/web/src/screens/Glossary.tsx apps/web/src/screens/glossary apps/web/src/screens/__tests__/Glossary.test.tsx apps/web/src/routes.tsx
git commit -m "Polish /glossary

Searchable grid of expandable term cards with related-concept chips
that link to /concepts/:id. URL-synced search via ?q=. Replaces the
legacy GlossaryRoute wrapper."
```

---

## Task 5: /tracks screen

**Files:**
- Create: `apps/web/src/screens/Tracks.tsx`
- Create: `apps/web/src/screens/tracks/TrackCard.tsx`
- Create: `apps/web/src/screens/tracks/TrackProgress.tsx`
- Create: `apps/web/src/screens/tracks/useTrackStats.ts`
- Modify: `apps/web/src/routes.tsx` — replace `TracksRoute` with `<Tracks>`
- Test: `apps/web/src/screens/__tests__/Tracks.test.tsx`

**Context:** `useCourseData()` exposes `tracks: Track[]` and `progress: ProgressRecord[]`. `Track.concepts: Concept[]` already comes ordered. `ProgressRecord.status` is the key — "complete" / "learning" / "missed" / etc. The Concept Map's status precedence (sub-project 5) is the source of truth.

- [ ] **Step 5.1: Write the failing test**

Create `apps/web/src/screens/__tests__/Tracks.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Tracks } from "../Tracks";
import type { Track, ProgressRecord } from "../../types";

const tracks: Track[] = [
  {
    id: "t.foundations", title: "Foundations", summary: "Where it starts.", order: 1,
    concepts: [
      { id: "c.a", title: "A", order: 1, prerequisites: [], lessonPath: "", lessonMarkdown: "", lab: null, visual: null, checkpoint: { question: "", answer: "" }, glossary: [], status: "open" },
      { id: "c.b", title: "B", order: 2, prerequisites: [], lessonPath: "", lessonMarkdown: "", lab: null, visual: null, checkpoint: { question: "", answer: "" }, glossary: [], status: "open" }
    ]
  }
];
const progress: ProgressRecord[] = [
  { conceptId: "c.a", status: "complete", confidence: 5, note: "", revisit: false }
];

vi.mock("../../shell/CourseDataProvider", () => ({
  useCourseData: () => ({ tracks, progress, glossaryEntries: [], recentArtifacts: [], missedTopics: [], continueConceptId: null, loading: false, error: null, refresh: async () => {} })
}));

import { vi } from "vitest";

describe("Tracks", () => {
  it("renders one card per track with the title", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Foundations/i })).toBeInTheDocument();
  });

  it("renders the correct completion percentage from progress", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    expect(screen.getByText(/1 \/ 2 concepts complete/i)).toBeInTheDocument();
  });

  it("Start track link targets the first non-complete concept", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    const start = screen.getByRole("link", { name: /Start track/i });
    expect(start).toHaveAttribute("href", "/concepts/c.b");
  });

  it("renders a status dot per concept row", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    const row = screen.getByText("A").closest("li") as HTMLElement;
    expect(within(row).getByTestId("status-dot")).toHaveAttribute("data-status", "complete");
  });
});
```

If `vi.mock` placement at the bottom causes hoisting confusion, put the `vi.mock` and `import { vi } from "vitest"` BEFORE the `import { Tracks } from "../Tracks"` line — Vitest hoists `vi.mock` regardless, but referencing `tracks`/`progress` declared above is fine.

- [ ] **Step 5.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Tracks.test.tsx --run`
Expected: 4 FAIL.

- [ ] **Step 5.3: Create useTrackStats**

Create `apps/web/src/screens/tracks/useTrackStats.ts`:

```ts
import type { ProgressRecord, Track } from "../../types";

export interface TrackStats {
  total: number;
  completed: number;
  percent: number;
  nextConceptId: string;
}

export function useTrackStats(track: Track, progress: ProgressRecord[]): TrackStats {
  const byConcept = new Map(progress.map((p) => [p.conceptId, p]));
  const total = track.concepts.length;
  const completed = track.concepts.filter((c) => byConcept.get(c.id)?.status === "complete").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const next = track.concepts.find((c) => byConcept.get(c.id)?.status !== "complete");
  const nextConceptId = (next ?? track.concepts[0])?.id ?? "";
  return { total, completed, percent, nextConceptId };
}
```

- [ ] **Step 5.4: Create TrackProgress**

Create `apps/web/src/screens/tracks/TrackProgress.tsx`:

```tsx
interface TrackProgressProps {
  completed: number;
  total: number;
  percent: number;
}

export function TrackProgress({ completed, total, percent }: TrackProgressProps) {
  return (
    <div className="space-y-1">
      <div className="h-1 w-full overflow-hidden rounded bg-surface-2">
        <div
          className="h-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
          data-testid="track-progress-bar"
        />
      </div>
      <p className="text-[12px] text-text-muted">
        {completed} / {total} concepts complete
      </p>
    </div>
  );
}
```

- [ ] **Step 5.5: Create TrackCard**

Create `apps/web/src/screens/tracks/TrackCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { ProgressRecord, Track } from "../../types";
import { TrackProgress } from "./TrackProgress";
import { useTrackStats } from "./useTrackStats";

interface TrackCardProps {
  track: Track;
  progress: ProgressRecord[];
}

const STATUS_PRECEDENCE: Record<string, number> = {
  missed: 3, complete: 2, learning: 1, open: 0
};

function dotStatus(conceptId: string, progress: ProgressRecord[]) {
  const record = progress.find((p) => p.conceptId === conceptId);
  if (!record) return "open";
  return record.status in STATUS_PRECEDENCE ? record.status : "open";
}

export function TrackCard({ track, progress }: TrackCardProps) {
  const stats = useTrackStats(track, progress);
  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-[12px] uppercase tracking-wide text-text-muted font-mono">
          {String(track.order).padStart(2, "0")}
        </p>
        <CardTitle>{track.title}</CardTitle>
        <p className="text-[13px] text-text-muted">{track.summary}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <TrackProgress completed={stats.completed} total={stats.total} percent={stats.percent} />
        <ul className="space-y-1">
          {track.concepts.map((c) => {
            const status = dotStatus(c.id, progress);
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 font-mono text-[13px]">
                <span className="flex items-center gap-2">
                  <span
                    data-testid="status-dot"
                    data-status={status}
                    className="size-2 rounded-full bg-accent"
                  />
                  <span>{c.order}. {c.title}</span>
                </span>
                <Link to={`/concepts/${c.id}`} className="text-accent hover:underline">Open →</Link>
              </li>
            );
          })}
        </ul>
        <Link to={`/concepts/${stats.nextConceptId}`}>
          <Button size="sm">Start track →</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5.6: Create Tracks screen**

Create `apps/web/src/screens/Tracks.tsx`:

```tsx
import { useCourseData } from "../shell/CourseDataProvider";
import { Stagger, Reveal, panelEnter } from "../lib/motion";
import { TrackCard } from "./tracks/TrackCard";

export function Tracks() {
  const { tracks, progress } = useCourseData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Map of the course</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Tracks</h1>
        <p className="text-text-muted">Each track is a guided path through related concepts.</p>
      </header>
      <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tracks.map((t) => (
          <Reveal key={t.id} variants={panelEnter}>
            <TrackCard track={t} progress={progress} />
          </Reveal>
        ))}
      </Stagger>
    </div>
  );
}
```

- [ ] **Step 5.7: Wire route**

Modify `apps/web/src/routes.tsx`:

- Drop `TracksRoute` from the RouteWrappers import.
- Add `import { Tracks } from "./screens/Tracks";`.
- Change `<Route path="tracks" element={<TracksRoute />} />` to `<Route path="tracks" element={<Tracks />} />`.

- [ ] **Step 5.8: Run tests and confirm PASS**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Tracks.test.tsx --run`
Expected: 4 PASS.

- [ ] **Step 5.9: Commit**

```bash
git add apps/web/src/screens/Tracks.tsx apps/web/src/screens/tracks apps/web/src/screens/__tests__/Tracks.test.tsx apps/web/src/routes.tsx
git commit -m "Polish /tracks

Track cards with completion %, per-concept status dots, and a Start
track button that jumps to the first non-complete concept. Replaces
the legacy TracksRoute wrapper."
```

---

## Task 6: /artifacts screen

**Files:**
- Create: `apps/web/src/screens/Artifacts.tsx`
- Create: `apps/web/src/screens/artifacts/ArtifactsByLab.tsx`
- Create: `apps/web/src/screens/artifacts/ArtifactCard.tsx`
- Create: `apps/web/src/screens/artifacts/thumbs/AttentionThumb.tsx`
- Create: `apps/web/src/screens/artifacts/thumbs/LossThumb.tsx`
- Create: `apps/web/src/screens/artifacts/thumbs/GenerationThumb.tsx`
- Create: `apps/web/src/screens/artifacts/thumbs/ComparisonThumb.tsx`
- Create: `apps/web/src/screens/artifacts/thumbs/FailureThumb.tsx`
- Modify: `apps/web/src/routes.tsx` — replace `ArtifactsRoute` with `<Artifacts>`
- Test: `apps/web/src/screens/__tests__/Artifacts.test.tsx`

**Context:** `useCourseData()` exposes `recentArtifacts: LabRunArtifact[]`. Each has `labId`, `conceptId`, `artifactPath`, `artifact` (unknown shape), `status`, `error`. The artifact union is what the legacy `ArtifactPreview` already detects — see `apps/web/src/components/ArtifactPreview.tsx:25-75`. We reuse that detection logic in `ArtifactCard` and dispatch to thumbs. The viz library at `apps/web/src/viz/` already has `AttentionMap` and `LossCurve`; we render minimal variants by passing tiny dimensions.

- [ ] **Step 6.1: Write the failing test**

Create `apps/web/src/screens/__tests__/Artifacts.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LabRunArtifact } from "../../types";

const baseArtifact = (labId: string, artifact: unknown): LabRunArtifact => ({
  labId, conceptId: `c.${labId}`, artifactPath: `/${labId}.json`, artifact, status: "success", error: ""
});

let stub: LabRunArtifact[] = [];
vi.mock("../../shell/CourseDataProvider", () => ({
  useCourseData: () => ({ tracks: [], progress: [], glossaryEntries: [], recentArtifacts: stub, missedTopics: [], continueConceptId: null, loading: false, error: null, refresh: async () => {} })
}));

import { Artifacts } from "../Artifacts";

describe("Artifacts", () => {
  it("renders the empty state when there are no artifacts", () => {
    stub = [];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText(/No artifacts yet/i)).toBeInTheDocument();
  });

  it("groups artifacts by lab", () => {
    stub = [
      baseArtifact("lab-a", { generation: { generatedText: "hi there" } }),
      baseArtifact("lab-a", { generation: { generatedText: "again" } }),
      baseArtifact("lab-b", { failure: { expectedFact: "x", explanation: "y" } })
    ];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /lab-a/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lab-b/i })).toBeInTheDocument();
  });

  it("renders the matching thumb for each known artifact shape", () => {
    stub = [
      baseArtifact("a", { attention: { weights: [[0.1, 0.9]] } }),
      baseArtifact("b", { training: { lossHistory: [1.0, 0.5] } }),
      baseArtifact("c", { generation: { generatedText: "hello world" } }),
      baseArtifact("d", { comparison: { baseCompletion: "raw", assistantFormatted: "polished" } }),
      baseArtifact("e", { failure: { expectedFact: "F", explanation: "why" } })
    ];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByTestId("thumb-attention")).toBeInTheDocument();
    expect(screen.getByTestId("thumb-loss")).toBeInTheDocument();
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
    expect(screen.getByText(/polished/)).toBeInTheDocument();
    expect(screen.getByText(/why/)).toBeInTheDocument();
  });

  it("falls back to a 'No preview available' message for unknown shapes", () => {
    stub = [baseArtifact("z", { mystery: 1 })];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText(/No preview available/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Artifacts.test.tsx --run`
Expected: 4 FAIL.

- [ ] **Step 6.3: Create AttentionThumb**

Create `apps/web/src/screens/artifacts/thumbs/AttentionThumb.tsx`:

```tsx
interface AttentionThumbProps {
  weights: number[][];
}

export function AttentionThumb({ weights }: AttentionThumbProps) {
  const rows = weights.length;
  const cols = weights[0]?.length ?? 0;
  const cell = 96 / Math.max(rows, cols, 1);
  return (
    <svg width={96} height={96} data-testid="thumb-attention" aria-label="attention preview">
      {weights.map((row, r) =>
        row.map((w, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            fill={`rgba(34, 211, 238, ${Math.max(0.05, Math.min(1, Number(w) || 0))})`}
          />
        ))
      )}
    </svg>
  );
}
```

- [ ] **Step 6.4: Create LossThumb**

Create `apps/web/src/screens/artifacts/thumbs/LossThumb.tsx`:

```tsx
interface LossThumbProps {
  history: number[];
}

export function LossThumb({ history }: LossThumbProps) {
  if (history.length === 0) return null;
  const w = 144, h = 56, pad = 4;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(history.length - 1, 1);
  const points = history
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} data-testid="thumb-loss" aria-label="loss preview">
      <polyline fill="none" stroke="rgb(34, 211, 238)" strokeWidth={1.5} points={points} />
    </svg>
  );
}
```

- [ ] **Step 6.5: Create the three text-based thumbs**

Create `apps/web/src/screens/artifacts/thumbs/GenerationThumb.tsx`:

```tsx
interface GenerationThumbProps {
  text: string;
}

export function GenerationThumb({ text }: GenerationThumbProps) {
  const truncated = text.length > 120 ? text.slice(0, 120) + "…" : text;
  return (
    <p className="font-mono text-[12px] text-text-muted whitespace-pre-wrap" data-testid="thumb-generation">
      {truncated}
    </p>
  );
}
```

Create `apps/web/src/screens/artifacts/thumbs/ComparisonThumb.tsx`:

```tsx
interface ComparisonThumbProps {
  base?: string;
  assistant?: string;
}

export function ComparisonThumb({ base, assistant }: ComparisonThumbProps) {
  return (
    <div className="space-y-1 text-[12px] font-mono" data-testid="thumb-comparison">
      {base ? <p><span className="text-text-muted">base:</span> {base}</p> : null}
      {assistant ? <p><span className="text-text-muted">assistant:</span> {assistant}</p> : null}
    </div>
  );
}
```

Create `apps/web/src/screens/artifacts/thumbs/FailureThumb.tsx`:

```tsx
interface FailureThumbProps {
  expectedFact?: string;
  explanation?: string;
}

export function FailureThumb({ expectedFact, explanation }: FailureThumbProps) {
  return (
    <div className="space-y-1 text-[12px]" data-testid="thumb-failure">
      {expectedFact ? <p><span className="text-text-muted">expected:</span> {expectedFact}</p> : null}
      {explanation ? <p className="text-text-muted">{explanation}</p> : null}
    </div>
  );
}
```

- [ ] **Step 6.6: Create ArtifactCard**

Create `apps/web/src/screens/artifacts/ArtifactCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type { LabRunArtifact } from "../../types";
import { AttentionThumb } from "./thumbs/AttentionThumb";
import { LossThumb } from "./thumbs/LossThumb";
import { GenerationThumb } from "./thumbs/GenerationThumb";
import { ComparisonThumb } from "./thumbs/ComparisonThumb";
import { FailureThumb } from "./thumbs/FailureThumb";

type R = Record<string, unknown>;
const isRecord = (v: unknown): v is R => typeof v === "object" && v !== null && !Array.isArray(v);

function pickThumb(artifact: unknown) {
  if (!isRecord(artifact)) return null;
  const attention = isRecord(artifact.attention) ? artifact.attention : null;
  if (attention && Array.isArray(attention.weights)) {
    return <AttentionThumb weights={attention.weights as number[][]} />;
  }
  const training = isRecord(artifact.training) ? artifact.training : null;
  if (training && Array.isArray(training.lossHistory)) {
    return <LossThumb history={training.lossHistory as number[]} />;
  }
  const generation = isRecord(artifact.generation) ? artifact.generation : null;
  if (generation && typeof generation.generatedText === "string") {
    return <GenerationThumb text={generation.generatedText} />;
  }
  const comparison = isRecord(artifact.comparison) ? artifact.comparison : null;
  if (comparison) {
    return (
      <ComparisonThumb
        base={typeof comparison.baseCompletion === "string" ? comparison.baseCompletion : undefined}
        assistant={typeof comparison.assistantFormatted === "string" ? comparison.assistantFormatted : undefined}
      />
    );
  }
  const failure = isRecord(artifact.failure) ? artifact.failure : null;
  if (failure) {
    return (
      <FailureThumb
        expectedFact={typeof failure.expectedFact === "string" ? failure.expectedFact : undefined}
        explanation={typeof failure.explanation === "string" ? failure.explanation : undefined}
      />
    );
  }
  return null;
}

interface ArtifactCardProps {
  artifact: LabRunArtifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const thumb = pickThumb(artifact.artifact);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <Link to={`/concepts/${artifact.conceptId}`} className="font-mono text-[12px] text-accent hover:underline">
          {artifact.conceptId}
        </Link>
        <Badge variant={artifact.status === "success" ? "secondary" : "destructive"}>
          {artifact.status}
        </Badge>
      </CardHeader>
      <CardContent>
        {thumb ?? <p className="text-[12px] text-text-muted">No preview available</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6.7: Create ArtifactsByLab**

Create `apps/web/src/screens/artifacts/ArtifactsByLab.tsx`:

```tsx
import { Stagger, Reveal, panelEnter } from "../../lib/motion";
import { Badge } from "../../components/ui/badge";
import type { LabRunArtifact } from "../../types";
import { ArtifactCard } from "./ArtifactCard";

interface ArtifactsByLabProps {
  artifacts: LabRunArtifact[];
}

function groupByLab(artifacts: LabRunArtifact[]): Array<{ labId: string; items: LabRunArtifact[] }> {
  const order: string[] = [];
  const map = new Map<string, LabRunArtifact[]>();
  for (const a of artifacts) {
    if (!map.has(a.labId)) {
      map.set(a.labId, []);
      order.push(a.labId);
    }
    map.get(a.labId)!.push(a);
  }
  return order
    .map((labId) => ({ labId, items: map.get(labId)! }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function ArtifactsByLab({ artifacts }: ArtifactsByLabProps) {
  const groups = groupByLab(artifacts);
  return (
    <div className="space-y-8">
      {groups.map(({ labId, items }) => (
        <section key={labId} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-[14px] text-accent">{labId}</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((a, i) => (
              <Reveal key={`${a.artifactPath}-${i}`} variants={panelEnter}>
                <ArtifactCard artifact={a} />
              </Reveal>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 6.8: Create Artifacts screen**

Create `apps/web/src/screens/Artifacts.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useCourseData } from "../shell/CourseDataProvider";
import { Card, CardContent } from "../components/ui/card";
import { ArtifactsByLab } from "./artifacts/ArtifactsByLab";

export function Artifacts() {
  const { recentArtifacts } = useCourseData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Runs</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Artifacts from your labs</h1>
        <p className="text-text-muted">Recent lab outputs grouped by experiment.</p>
      </header>
      {recentArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-text-muted">No artifacts yet. Run a lab from a concept page to see results here.</p>
            <Link to="/concepts" className="text-accent hover:underline">Open Concept Map →</Link>
          </CardContent>
        </Card>
      ) : (
        <ArtifactsByLab artifacts={recentArtifacts} />
      )}
    </div>
  );
}
```

- [ ] **Step 6.9: Wire route**

Modify `apps/web/src/routes.tsx`:

- Drop `ArtifactsRoute` from the RouteWrappers import.
- Add `import { Artifacts } from "./screens/Artifacts";`.
- Change `<Route path="artifacts" element={<ArtifactsRoute />} />` to `<Route path="artifacts" element={<Artifacts />} />`.

- [ ] **Step 6.10: Run tests and confirm PASS**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Artifacts.test.tsx --run`
Expected: 4 PASS.

- [ ] **Step 6.11: Commit**

```bash
git add apps/web/src/screens/Artifacts.tsx apps/web/src/screens/artifacts apps/web/src/screens/__tests__/Artifacts.test.tsx apps/web/src/routes.tsx
git commit -m "Polish /artifacts

Artifacts grouped by lab with type-aware thumb renderers
(attention / loss / generation / comparison / factuality failure)
plus an empty state with a Concept Map link. Replaces the legacy
ArtifactsRoute wrapper."
```

---

## Task 7: /failures screen

**Files:**
- Create: `apps/web/src/screens/Failures.tsx`
- Create: `apps/web/src/screens/failures/FailuresByCategory.tsx`
- Create: `apps/web/src/screens/failures/FailureCard.tsx`
- Create: `apps/web/src/screens/failures/PreferenceSection.tsx`
- Create: `apps/web/src/screens/failures/useFailuresData.ts`
- Modify: `apps/web/src/routes.tsx` — replace `FailuresRoute` with `<Failures>`
- Test: `apps/web/src/screens/__tests__/Failures.test.tsx`

**Context:** The API helpers already exist: `fetchChatFailures()` returns `FailureCase[]` and `fetchChatPreference()` returns `PreferenceSimulation`. Both shapes are in `apps/web/src/types.ts:107-130`. The current `FailuresRoute` (see `RouteWrappers.tsx:63-74`) mounts a flat list — replaced with grouped expandable cards + a preference section.

- [ ] **Step 7.1: Write the failing test**

Create `apps/web/src/screens/__tests__/Failures.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Failures } from "../Failures";
import * as api from "../../api";
import type { FailureCase, PreferenceSimulation } from "../../types";

const failures: FailureCase[] = [
  { id: "f.1", category: "counting", prompt: "How many Rs?", modelOnlyOutput: "two", explanation: "It can't count letters reliably.", betterStrategy: "Use a tool.", relatedConcepts: ["c.token"] },
  { id: "f.2", category: "counting", prompt: "Letters in apple?", modelOnlyOutput: "six", explanation: "Same root cause.", betterStrategy: "Token-aware tool.", relatedConcepts: [] },
  { id: "f.3", category: "spelling", prompt: "Spell quay", modelOnlyOutput: "kay", explanation: "Bad alignment.", betterStrategy: "Phonetics.", relatedConcepts: [] }
];

const preference: PreferenceSimulation = {
  prompt: "Pick the politer reply.",
  candidates: [
    { id: "p.a", response: "Sure thing.", traits: ["polite"] },
    { id: "p.b", response: "Whatever.", traits: ["curt"] }
  ],
  rewardScores: { "p.a": 0.9, "p.b": 0.1 },
  ranking: ["p.a", "p.b"],
  winner: { id: "p.a", response: "Sure thing.", traits: ["polite"] },
  explanation: "Politeness scored higher."
};

beforeEach(() => {
  vi.spyOn(api, "fetchChatFailures").mockResolvedValue(failures);
  vi.spyOn(api, "fetchChatPreference").mockResolvedValue(preference);
});
afterEach(() => vi.restoreAllMocks());

describe("Failures", () => {
  it("renders a category section per failure category", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /counting/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /spelling/i })).toBeInTheDocument();
    });
  });

  it("clicking a failure card reveals explanation and strategy", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    const promptCard = await screen.findByText(/How many Rs\?/i);
    fireEvent.click(promptCard);
    expect(screen.getByText(/can't count letters reliably/i)).toBeInTheDocument();
    expect(screen.getByText(/Use a tool/i)).toBeInTheDocument();
  });

  it("renders the PreferenceSection with the winner badged", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Preference simulation/i })).toBeInTheDocument();
    });
    const winnerCard = screen.getByText(/Sure thing/).closest("[data-candidate]") as HTMLElement;
    expect(winnerCard).toHaveAttribute("data-winner", "true");
  });
});
```

- [ ] **Step 7.2: Run tests and confirm FAIL**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Failures.test.tsx --run`
Expected: 3 FAIL.

- [ ] **Step 7.3: Create useFailuresData**

Create `apps/web/src/screens/failures/useFailuresData.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { fetchChatFailures, fetchChatPreference } from "../../api";
import type { FailureCase, PreferenceSimulation } from "../../types";

export interface FailuresData {
  failures: FailureCase[];
  preference: PreferenceSimulation | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFailuresData(): FailuresData {
  const [failures, setFailures] = useState<FailureCase[]>([]);
  const [preference, setPreference] = useState<PreferenceSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([fetchChatFailures(), fetchChatPreference()]);
      setFailures(f);
      setPreference(p);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { failures, preference, loading, error, refresh };
}
```

- [ ] **Step 7.4: Create FailureCard**

Create `apps/web/src/screens/failures/FailureCard.tsx`:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import type { FailureCase } from "../../types";

interface FailureCardProps {
  failure: FailureCase;
}

export function FailureCard({ failure }: FailureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = failure.modelOnlyOutput.length > 160
    ? failure.modelOnlyOutput.slice(0, 160) + "…"
    : failure.modelOnlyOutput;
  return (
    <Card onClick={() => setExpanded((v) => !v)} className="cursor-pointer transition hover:border-accent">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">{failure.category}</Badge>
        </div>
        <CardTitle className="text-[15px]">{failure.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-[13px]">
        <p className="text-text-muted">{expanded ? failure.modelOnlyOutput : preview}</p>
        {expanded ? (
          <>
            <Separator />
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-muted">Why it fails</p>
              <p>{failure.explanation}</p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-muted">Better strategy</p>
              <p>{failure.betterStrategy}</p>
            </div>
            {failure.relatedConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {failure.relatedConcepts.map((id) => (
                  <Link key={id} to={`/concepts/${id}`} onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline">{id}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.5: Create FailuresByCategory**

Create `apps/web/src/screens/failures/FailuresByCategory.tsx`:

```tsx
import { Stagger, Reveal, panelEnter } from "../../lib/motion";
import { Badge } from "../../components/ui/badge";
import type { FailureCase } from "../../types";
import { FailureCard } from "./FailureCard";

function groupAndSort(failures: FailureCase[]) {
  const order: string[] = [];
  const map = new Map<string, FailureCase[]>();
  for (const f of failures) {
    if (!map.has(f.category)) {
      map.set(f.category, []);
      order.push(f.category);
    }
    map.get(f.category)!.push(f);
  }
  return order
    .map((category) => ({ category, items: map.get(category)! }))
    .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
}

interface FailuresByCategoryProps {
  failures: FailureCase[];
}

export function FailuresByCategory({ failures }: FailuresByCategoryProps) {
  const groups = groupAndSort(failures);
  return (
    <div className="space-y-8">
      {groups.map(({ category, items }) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold capitalize">{category}</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((f) => (
              <Reveal key={f.id} variants={panelEnter}>
                <FailureCard failure={f} />
              </Reveal>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 7.6: Create PreferenceSection**

Create `apps/web/src/screens/failures/PreferenceSection.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type { PreferenceSimulation } from "../../types";

interface PreferenceSectionProps {
  simulation: PreferenceSimulation | null;
}

export function PreferenceSection({ simulation }: PreferenceSectionProps) {
  if (!simulation) return null;
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-[16px] font-semibold">Preference simulation</h2>
        <p className="text-[13px] text-text-muted">Which response wins when ranked by a reward model?</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">"{simulation.prompt}"</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simulation.candidates.map((c) => {
              const isWinner = c.id === simulation.winner.id;
              const score = simulation.rewardScores[c.id];
              return (
                <Card
                  key={c.id}
                  data-candidate={c.id}
                  data-winner={isWinner}
                  className={isWinner ? "border-accent" : ""}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                    <span className="font-mono text-[12px] text-text-muted">{c.id}</span>
                    {isWinner ? <Badge>Winner</Badge> : null}
                  </CardHeader>
                  <CardContent className="space-y-2 text-[13px]">
                    <p>{c.response}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.traits.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                    <p className="text-[12px] text-text-muted">reward: {score?.toFixed?.(2) ?? score}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-[13px] text-text-muted">{simulation.explanation}</p>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 7.7: Create Failures screen**

Create `apps/web/src/screens/Failures.tsx`:

```tsx
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FailuresByCategory } from "./failures/FailuresByCategory";
import { PreferenceSection } from "./failures/PreferenceSection";
import { useFailuresData } from "./failures/useFailuresData";

export function Failures() {
  const { failures, preference, loading, error, refresh } = useFailuresData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">What goes wrong</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Failure museum</h1>
        <p className="text-text-muted">Categories of failure modes — and the strategies that fix them.</p>
      </header>
      {error ? (
        <Card>
          <CardContent className="py-6 space-y-2">
            <p className="text-red-400">{error}</p>
            <Button onClick={() => void refresh()} size="sm">Retry</Button>
          </CardContent>
        </Card>
      ) : null}
      {loading && failures.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <>
          <FailuresByCategory failures={failures} />
          <PreferenceSection simulation={preference} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7.8: Wire route**

Modify `apps/web/src/routes.tsx`:

- Drop `FailuresRoute` from the RouteWrappers import.
- Add `import { Failures } from "./screens/Failures";`.
- Change `<Route path="failures" element={<FailuresRoute />} />` to `<Route path="failures" element={<Failures />} />`.

- [ ] **Step 7.9: Run tests and confirm PASS**

Run: `npm --prefix apps/web test -- src/screens/__tests__/Failures.test.tsx --run`
Expected: 3 PASS.

- [ ] **Step 7.10: Commit**

```bash
git add apps/web/src/screens/Failures.tsx apps/web/src/screens/failures apps/web/src/screens/__tests__/Failures.test.tsx apps/web/src/routes.tsx
git commit -m "Polish /failures

Category-grouped expandable failure cards with explanation and
better-strategy reveals, plus a Preference Simulation section that
absorbs the legacy PreferencePanel. Replaces the legacy
FailuresRoute wrapper."
```

---

## Task 8: Retire RouteWrappers and legacy components

**Files:**
- Delete: `apps/web/src/screens/RouteWrappers.tsx`
- Delete: `apps/web/src/components/GlossaryPanel.tsx`
- Delete: `apps/web/src/components/FailureMuseum.tsx`
- Delete: `apps/web/src/components/PreferencePanel.tsx`
- Delete: `apps/web/src/components/ArtifactPreview.tsx`
- Delete: matching `__tests__` files for each of the four components if present
- Verify: `apps/web/src/routes.tsx` no longer imports from `RouteWrappers`

- [ ] **Step 8.1: Confirm no remaining consumers**

Run: `grep -rn "RouteWrappers\|GlossaryPanel\|FailureMuseum\|PreferencePanel\|ArtifactPreview" apps/web/src/ --include="*.ts" --include="*.tsx"`
Expected: results limited to the files being deleted (and their own tests, if any). If any non-deleted file references them, fix that file first.

- [ ] **Step 8.2: Delete the files**

Run:

```bash
rm apps/web/src/screens/RouteWrappers.tsx
rm apps/web/src/components/GlossaryPanel.tsx
rm apps/web/src/components/FailureMuseum.tsx
rm apps/web/src/components/PreferencePanel.tsx
rm apps/web/src/components/ArtifactPreview.tsx
# delete companion tests if they exist
for f in apps/web/src/components/__tests__/{GlossaryPanel,FailureMuseum,PreferencePanel,ArtifactPreview}.test.tsx; do
  [ -f "$f" ] && rm "$f"
done
```

- [ ] **Step 8.3: Run the full web suite + typecheck + build**

Run: `npm --prefix apps/web test -- --run`
Expected: no failures; total = baseline 185 + 4 (memory) + 5 (glossary) + 4 (tracks) + 4 (artifacts) + 3 (failures) − (any deleted companion tests) passing.

Run: `npm --prefix apps/web exec -- tsc -p tsconfig.app.json --noEmit`
Expected: zero errors.

Run: `npm --prefix apps/web run build`
Expected: clean build, no warnings about missing modules.

- [ ] **Step 8.4: Commit**

```bash
git add -A apps/web/src
git commit -m "Retire RouteWrappers and four legacy panels

All four legacy components (GlossaryPanel, FailureMuseum,
PreferencePanel, ArtifactPreview) and their RouteWrappers shim are
deleted — every consumer now points at the new screens."
```

---

## Task 9: Full verification + handoff update

- [ ] **Step 9.1: Wipe stale e2e state**

Run: `rm -f .learn-llm/e2e-progress.sqlite`

- [ ] **Step 9.2: Run all suites**

Run: `npm --prefix apps/api test`
Expected: 32 passing.

Run: `npm --prefix apps/web test -- --run`
Expected: green, ≥ 201 passing.

Run: `npm --prefix apps/web run build`
Expected: clean.

Run: `npm run e2e`
Expected: 4 chromium flows pass.

- [ ] **Step 9.3: Update handoff doc**

Edit `docs/superpowers/prompts/2026-05-27-ui-overhaul-handoff.md`. Change the "Sub-project 7: Supporting screens — NOT STARTED" section to a DONE block listing:

- Spec path: `docs/superpowers/specs/2026-05-28-supporting-screens-design.md`
- Plan path: `docs/superpowers/plans/2026-05-28-supporting-screens.md`
- Surfaces shipped: /glossary, /artifacts, /failures, /tracks
- Memory drawer in /chat (composer button + MemoryDrawer sheet)
- API addition: DELETE /api/chat/memory/{id}
- Retired: RouteWrappers + GlossaryPanel + FailureMuseum + PreferencePanel + ArtifactPreview

Update the "Test/build state on main" section with the new counts (web ≥ 201 passing; api 32 passing).

Change the "Next concrete action" section to: "UI overhaul complete. No further sub-projects scheduled."

- [ ] **Step 9.4: Commit handoff update**

```bash
git add docs/superpowers/prompts/2026-05-27-ui-overhaul-handoff.md
git commit -m "Mark sub-project 7 done; UI overhaul complete"
```

- [ ] **Step 9.5: Merge to main and push**

```bash
git checkout main
git merge --ff-only supporting-screens
git push origin main
```

Expected: fast-forward merge succeeds; push reports the new HEAD on `origin/main`.

---

## Self-review notes (controller)

- **Spec coverage:** every section in the spec maps to a task — §2.1→Task 4, §2.2→Task 6, §2.3→Task 7, §2.4→Task 5, §2.5→Task 3, §3→Task 1, §4→Task 4/5/6/7 routing, §6 error handling baked into hook tests + screen states, §7 animation included in grid components, §8 testing baked into each task, §10 DoD covered by Task 9.
- **Type consistency:** `useTrackStats` shape, `MemoryEditorState` shape, `FailuresData` shape, the artifact dispatcher's `pickThumb` — all defined once and consumed by their respective screens.
- **Placeholder scan:** none. Every step lists files, code, and commands.
