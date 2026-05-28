# Chat Playground + trace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the un-styled `ChatPlayground` and its sibling panels with a polished split-pane Chat Playground: composer + reply on the left, 8-step trace timeline on the right. Steps 3 and 6 render `<TokenFlow>` and `<SamplingPlot>` from the viz library; step 7 animates the stream client-side.

**Architecture:** A single `useChatSession()` hook owns composer state + `ChatTrace`. Each per-step component is dumb and receives only its slice of the trace. Two top-level exports — `ChatPlayground` (with header, mounts at `/chat`) and `ChatPlaygroundBody` (header-less, mounts inside the Experiment tab via the viz registry). One small backend touch (Task 1) guarantees every UI-consumed `ChatTrace` field is populated across every mode combination.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 3.4, shadcn/ui, Motion-for-React, `@xyflow/react` (not used here but already in deps), react-router-dom@^6, FastAPI + SQLite.

**Spec:** [docs/superpowers/specs/2026-05-28-chat-playground-design.md](../specs/2026-05-28-chat-playground-design.md)

---

## Pre-flight

- [ ] **Pre-flight Step 1: Branch from `main`**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout main
git pull --ff-only
git checkout -b chat-playground
git status
```

Expected: branch `chat-playground` checked out; working tree clean.

- [ ] **Pre-flight Step 2: Commit spec + plan as the branch docs baseline**

```bash
git add docs/superpowers/specs/2026-05-28-chat-playground-design.md \
        docs/superpowers/plans/2026-05-28-chat-playground.md
git commit -m "docs: chat playground spec and plan

Sub-project 6 of the 7-part UI overhaul. Replaces the un-styled
ChatPlayground with a split-pane composer + 8-step trace timeline
that consumes the existing /api/chat/demo trace. Same component
mounts at /chat and inside the Experiment tab for chat concepts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Pre-flight Step 3: Baseline test counts**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -2
npm run api:test  2>&1 | tail -2
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm run e2e 2>&1 | tail -3
```

Expected: labs 40, api 28, web 148 (47 files), e2e 4.

---

## Task 1: API trace-field audit + tests

Goal: confirm every UI-consumed `ChatTrace` field is populated across all four mode dimensions. The current shape (verified in `apps/web/src/types.ts` and `artifacts/labs/chat-mechanics-demo.json`):

```ts
interface ChatTrace {
  messages:        Array<{ role: string; content: string }>;
  formattedPrompt: string;
  tokenTrace:      { text, tokens[], tokenIds[], vocabulary };
  contextTrace:    { contextSize, keptTokens[], keptTokenIds[], droppedTokens[], droppedTokenIds[] };
  samplingTrace:   Array<{ step, token, probabilities, candidates }>;
  streamChunks:    string[];
  toolTrace:       { tool, expression, result, explanation } | null;
  memoryTrace:     { mode, savedMemoriesUsed, contextOnly };
  finalReply:      string;
}
```

Two new API tests pin the contract before the UI consumes it.

**Files:**
- Modify: `apps/api/tests/test_app.py`

### 1a. `toolMode=verified` populates `toolTrace` (TDD)

- [ ] **Step 1a.1: Append the failing test**

Append to `apps/api/tests/test_app.py`:

```python
def test_chat_demo_tool_mode_verified_populates_tool_trace(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from learn_llm_api.app import create_app

    monkeypatch.setenv("LEARN_LLM_DATABASE_PATH", str(tmp_path / "progress.sqlite"))
    client = TestClient(create_app(database_path=tmp_path / "progress.sqlite"))

    response = client.post(
        "/api/chat/demo",
        json={
            "message": "What is 19 * 23?",
            "mode": "assistant",
            "answerStyle": "short",
            "toolMode": "verified",
            "memoryMode": "context",
            "contextSize": 96,
        },
    )
    assert response.status_code == 200
    trace = response.json()
    assert trace["toolTrace"] is not None
    assert "tool" in trace["toolTrace"]
    assert "result" in trace["toolTrace"]
    # Tool result is non-empty for an arithmetic question.
    assert len(str(trace["toolTrace"]["result"])) > 0
```

- [ ] **Step 1a.2: Run + observe**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
source .venv/bin/activate
pytest apps/api/tests/test_app.py::test_chat_demo_tool_mode_verified_populates_tool_trace -v 2>&1 | tail -10
```

If the test passes immediately, the backend already satisfies the contract — skip Step 1a.3. If it fails, proceed.

- [ ] **Step 1a.3: If failing, patch the deterministic local model**

Read `labs/python/llm_from_scratch/chat/local_model.py` to find where `toolTrace` is set when `toolMode == "verified"`. Ensure it returns a non-null dict with at minimum `tool`, `expression`, `result`, `explanation` fields populated for the arithmetic demo input.

Re-run the test until it passes.

### 1b. `answerStyle=scratch` produces multi-entry `samplingTrace` (TDD)

- [ ] **Step 1b.1: Append the failing test**

```python
def test_chat_demo_scratch_answer_style_produces_multi_step_sampling(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from learn_llm_api.app import create_app

    monkeypatch.setenv("LEARN_LLM_DATABASE_PATH", str(tmp_path / "progress.sqlite"))
    client = TestClient(create_app(database_path=tmp_path / "progress.sqlite"))

    short_response = client.post(
        "/api/chat/demo",
        json={
            "message": "What is 19 * 23?",
            "mode": "assistant",
            "answerStyle": "short",
            "toolMode": "none",
            "memoryMode": "context",
            "contextSize": 96,
        },
    )
    scratch_response = client.post(
        "/api/chat/demo",
        json={
            "message": "What is 19 * 23?",
            "mode": "assistant",
            "answerStyle": "scratch",
            "toolMode": "none",
            "memoryMode": "context",
            "contextSize": 96,
        },
    )
    assert short_response.status_code == 200
    assert scratch_response.status_code == 200

    short_steps = len(short_response.json()["samplingTrace"])
    scratch_steps = len(scratch_response.json()["samplingTrace"])
    # Scratch mode shows intermediate sampling steps, so it has strictly
    # more entries than short mode for the same prompt.
    assert scratch_steps > short_steps
    assert scratch_steps >= 2
```

- [ ] **Step 1b.2: Run + observe**

```bash
pytest apps/api/tests/test_app.py::test_chat_demo_scratch_answer_style_produces_multi_step_sampling -v 2>&1 | tail -10
```

If the test passes, skip 1b.3.

- [ ] **Step 1b.3: If failing, patch the local model**

In `labs/python/llm_from_scratch/chat/local_model.py`, when `answerStyle == "scratch"`, ensure the function appends additional intermediate `samplingTrace` entries before the final selected token. Each entry must include `step`, `token`, `probabilities`, `candidates` like the existing entries. Re-run the test until it passes.

### 1c. Commit Task 1

- [ ] **Step 1c.1: Verify + commit**

```bash
pytest apps/api/tests/ -v 2>&1 | tail -8
git add apps/api/tests/test_app.py labs/python/llm_from_scratch/chat/local_model.py 2>/dev/null
git status -s
git commit -m "feat(api): pin chat-demo trace fields for tool and scratch modes

Two new tests guarantee that POST /api/chat/demo populates toolTrace
when toolMode=verified, and produces multi-entry samplingTrace when
answerStyle=scratch. If the local model didn't already satisfy these
contracts, this commit patches it deterministically (no new ML).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Expected: api tests count goes from 28 → 30.

---

## Task 2: `useChatSession` + ChatComposer + ChatReply (TDD)

Build the state hook and the two left-column components. After this task, the composer can already send and render a final reply — without the trace timeline. Task 3 adds the timeline.

**Files:**
- Create: `apps/web/src/screens/chat/useChatSession.ts`
- Create: `apps/web/src/screens/chat/ChatComposer.tsx`
- Create: `apps/web/src/screens/chat/ChatReply.tsx`
- Create: `apps/web/src/screens/chat/__tests__/useChatSession.test.tsx`
- Create: `apps/web/src/screens/chat/__tests__/ChatComposer.test.tsx`
- Create: `apps/web/src/screens/chat/__tests__/ChatReply.test.tsx`

### 2a. `useChatSession` (TDD)

- [ ] **Step 2a.1: Write the failing test**

`apps/web/src/screens/chat/__tests__/useChatSession.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatSession } from "../useChatSession";
import * as api from "../../../api";
import type { ChatTrace } from "../../../types";

const baseTrace = {
  messages: [{ role: "user", content: "x" }],
  formattedPrompt: "<user>x</user><assistant>",
  tokenTrace: { text: "", tokens: [], tokenIds: [], vocabulary: {} },
  contextTrace: { contextSize: 96, keptTokens: [], keptTokenIds: [], droppedTokens: [], droppedTokenIds: [] },
  samplingTrace: [],
  streamChunks: ["ok"],
  toolTrace: null,
  memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
  finalReply: "ok"
} as unknown as ChatTrace;

beforeEach(() => {
  vi.spyOn(api, "runChatDemo").mockResolvedValue(baseTrace);
});
afterEach(() => vi.restoreAllMocks());

describe("useChatSession", () => {
  it("initialises with default mode + empty trace + idle state", () => {
    const { result } = renderHook(() => useChatSession());
    expect(result.current.mode).toBe("assistant");
    expect(result.current.answerStyle).toBe("short");
    expect(result.current.toolMode).toBe("none");
    expect(result.current.memoryMode).toBe("context");
    expect(result.current.trace).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("send() sets loading, then populates trace, then clears loading", async () => {
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMessage("Explain attention."); });
    let sent: Promise<void>;
    act(() => { sent = result.current.send(); });
    expect(result.current.loading).toBe(true);
    await act(async () => { await sent!; });
    expect(result.current.loading).toBe(false);
    expect(result.current.trace).toEqual(baseTrace);
    expect(api.runChatDemo).toHaveBeenCalledWith({
      message: "Explain attention.",
      mode: "assistant",
      answerStyle: "short",
      toolMode: "none",
      memoryMode: "context",
      contextSize: 96
    });
  });

  it("send() surfaces errors and clears loading", async () => {
    vi.spyOn(api, "runChatDemo").mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMessage("hello"); });
    await act(async () => { await result.current.send(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("offline");
    expect(result.current.trace).toBeNull();
  });

  it("setters update individual fields", () => {
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMode("base"); });
    expect(result.current.mode).toBe("base");
    act(() => { result.current.setToolMode("verified"); });
    expect(result.current.toolMode).toBe("verified");
  });
});
```

- [ ] **Step 2a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- useChatSession 2>&1 | tail -10
```

- [ ] **Step 2a.3: Implement** `apps/web/src/screens/chat/useChatSession.ts`

```ts
import { useCallback, useState } from "react";
import { runChatDemo } from "../../api";
import type { ChatDemoInput, ChatTrace } from "../../types";

export interface ChatSessionState {
  message: string;
  mode: ChatDemoInput["mode"];
  answerStyle: ChatDemoInput["answerStyle"];
  toolMode: ChatDemoInput["toolMode"];
  memoryMode: ChatDemoInput["memoryMode"];

  trace: ChatTrace | null;
  loading: boolean;
  error: string | null;

  setMessage(value: string): void;
  setMode(value: ChatDemoInput["mode"]): void;
  setAnswerStyle(value: ChatDemoInput["answerStyle"]): void;
  setToolMode(value: ChatDemoInput["toolMode"]): void;
  setMemoryMode(value: ChatDemoInput["memoryMode"]): void;
  send(): Promise<void>;
}

const CONTEXT_SIZE = 96;

export function useChatSession(): ChatSessionState {
  const [message, setMessage] = useState("Explain attention.");
  const [mode, setMode] = useState<ChatDemoInput["mode"]>("assistant");
  const [answerStyle, setAnswerStyle] = useState<ChatDemoInput["answerStyle"]>("short");
  const [toolMode, setToolMode] = useState<ChatDemoInput["toolMode"]>("none");
  const [memoryMode, setMemoryMode] = useState<ChatDemoInput["memoryMode"]>("context");

  const [trace, setTrace] = useState<ChatTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runChatDemo({
        message,
        mode,
        answerStyle,
        toolMode,
        memoryMode,
        contextSize: CONTEXT_SIZE
      });
      setTrace(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }, [message, mode, answerStyle, toolMode, memoryMode]);

  return {
    message, mode, answerStyle, toolMode, memoryMode,
    trace, loading, error,
    setMessage, setMode, setAnswerStyle, setToolMode, setMemoryMode,
    send
  };
}
```

- [ ] **Step 2a.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- useChatSession 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2b. ChatReply (TDD)

- [ ] **Step 2b.1: Write the failing test**

`apps/web/src/screens/chat/__tests__/ChatReply.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatReply } from "../ChatReply";

describe("ChatReply", () => {
  it("renders the empty state when no trace is present", () => {
    render(<ChatReply finalReply={null} loading={false} error={null} onRetry={() => {}} />);
    expect(screen.getByText(/Send a message to see how it flows/i)).toBeInTheDocument();
  });

  it("renders the final reply as an assistant bubble", () => {
    render(<ChatReply finalReply="The answer is 437." loading={false} error={null} onRetry={() => {}} />);
    expect(screen.getByText("The answer is 437.")).toBeInTheDocument();
  });

  it("renders an error alert with a Retry button", () => {
    const onRetry = vi.fn();
    render(<ChatReply finalReply={null} loading={false} error="offline" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/i);
    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders a skeleton overlay when loading and no prior reply", () => {
    const { container } = render(<ChatReply finalReply={null} loading={true} error={null} onRetry={() => {}} />);
    expect(container.querySelector("[data-skeleton]")).not.toBeNull();
  });
});
```

- [ ] **Step 2b.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- "chat/__tests__/ChatReply" 2>&1 | tail -10
```

- [ ] **Step 2b.3: Implement** `apps/web/src/screens/chat/ChatReply.tsx`

```tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatReplyProps {
  finalReply: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ChatReply({ finalReply, loading, error, onRetry }: ChatReplyProps) {
  if (error) {
    return (
      <Card className="bg-bg-surface border-danger/40">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-danger shrink-0" aria-hidden />
          <div role="alert" className="flex-1 text-[14px] text-text-primary">
            <span className="font-medium">Send failed.</span>{" "}
            <span className="text-text-muted">{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && !finalReply) {
    return (
      <Card className="bg-bg-surface">
        <CardContent className="p-4">
          <Skeleton data-skeleton className="h-16 w-full bg-bg-elevated" />
        </CardContent>
      </Card>
    );
  }

  if (!finalReply) {
    return (
      <Card className="bg-bg-surface">
        <CardContent className="p-6">
          <p className="text-text-muted text-[14px] leading-[22px]">
            Send a message to see how it flows through the model.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-bg-surface border-l-4 border-accent">
      <CardContent className="p-4">
        <p className="text-[12px] uppercase tracking-wide text-text-muted mb-2">Assistant reply</p>
        <p className="text-[15px] leading-[22px] text-text-primary whitespace-pre-wrap">{finalReply}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2b.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- "chat/__tests__/ChatReply" 2>&1 | tail -8
```

Expected: 4 assertions pass.

### 2c. ChatComposer (TDD)

- [ ] **Step 2c.1: Write the failing test**

`apps/web/src/screens/chat/__tests__/ChatComposer.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatComposer } from "../ChatComposer";

function makeSession(overrides: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  const base = {
    message: "hi",
    mode: "assistant" as const,
    answerStyle: "short" as const,
    toolMode: "none" as const,
    memoryMode: "context" as const,
    loading: false,
    onMessageChange: vi.fn(),
    onModeChange: vi.fn(),
    onAnswerStyleChange: vi.fn(),
    onToolModeChange: vi.fn(),
    onMemoryModeChange: vi.fn(),
    onSend: vi.fn()
  };
  return { ...base, ...overrides };
}

describe("ChatComposer", () => {
  it("renders all four mode toggle groups", () => {
    render(<ChatComposer {...makeSession()} />);
    expect(screen.getByRole("button", { name: /^assistant$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^base$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^short$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^scratch$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^none$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^verified$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^context$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^saved$/i })).toBeInTheDocument();
  });

  it("typing in the textarea fires onMessageChange", () => {
    const onMessageChange = vi.fn();
    render(<ChatComposer {...makeSession({ onMessageChange })} />);
    fireEvent.change(screen.getByRole("textbox", { name: /message/i }), { target: { value: "abc" } });
    expect(onMessageChange).toHaveBeenCalledWith("abc");
  });

  it("clicking 'base' fires onModeChange('base')", () => {
    const onModeChange = vi.fn();
    render(<ChatComposer {...makeSession({ onModeChange })} />);
    fireEvent.click(screen.getByRole("button", { name: /^base$/i }));
    expect(onModeChange).toHaveBeenCalledWith("base");
  });

  it("send button is disabled while loading", () => {
    render(<ChatComposer {...makeSession({ loading: true })} />);
    expect(screen.getByRole("button", { name: /sending|send/i })).toBeDisabled();
  });

  it("send button fires onSend when clicked", () => {
    const onSend = vi.fn();
    render(<ChatComposer {...makeSession({ onSend })} />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(onSend).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2c.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- "chat/__tests__/ChatComposer" 2>&1 | tail -10
```

- [ ] **Step 2c.3: Implement** `apps/web/src/screens/chat/ChatComposer.tsx`

```tsx
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ChatDemoInput } from "../../types";

interface ChatComposerProps {
  message: string;
  mode: ChatDemoInput["mode"];
  answerStyle: ChatDemoInput["answerStyle"];
  toolMode: ChatDemoInput["toolMode"];
  memoryMode: ChatDemoInput["memoryMode"];
  loading: boolean;
  onMessageChange: (value: string) => void;
  onModeChange: (value: ChatDemoInput["mode"]) => void;
  onAnswerStyleChange: (value: ChatDemoInput["answerStyle"]) => void;
  onToolModeChange: (value: ChatDemoInput["toolMode"]) => void;
  onMemoryModeChange: (value: ChatDemoInput["memoryMode"]) => void;
  onSend: () => void;
}

interface SegmentedGroupProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<T>;
  onChange: (next: T) => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: SegmentedGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex gap-1" role="group" aria-label={label}>
        {options.map((opt) => (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={value === opt ? "default" : "outline"}
            onClick={() => onChange(opt)}
            className={cn(value === opt && "ring-1 ring-accent")}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}

const MODE_OPTIONS = ["assistant", "base"] as const;
const STYLE_OPTIONS = ["short", "scratch"] as const;
const TOOL_OPTIONS = ["none", "verified"] as const;
const MEMORY_OPTIONS = ["context", "saved"] as const;

export function ChatComposer({
  message, mode, answerStyle, toolMode, memoryMode, loading,
  onMessageChange, onModeChange, onAnswerStyleChange, onToolModeChange, onMemoryModeChange,
  onSend
}: ChatComposerProps) {
  return (
    <Card className="bg-bg-surface">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Segmented label="Mode"         value={mode}        options={MODE_OPTIONS}   onChange={onModeChange} />
          <Segmented label="Answer style" value={answerStyle} options={STYLE_OPTIONS}  onChange={onAnswerStyleChange} />
          <Segmented label="Tool mode"    value={toolMode}    options={TOOL_OPTIONS}   onChange={onToolModeChange} />
          <Segmented label="Memory"       value={memoryMode}  options={MEMORY_OPTIONS} onChange={onMemoryModeChange} />
        </div>

        <label className="block">
          <span className="text-[12px] uppercase tracking-wide text-text-muted">Message</span>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={4}
            aria-label="Message"
            className="mt-1 w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary font-mono"
          />
        </label>

        <div className="flex justify-end">
          <Button type="button" onClick={onSend} disabled={loading}>
            <Play className="h-4 w-4 mr-1" />
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2c.4: Run + confirm PASS**

```bash
npm --prefix apps/web test -- "chat/__tests__/ChatComposer" 2>&1 | tail -8
```

Expected: 5 assertions pass.

### 2d. Verify + commit Task 2

- [ ] **Step 2d.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: web 148 + 13 new (4 + 4 + 5) = 161; build clean.

- [ ] **Step 2d.2: Commit**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/web/src/screens/chat/
git commit -m "feat(web): chat session hook + composer + reply

useChatSession owns composer state + ChatTrace + loading/error,
calls runChatDemo. ChatComposer renders four segmented switches
(mode/answerStyle/toolMode/memoryMode) + textarea + Send. ChatReply
shows empty state, assistant bubble, error alert, or skeleton. None
are mounted in a route yet; that's Task 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Per-step components + `<TraceTimeline>` (TDD)

Build the shared `<TraceStep>` wrapper, the 8 mandatory step components, the conditional `<ToolStep>`, and the `<TraceTimeline>` container.

**Files:**
- Create: `apps/web/src/screens/chat/trace/TraceStep.tsx`
- Create: `apps/web/src/screens/chat/trace/UserStep.tsx`
- Create: `apps/web/src/screens/chat/trace/FormatStep.tsx`
- Create: `apps/web/src/screens/chat/trace/TokenStep.tsx`
- Create: `apps/web/src/screens/chat/trace/ContextStep.tsx`
- Create: `apps/web/src/screens/chat/trace/GenerationStep.tsx`
- Create: `apps/web/src/screens/chat/trace/SamplingStep.tsx`
- Create: `apps/web/src/screens/chat/trace/StreamStep.tsx`
- Create: `apps/web/src/screens/chat/trace/ReplyStep.tsx`
- Create: `apps/web/src/screens/chat/trace/ToolStep.tsx`
- Create: `apps/web/src/screens/chat/TraceTimeline.tsx`
- Create: `apps/web/src/screens/chat/trace/__tests__/*` (one test file per component)
- Create: `apps/web/src/screens/chat/__tests__/TraceTimeline.test.tsx`

### 3a. Shared `<TraceStep>` wrapper (TDD)

- [ ] **Step 3a.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/TraceStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TraceStep } from "../TraceStep";

describe("TraceStep", () => {
  it("renders the eyebrow with step number + total and the name", () => {
    render(
      <TraceStep number={3} total={8} name="Tokenization" hint="Where text becomes ids">
        <p>child</p>
      </TraceStep>
    );
    expect(screen.getByText(/Step 3 of 8/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tokenization/ })).toBeInTheDocument();
    expect(screen.getByText("Where text becomes ids")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("hides the hint when not provided", () => {
    render(
      <TraceStep number={1} total={8} name="User">
        <p>child</p>
      </TraceStep>
    );
    expect(screen.queryByText(/Where text/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- "TraceStep" 2>&1 | tail -10
```

- [ ] **Step 3a.3: Implement** `apps/web/src/screens/chat/trace/TraceStep.tsx`

```tsx
import type { ReactNode } from "react";

interface TraceStepProps {
  number: number;
  total: number;
  name: string;
  hint?: string;
  children: ReactNode;
}

export function TraceStep({ number, total, name, hint, children }: TraceStepProps) {
  return (
    <div className="relative">
      <div className="flex items-baseline gap-3">
        <span className="text-[12px] uppercase tracking-wide text-text-muted font-mono">
          Step {number} of {total}
        </span>
      </div>
      <h3 className="text-[17px] leading-[24px] font-semibold mt-1">{name}</h3>
      {hint ? <p className="text-[13px] text-text-muted mt-1">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3a.4: Run + confirm PASS** — 2 assertions.

### 3b. `<UserStep>` (TDD)

- [ ] **Step 3b.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/UserStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserStep } from "../UserStep";

describe("UserStep", () => {
  it("extracts the last user message from the messages array", () => {
    render(
      <UserStep
        messages={[
          { role: "system", content: "system prompt" },
          { role: "user", content: "earlier" },
          { role: "user", content: "What is 19 * 23?" }
        ]}
      />
    );
    expect(screen.getByText("What is 19 * 23?")).toBeInTheDocument();
    // Does not render the system message.
    expect(screen.queryByText(/system prompt/)).not.toBeInTheDocument();
  });

  it("renders an empty state when no user message is present", () => {
    render(<UserStep messages={[{ role: "system", content: "x" }]} />);
    expect(screen.getByText(/No user message/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3b.2: Run + confirm FAIL**

- [ ] **Step 3b.3: Implement** `apps/web/src/screens/chat/trace/UserStep.tsx`

```tsx
import { TraceStep } from "./TraceStep";

interface UserStepProps {
  messages: Array<{ role: string; content: string }>;
}

export function UserStep({ messages }: UserStepProps) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (
    <TraceStep number={1} total={8} name="User message" hint="What you typed.">
      {last ? (
        <p className="rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary whitespace-pre-wrap">
          {last.content}
        </p>
      ) : (
        <p className="text-text-muted text-[13px]">No user message in this trace.</p>
      )}
    </TraceStep>
  );
}
```

- [ ] **Step 3b.4: Run + confirm PASS** — 2 assertions.

### 3c. `<FormatStep>` (TDD)

- [ ] **Step 3c.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/FormatStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormatStep } from "../FormatStep";

describe("FormatStep", () => {
  it("renders the formatted prompt inside a mono pre", () => {
    const { container } = render(
      <FormatStep formattedPrompt="<system>S</system>\n<user>U</user>" />
    );
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toMatch(/font-mono/);
    expect(pre?.textContent ?? "").toContain("<system>");
    expect(pre?.textContent ?? "").toContain("<user>");
  });
});
```

- [ ] **Step 3c.2: Run + confirm FAIL**

- [ ] **Step 3c.3: Implement** `apps/web/src/screens/chat/trace/FormatStep.tsx`

```tsx
import { CodeBlock } from "@/components/ui/code-block";
import { TraceStep } from "./TraceStep";

interface FormatStepProps {
  formattedPrompt: string;
}

export function FormatStep({ formattedPrompt }: FormatStepProps) {
  return (
    <TraceStep
      number={2}
      total={8}
      name="Prompt formatting"
      hint="Roles wrapped in tags before tokenization."
    >
      <CodeBlock copyable rawContent={formattedPrompt}>{formattedPrompt}</CodeBlock>
    </TraceStep>
  );
}
```

- [ ] **Step 3c.4: Run + confirm PASS** — 1 assertion.

### 3d. `<TokenStep>` (TDD)

- [ ] **Step 3d.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/TokenStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TokenStep } from "../TokenStep";

describe("TokenStep", () => {
  it("renders one TokenFlow cell per token across the three stages", () => {
    const { container } = render(
      <TokenStep
        tokens={["a", "b", "c"]}
        tokenIds={[1, 2, 3]}
      />
    );
    // TokenFlow renders [data-token-cell] per (stage × token); 3 tokens × 3 stages = 9.
    expect(container.querySelectorAll("[data-token-cell]").length).toBe(9);
  });

  it("caps very long token sequences for layout sanity", () => {
    const tokens = Array.from({ length: 200 }, (_, i) => String(i));
    const ids = Array.from({ length: 200 }, (_, i) => i);
    const { container } = render(<TokenStep tokens={tokens} tokenIds={ids} />);
    // TokenStep caps to a maximum of 80 tokens shown × 3 stages.
    expect(container.querySelectorAll("[data-token-cell]").length).toBeLessThanOrEqual(80 * 3);
  });
});
```

- [ ] **Step 3d.2: Run + confirm FAIL**

- [ ] **Step 3d.3: Implement** `apps/web/src/screens/chat/trace/TokenStep.tsx`

```tsx
import { TokenFlow } from "@/viz";
import type { TokenItem } from "@/viz/data/types";
import { TraceStep } from "./TraceStep";

interface TokenStepProps {
  tokens: string[];
  tokenIds: number[];
}

const MAX_TOKENS_RENDERED = 80;

export function TokenStep({ tokens, tokenIds }: TokenStepProps) {
  const items: TokenItem[] = tokens.slice(0, MAX_TOKENS_RENDERED).map((text, i) => ({
    id: tokenIds[i] ?? i,
    text
  }));
  return (
    <TraceStep
      number={3}
      total={8}
      name="Tokenization"
      hint="Text becomes tokens, then ids."
    >
      <TokenFlow tokens={items} stages={["text", "tokens", "ids"]} />
      {tokens.length > MAX_TOKENS_RENDERED ? (
        <p className="text-[12px] text-text-muted mt-2 font-mono">
          Showing first {MAX_TOKENS_RENDERED} of {tokens.length} tokens.
        </p>
      ) : null}
    </TraceStep>
  );
}
```

- [ ] **Step 3d.4: Run + confirm PASS** — 2 assertions.

### 3e. `<ContextStep>` (TDD)

- [ ] **Step 3e.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/ContextStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContextStep } from "../ContextStep";

describe("ContextStep", () => {
  it("shows kept and dropped token counts plus the context size", () => {
    render(
      <ContextStep
        contextSize={96}
        keptTokens={Array.from({ length: 84 }, (_, i) => String(i))}
        droppedTokens={Array.from({ length: 12 }, (_, i) => "d" + i)}
      />
    );
    expect(screen.getByText(/84/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/96/)).toBeInTheDocument();
  });

  it("renders the usage meter width proportional to kept / contextSize", () => {
    const { container } = render(
      <ContextStep
        contextSize={100}
        keptTokens={Array.from({ length: 25 }, (_, i) => String(i))}
        droppedTokens={[]}
      />
    );
    const bar = container.querySelector("[data-context-meter]");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("style") ?? "").toMatch(/width:\s*25%/);
  });
});
```

- [ ] **Step 3e.2: Run + confirm FAIL**

- [ ] **Step 3e.3: Implement** `apps/web/src/screens/chat/trace/ContextStep.tsx`

```tsx
import { TraceStep } from "./TraceStep";

interface ContextStepProps {
  contextSize: number;
  keptTokens: string[];
  droppedTokens: string[];
}

export function ContextStep({ contextSize, keptTokens, droppedTokens }: ContextStepProps) {
  const kept = keptTokens.length;
  const dropped = droppedTokens.length;
  const usagePct = contextSize === 0 ? 0 : Math.min(100, Math.round((kept / contextSize) * 100));

  return (
    <TraceStep
      number={4}
      total={8}
      name="Context window"
      hint="What fits in the window and what gets dropped."
    >
      <div className="space-y-2">
        <p className="text-[13px] text-text-muted font-mono">
          {kept} kept · {dropped} dropped · {contextSize} window
        </p>
        <div className="h-2 rounded-sm bg-bg-inset border border-border-subtle overflow-hidden">
          <div
            data-context-meter
            className="h-full bg-accent"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>
    </TraceStep>
  );
}
```

- [ ] **Step 3e.4: Run + confirm PASS** — 2 assertions.

### 3f. `<GenerationStep>` (TDD)

- [ ] **Step 3f.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/GenerationStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenerationStep } from "../GenerationStep";

describe("GenerationStep", () => {
  it("renders the generation explanation", () => {
    render(<GenerationStep />);
    expect(screen.getByText(/model.generate/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3f.2: Run + confirm FAIL**

- [ ] **Step 3f.3: Implement** `apps/web/src/screens/chat/trace/GenerationStep.tsx`

```tsx
import { TraceStep } from "./TraceStep";

export function GenerationStep() {
  return (
    <TraceStep
      number={5}
      total={8}
      name="Generation"
      hint="The model produces logits for the next token."
    >
      <p className="text-[14px] leading-[22px] text-text-primary">
        <span className="font-mono">model.generate(context)</span> — the model produces
        next-token logits over the vocabulary. These become probabilities in the next step.
      </p>
    </TraceStep>
  );
}
```

- [ ] **Step 3f.4: Run + confirm PASS** — 1 assertion.

### 3g. `<SamplingStep>` (TDD)

- [ ] **Step 3g.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/SamplingStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SamplingStep } from "../SamplingStep";

describe("SamplingStep", () => {
  it("renders one SamplingPlot per entry in samplingTrace", () => {
    const { container } = render(
      <SamplingStep
        samplingTrace={[
          { step: 1, token: "the", probabilities: { the: 0.6, a: 0.4 } as any, candidates: undefined as any },
          { step: 2, token: "model", probabilities: { model: 0.7, "tiny": 0.3 } as any, candidates: undefined as any }
        ]}
      />
    );
    // Two SamplingPlots → bars for each.
    const bars = container.querySelectorAll("[data-bar]");
    expect(bars.length).toBeGreaterThanOrEqual(4); // 2 plots × ≥2 bars each
  });

  it("renders a single-step header for one-entry traces and a multi-step header for many", () => {
    render(
      <SamplingStep
        samplingTrace={[
          { step: 1, token: "the", probabilities: { the: 0.6, a: 0.4 } as any, candidates: undefined as any }
        ]}
      />
    );
    expect(screen.getByText(/^Sampling$/i)).toBeInTheDocument();
  });

  it("renders an empty state when no sampling entries", () => {
    render(<SamplingStep samplingTrace={[]} />);
    expect(screen.getByText(/No sampling steps/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3g.2: Run + confirm FAIL**

- [ ] **Step 3g.3: Implement** `apps/web/src/screens/chat/trace/SamplingStep.tsx`

```tsx
import { SamplingPlot } from "@/viz";
import { TraceStep } from "./TraceStep";

interface SamplingEntry {
  step: number;
  token: string;
  probabilities: Record<string, number>;
  candidates: unknown;
}

interface SamplingStepProps {
  samplingTrace: SamplingEntry[];
}

function entriesToCandidates(probabilities: Record<string, number>): Array<{ token: string; probability: number }> {
  return Object.entries(probabilities).map(([token, probability]) => ({ token, probability }));
}

export function SamplingStep({ samplingTrace }: SamplingStepProps) {
  if (samplingTrace.length === 0) {
    return (
      <TraceStep number={6} total={8} name="Sampling" hint="No sampling steps in this trace.">
        <p className="text-text-muted text-[13px]">No sampling steps recorded.</p>
      </TraceStep>
    );
  }

  return (
    <TraceStep
      number={6}
      total={8}
      name="Sampling"
      hint={
        samplingTrace.length > 1
          ? `${samplingTrace.length} sampling steps (scratch produces extras).`
          : "Probabilities over candidate next tokens."
      }
    >
      <div className="space-y-4">
        {samplingTrace.map((entry) => (
          <div key={entry.step} className="space-y-1">
            <p className="text-[12px] text-text-muted font-mono">
              step {entry.step} → selected: <span className="text-text-primary">{entry.token}</span>
            </p>
            <SamplingPlot
              candidates={entriesToCandidates(entry.probabilities)}
              selectedToken={entry.token}
              temperature={1.0}
            />
          </div>
        ))}
      </div>
    </TraceStep>
  );
}
```

- [ ] **Step 3g.4: Run + confirm PASS** — 3 assertions.

### 3h. `<StreamStep>` (TDD)

- [ ] **Step 3h.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/StreamStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StreamStep } from "../StreamStep";

describe("StreamStep", () => {
  it("renders each token in order", () => {
    render(<StreamStep streamChunks={["The", " ", "answer"]} />);
    const text = screen.getByTestId("stream-text").textContent ?? "";
    expect(text).toBe("The answer");
  });

  it("renders an empty state when stream is empty", () => {
    render(<StreamStep streamChunks={[]} />);
    expect(screen.getByText(/No tokens streamed/i)).toBeInTheDocument();
  });

  it("exposes a Replay button when there is at least one token", () => {
    render(<StreamStep streamChunks={["x"]} />);
    expect(screen.getByRole("button", { name: /Replay/i })).toBeInTheDocument();
  });

  it("caps the count notice when stream is very long", () => {
    const big = Array.from({ length: 100 }, () => "x");
    render(<StreamStep streamChunks={big} />);
    expect(screen.getByText(/100 tokens/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3h.2: Run + confirm FAIL**

- [ ] **Step 3h.3: Implement** `apps/web/src/screens/chat/trace/StreamStep.tsx`

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TraceStep } from "./TraceStep";

interface StreamStepProps {
  streamChunks: string[];
}

const ANIMATION_TOKEN_CAP = 60;

export function StreamStep({ streamChunks }: StreamStepProps) {
  const [, setReplayKey] = useState(0);

  if (streamChunks.length === 0) {
    return (
      <TraceStep number={7} total={8} name="Token stream" hint="No tokens streamed.">
        <p className="text-text-muted text-[13px]">No tokens streamed.</p>
      </TraceStep>
    );
  }

  const text = streamChunks.join("");
  const animatedSegmentLen = Math.min(streamChunks.length, ANIMATION_TOKEN_CAP);

  return (
    <TraceStep
      number={7}
      total={8}
      name="Token stream"
      hint={`${streamChunks.length} tokens streamed.`}
    >
      <div className="space-y-2">
        <p
          data-testid="stream-text"
          className="rounded-md bg-bg-inset border border-border-subtle p-3 font-mono text-[14px] leading-[22px] text-text-primary"
        >
          {text}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setReplayKey((k) => k + 1)}>
            Replay
          </Button>
          {streamChunks.length > ANIMATION_TOKEN_CAP ? (
            <span className="text-[12px] text-text-muted font-mono">
              animation capped at {animatedSegmentLen} tokens
            </span>
          ) : null}
        </div>
      </div>
    </TraceStep>
  );
}
```

The replay button currently re-keys an unused state variable; per-token animation is handled by the wrapping `<Stagger>` in `<TraceTimeline>` plus CSS transitions on the text node. This is intentionally minimal — the spec lets us defer the per-token Motion variant to a polish iteration; v1 ships the stream text rendered all at once with a clear Replay affordance.

- [ ] **Step 3h.4: Run + confirm PASS** — 4 assertions.

### 3i. `<ReplyStep>` (TDD)

- [ ] **Step 3i.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/ReplyStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplyStep } from "../ReplyStep";

describe("ReplyStep", () => {
  it("echoes the final reply text", () => {
    render(<ReplyStep finalReply="437" />);
    expect(screen.getByText("437")).toBeInTheDocument();
  });

  it("renders an empty state when finalReply is empty", () => {
    render(<ReplyStep finalReply="" />);
    expect(screen.getByText(/No reply yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3i.2: Run + confirm FAIL**

- [ ] **Step 3i.3: Implement** `apps/web/src/screens/chat/trace/ReplyStep.tsx`

```tsx
import { TraceStep } from "./TraceStep";

interface ReplyStepProps {
  finalReply: string;
}

export function ReplyStep({ finalReply }: ReplyStepProps) {
  return (
    <TraceStep number={8} total={8} name="Assistant reply" hint="The final text emitted by the model.">
      {finalReply ? (
        <p className="rounded-md bg-bg-surface border-l-4 border-accent p-3 text-[14px] leading-[22px] text-text-primary whitespace-pre-wrap">
          {finalReply}
        </p>
      ) : (
        <p className="text-text-muted text-[13px]">No reply yet.</p>
      )}
    </TraceStep>
  );
}
```

- [ ] **Step 3i.4: Run + confirm PASS** — 2 assertions.

### 3j. `<ToolStep>` (TDD)

- [ ] **Step 3j.1: Write the failing test**

`apps/web/src/screens/chat/trace/__tests__/ToolStep.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolStep } from "../ToolStep";

describe("ToolStep", () => {
  it("renders tool, expression, result, and explanation", () => {
    render(
      <ToolStep
        toolTrace={{
          tool: "calculator",
          expression: "19 * 23",
          result: "437",
          explanation: "Verified arithmetic."
        }}
      />
    );
    expect(screen.getByText(/calculator/)).toBeInTheDocument();
    expect(screen.getByText(/19 \* 23/)).toBeInTheDocument();
    expect(screen.getByText("437")).toBeInTheDocument();
    expect(screen.getByText(/Verified arithmetic/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3j.2: Run + confirm FAIL**

- [ ] **Step 3j.3: Implement** `apps/web/src/screens/chat/trace/ToolStep.tsx`

```tsx
import { TraceStep } from "./TraceStep";

interface ToolTrace {
  tool: string;
  expression: string;
  result: string;
  explanation: string;
}

interface ToolStepProps {
  toolTrace: ToolTrace;
}

export function ToolStep({ toolTrace }: ToolStepProps) {
  return (
    <TraceStep
      number={5}
      total={8}
      name="Tool verification"
      hint="A deterministic tool was called to ground the answer."
    >
      <div className="rounded-md bg-bg-inset border border-border-subtle p-3 space-y-2 font-mono text-[13px]">
        <p>
          <span className="text-text-muted">tool</span> ={" "}
          <span className="text-text-primary">{toolTrace.tool}</span>
        </p>
        <p>
          <span className="text-text-muted">expression</span> ={" "}
          <span className="text-text-primary">{toolTrace.expression}</span>
        </p>
        <p>
          <span className="text-text-muted">result</span> ={" "}
          <span className="text-text-primary">{toolTrace.result}</span>
        </p>
        <p className="text-text-muted">{toolTrace.explanation}</p>
      </div>
    </TraceStep>
  );
}
```

- [ ] **Step 3j.4: Run + confirm PASS** — 1 assertion.

### 3k. `<TraceTimeline>` (TDD)

- [ ] **Step 3k.1: Write the failing test**

`apps/web/src/screens/chat/__tests__/TraceTimeline.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TraceTimeline } from "../TraceTimeline";
import type { ChatTrace } from "../../../types";

function makeTrace(overrides: Partial<ChatTrace> = {}): ChatTrace {
  return {
    messages: [{ role: "user", content: "hi" }],
    formattedPrompt: "<user>hi</user><assistant>",
    tokenTrace: { text: "hi", tokens: ["h", "i"], tokenIds: [1, 2], vocabulary: {} },
    contextTrace: { contextSize: 96, keptTokens: ["h", "i"], keptTokenIds: [1, 2], droppedTokens: [], droppedTokenIds: [] },
    samplingTrace: [{ step: 1, token: "ok", probabilities: { ok: 0.9, no: 0.1 } as any, candidates: undefined as any }],
    streamChunks: ["ok"],
    toolTrace: null,
    memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
    finalReply: "ok",
    ...overrides
  } as ChatTrace;
}

describe("TraceTimeline", () => {
  it("renders an empty state when trace is null", () => {
    render(<TraceTimeline trace={null} loading={false} />);
    expect(screen.getByText(/Send a message/i)).toBeInTheDocument();
  });

  it("renders all 8 mandatory step names when given a populated trace", () => {
    render(<TraceTimeline trace={makeTrace()} loading={false} />);
    for (const name of [
      /User message/i,
      /Prompt formatting/i,
      /^Tokenization$/i,
      /Context window/i,
      /^Generation$/i,
      /^Sampling$/i,
      /Token stream/i,
      /Assistant reply/i
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    // Tool step hidden when toolTrace is null.
    expect(screen.queryByRole("heading", { name: /Tool verification/i })).not.toBeInTheDocument();
  });

  it("renders the Tool step between Generation and Sampling when toolTrace is present", () => {
    render(
      <TraceTimeline
        trace={makeTrace({
          toolTrace: { tool: "calculator", expression: "1+1", result: "2", explanation: "ok" } as any
        })}
        loading={false}
      />
    );
    expect(screen.getByRole("heading", { name: /Tool verification/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3k.2: Run + confirm FAIL**

- [ ] **Step 3k.3: Implement** `apps/web/src/screens/chat/TraceTimeline.tsx`

```tsx
import { Stagger, Reveal } from "@/lib/motion";
import type { ChatTrace } from "../../types";
import { UserStep } from "./trace/UserStep";
import { FormatStep } from "./trace/FormatStep";
import { TokenStep } from "./trace/TokenStep";
import { ContextStep } from "./trace/ContextStep";
import { GenerationStep } from "./trace/GenerationStep";
import { SamplingStep } from "./trace/SamplingStep";
import { StreamStep } from "./trace/StreamStep";
import { ReplyStep } from "./trace/ReplyStep";
import { ToolStep } from "./trace/ToolStep";

interface TraceTimelineProps {
  trace: ChatTrace | null;
  loading: boolean;
}

export function TraceTimeline({ trace, loading }: TraceTimelineProps) {
  if (!trace) {
    return (
      <div className="rounded-md border border-border-subtle bg-bg-surface p-6 text-text-muted text-[14px] leading-[22px]">
        Send a message to see how it flows through the model.
      </div>
    );
  }

  const tokenTrace = trace.tokenTrace as { tokens?: string[]; tokenIds?: number[] };
  const contextTrace = trace.contextTrace as {
    contextSize?: number;
    keptTokens?: string[];
    droppedTokens?: string[];
  };
  const samplingTrace = (trace.samplingTrace ?? []) as Array<{
    step: number;
    token: string;
    probabilities: Record<string, number>;
    candidates: unknown;
  }>;
  const toolTrace = trace.toolTrace as {
    tool: string;
    expression: string;
    result: string;
    explanation: string;
  } | null;

  return (
    <Stagger className="space-y-6">
      <Reveal><UserStep messages={trace.messages} /></Reveal>
      <Reveal><FormatStep formattedPrompt={trace.formattedPrompt} /></Reveal>
      <Reveal><TokenStep tokens={tokenTrace.tokens ?? []} tokenIds={tokenTrace.tokenIds ?? []} /></Reveal>
      <Reveal>
        <ContextStep
          contextSize={contextTrace.contextSize ?? 0}
          keptTokens={contextTrace.keptTokens ?? []}
          droppedTokens={contextTrace.droppedTokens ?? []}
        />
      </Reveal>
      <Reveal><GenerationStep /></Reveal>
      {toolTrace ? <Reveal><ToolStep toolTrace={toolTrace} /></Reveal> : null}
      <Reveal><SamplingStep samplingTrace={samplingTrace} /></Reveal>
      <Reveal><StreamStep streamChunks={trace.streamChunks} /></Reveal>
      <Reveal><ReplyStep finalReply={trace.finalReply} /></Reveal>
      {/* loading state intentionally surfaces via parent skeleton; intentional silence */}
      <span hidden aria-hidden>{String(loading)}</span>
    </Stagger>
  );
}
```

- [ ] **Step 3k.4: Run + confirm PASS** — 3 assertions.

### 3l. Verify + commit Task 3

- [ ] **Step 3l.1: Full suite + build**

```bash
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm --prefix apps/web run build 2>&1 | tail -4
```

Expected: web 161 + ~17 new (2 TraceStep + 2 UserStep + 1 FormatStep + 2 TokenStep + 2 ContextStep + 1 GenerationStep + 3 SamplingStep + 4 StreamStep + 2 ReplyStep + 1 ToolStep + 3 TraceTimeline = 23) ≈ 184; build clean. (Actual count may differ ± a few.)

- [ ] **Step 3l.2: Commit**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/web/src/screens/chat/
git commit -m "feat(web): 8-step TraceTimeline with viz library integration

Adds TraceStep wrapper and ten step components (User, Format, Token,
Context, Generation, Sampling, Stream, Reply + conditional Tool).
TokenStep renders TokenFlow; SamplingStep renders SamplingPlot (one
panel per samplingTrace entry — scratch mode produces extras). All
animate via Stagger/Reveal honouring prefers-reduced-motion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `ChatPlayground` screen + route swap + viz registry + e2e

Compose the composer + reply + timeline into the screen with two exports. Swap the route, update the viz registry, update e2e selectors.

**Files:**
- Create: `apps/web/src/screens/ChatPlayground.tsx`
- Create: `apps/web/src/screens/__tests__/ChatPlayground.test.tsx`
- Modify: `apps/web/src/routes.tsx`
- Modify: `apps/web/src/screens/RouteWrappers.tsx` (remove `ChatRoute`)
- Modify: `apps/web/src/screens/concept/vizRegistry.ts`
- Modify: `tests/e2e/phase4-chat-mechanics.spec.ts`

### 4a. Integration test (TDD)

- [ ] **Step 4a.1: Write the failing test**

`apps/web/src/screens/__tests__/ChatPlayground.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatPlayground, ChatPlaygroundBody } from "../ChatPlayground";
import * as api from "../../api";
import type { ChatTrace } from "../../types";

const sampleTrace = {
  messages: [{ role: "user", content: "Explain attention." }],
  formattedPrompt: "<user>Explain attention.</user><assistant>",
  tokenTrace: { text: "x", tokens: ["e", "x"], tokenIds: [1, 2], vocabulary: {} },
  contextTrace: { contextSize: 96, keptTokens: ["e", "x"], keptTokenIds: [1, 2], droppedTokens: [], droppedTokenIds: [] },
  samplingTrace: [{ step: 1, token: "ok", probabilities: { ok: 0.9, no: 0.1 } as any, candidates: undefined as any }],
  streamChunks: ["ok"],
  toolTrace: null,
  memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
  finalReply: "Attention is a weighted lookup."
} as unknown as ChatTrace;

beforeEach(() => {
  vi.spyOn(api, "runChatDemo").mockResolvedValue(sampleTrace);
});
afterEach(() => vi.restoreAllMocks());

describe("ChatPlayground", () => {
  it("renders the page header at /chat and composes composer + reply + timeline", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Send a message; inspect every step/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    expect(screen.getByText(/Send a message to see how it flows/i)).toBeInTheDocument();
  });

  it("sending a message populates the trace timeline and the reply", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /^Send$/i }));
    await waitFor(() => expect(screen.getByText(/Attention is a weighted lookup/i)).toBeInTheDocument());
    // The 8 mandatory step headings render.
    expect(screen.getByRole("heading", { name: /User message/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Token stream/i })).toBeInTheDocument();
  });

  it("ChatPlaygroundBody renders without the page header", () => {
    render(<MemoryRouter><ChatPlaygroundBody /></MemoryRouter>);
    expect(screen.queryByRole("heading", { name: /Send a message; inspect every step/i })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4a.2: Run + confirm FAIL**

```bash
npm --prefix apps/web test -- "screens/__tests__/ChatPlayground" 2>&1 | tail -10
```

### 4b. Implement `ChatPlayground`

- [ ] **Step 4b.1: Create** `apps/web/src/screens/ChatPlayground.tsx`

```tsx
import { ChatComposer } from "./chat/ChatComposer";
import { ChatReply } from "./chat/ChatReply";
import { TraceTimeline } from "./chat/TraceTimeline";
import { useChatSession } from "./chat/useChatSession";

export function ChatPlaygroundBody() {
  const s = useChatSession();
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
    </div>
  );
}

export function ChatPlayground() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Chat product</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Send a message; inspect every step</h1>
        <p className="text-text-muted">
          Switch modes and watch how the same message moves through formatting, tokenization, context, generation, sampling, and streaming.
        </p>
      </header>
      <ChatPlaygroundBody />
    </div>
  );
}
```

- [ ] **Step 4b.2: Run + confirm PASS**

```bash
npm --prefix apps/web test -- "screens/__tests__/ChatPlayground" 2>&1 | tail -8
```

Expected: 3 assertions pass.

### 4c. Route swap

- [ ] **Step 4c.1: Update** `apps/web/src/routes.tsx`

Read the file. Add the import `import { ChatPlayground } from "./screens/ChatPlayground";` and remove `ChatRoute` from the `./screens/RouteWrappers` import (keep other wrappers). Change `<Route path="chat" element={<ChatRoute />} />` to `<Route path="chat" element={<ChatPlayground />} />`.

- [ ] **Step 4c.2: Remove `ChatRoute` from** `apps/web/src/screens/RouteWrappers.tsx`

Read the file. Delete the `ChatRoute` function. If `ChatPlayground` from the legacy `../components/ChatPlayground` was the only consumer of that import, also remove the now-unused import. Other wrappers stay intact.

- [ ] **Step 4c.3: Update the viz registry**

In `apps/web/src/screens/concept/vizRegistry.ts`, swap the `"chat-playground"` entry to use the new `ChatPlaygroundBody`:

```ts
// at the top, replace the existing ChatPlayground import:
import { ChatPlaygroundBody } from "@/screens/ChatPlayground";

// in the registry map, the "chat-playground" entry becomes:
"chat-playground": { Component: ChatPlaygroundBody, hint: "Send a message and inspect every step in the chat trace." }
```

- [ ] **Step 4c.4: Verify**

```bash
grep -rn "ChatRoute" apps/web/src/ --include="*.tsx" --include="*.ts" || echo "(clean)"
grep -n "ChatPlaygroundBody\|ChatPlayground" apps/web/src/screens/concept/vizRegistry.ts
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | tail -4
```

Expected: no `ChatRoute` references; registry uses `ChatPlaygroundBody`; build clean; web tests pass.

### 4d. Update phase-4 e2e

The phase-4 e2e currently clicks a "Save memory" button and asserts on its persistence inside the legacy ChatPlayground. The new ChatPlayground doesn't have memory editing. Replace the memory portion with a verification of the new flow: send a message → assistant reply renders → at least one SamplingPlot bar is visible.

- [ ] **Step 4d.1: Read the current spec**

```bash
cat tests/e2e/phase4-chat-mechanics.spec.ts
```

- [ ] **Step 4d.2: Replace the memory-related assertions**

Identify the block that:
1. fills `Memory to save`
2. clicks `Save memory`
3. asserts on `Learning attention first.` being visible

Replace those lines with:

```ts
// Chat Playground sub-project: memory editor moves to sub-project 7.
// We now verify the chat-trace flow: send → reply + sampling visible.
await page.getByRole("textbox", { name: /message/i }).fill("Explain attention.");
await page.getByRole("button", { name: /^Send$/i }).click();
// Assistant reply visible (text varies; we just check the header).
await expect(page.getByText(/Assistant reply/i).first()).toBeVisible();
// At least one sampling bar rendered.
await expect(page.locator("[data-bar]").first()).toBeVisible();
```

If the rest of the test asserts on tool-verified arithmetic or chat-memory recall against the legacy UI, drop those assertions — sub-project 7 covers the memory UI, and the trace timeline covers the tool verification path via its own component test.

- [ ] **Step 4d.3: Run e2e**

```bash
source .venv/bin/activate
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
rm -f .learn-llm/e2e-progress.sqlite
npm run e2e 2>&1 | tail -7
```

Expected: 4 chromium flows pass.

### 4e. Commit Task 4

- [ ] **Step 4e.1: Commit**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git add apps/web/src/screens/ChatPlayground.tsx \
        apps/web/src/screens/__tests__/ChatPlayground.test.tsx \
        apps/web/src/routes.tsx \
        apps/web/src/screens/RouteWrappers.tsx \
        apps/web/src/screens/concept/vizRegistry.ts \
        tests/e2e/phase4-chat-mechanics.spec.ts
git commit -m "feat(web): polished /chat playground + Experiment-tab integration

ChatPlayground (with page header for /chat) and ChatPlaygroundBody
(header-less for the Experiment tab) compose composer + reply +
TraceTimeline. Routes /chat at the new screen; viz registry's
'chat-playground' entry now points at ChatPlaygroundBody. ChatRoute
removed from RouteWrappers.tsx.

phase-4 e2e updated: memory editor coverage moves to sub-project 7,
this test now verifies send → assistant reply + sampling visible.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Cleanup

Delete the legacy ChatPlayground + TracePanel. Keep `FailureMuseum.tsx` and `PreferencePanel.tsx` — sub-project 7 owns them.

**Files:**
- Delete: `apps/web/src/components/ChatPlayground.tsx`
- Delete: `apps/web/src/components/TracePanel.tsx`
- Delete: `apps/web/src/__tests__/CheckpointPanel.test.tsx` only if it still exists (audit first)
- Audit: every other file under `apps/web/src/components/`

### 5a. Orphan audit

- [ ] **Step 5a.1: For each legacy file, find imports**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
for f in ChatPlayground TracePanel; do
  echo "=== $f ==="
  grep -rln "from .*components/$f" apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v "components/$f.tsx" || echo "  (orphan)"
done

echo "=== FailureMuseum, PreferencePanel still consumed? ==="
for f in FailureMuseum PreferencePanel; do
  echo "--- $f ---"
  grep -rln "from .*components/$f" apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v "components/$f.tsx"
done
```

Expected: ChatPlayground and TracePanel are orphans. FailureMuseum and PreferencePanel still have consumers (RouteWrappers' FailuresRoute) and stay.

### 5b. Delete + verify + commit

- [ ] **Step 5b.1: Remove the files**

```bash
rm apps/web/src/components/ChatPlayground.tsx \
   apps/web/src/components/TracePanel.tsx
ls apps/web/src/components/ChatPlayground.tsx 2>&1 || echo "(gone)"
ls apps/web/src/components/TracePanel.tsx 2>&1 || echo "(gone)"
```

- [ ] **Step 5b.2: Verify**

```bash
npm --prefix apps/web run build 2>&1 | tail -4
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
```

Expected: build clean; web suite passes (no count change unless legacy tests exist for those files).

- [ ] **Step 5b.3: Commit**

```bash
git add -u apps/web/src/components/ChatPlayground.tsx \
            apps/web/src/components/TracePanel.tsx
git commit -m "chore(web): delete legacy ChatPlayground + TracePanel

Orphans after Task 4 swapped /chat to the new screen and updated
vizRegistry's chat-playground entry. FailureMuseum and PreferencePanel
stay — still consumed by RouteWrappers.tsx until sub-project 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Final 1: Branch log**

```bash
git log --oneline main..HEAD
```

Expected: 6 commits — pre-flight docs, API touch-up, hook+composer+reply, trace timeline, screen+route, cleanup.

- [ ] **Final 2: Every gate green**

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -3
npm run api:test  2>&1 | tail -3
npm --prefix apps/web test 2>&1 | grep -E "Test Files|^      Tests"
npm --prefix apps/web run build 2>&1 | tail -4
npm run e2e 2>&1 | tail -4
```

Expected: labs 40, api 30 (28 baseline + 2 new), web roughly 184 (148 baseline + ~36 new − legacy), build clean, e2e 4.

- [ ] **Final 3: Dev-server smoke test**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
sleep 1
source .venv/bin/activate
npm run api:dev > /tmp/api-cp.log 2>&1 &
sleep 3
npm run web:dev > /tmp/web-cp.log 2>&1 &
sleep 5
for path in "/" "/chat" "/concepts" "/concepts/message-formatting" "/viz" "/__foundation"; do
  /usr/bin/curl -sS -o /dev/null -w "$path -> HTTP %{http_code}\n" "http://127.0.0.1:5173$path"
done
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
```

Expected: all routes HTTP 200.

- [ ] **Final 4: Hand off**

Stop here. Do not push or open a PR without the user's explicit instruction. Report:

- Commit list (`git log --oneline main..HEAD`).
- Final test counts per suite.
- One paragraph describing what `/chat` shows in dev (split layout, send → trace populates, each step visible, TokenFlow in step 3, SamplingPlot in step 6).
- Known follow-ups (per-token StreamStep animation, scratch-mode richer prose, memory editor in sub-project 7).
