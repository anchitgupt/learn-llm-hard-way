# Chat Playground + trace

Date: 2026-05-28

Sub-project 6 of the 7-part UI overhaul. Builds on the Design Foundation,
App Shell + Dashboard, Viz Library, Concept Workspace, and Concept Map.
Polishes the `/chat` route and the ChatPlayground component (also
embedded as the Experiment tab for chat concepts).

## Goal

Replace the un-styled `ChatPlayground` and its sibling panels with a
polished split-pane Chat Playground: composer + assistant reply on the
left, an 8-step trace timeline on the right. The trace teaches how a
chat message becomes a model response by exposing every intermediate
step (message formatting, tokenization, context window, generation,
sampling, streaming) with viz-library integration. The same component
mounts inside ConceptWorkspace's Experiment tab for chat concepts
without duplicating chrome.

This sub-project does **not** polish FailureMuseum or PreferencePanel —
they belong to sub-project 7 along with their own surfaces (the
`/failures` route and a `/chat/preference` sub-route).

## Principles

1. The pipeline is the lesson. Every step is visible at once on
   desktop; you scroll to inspect, not click to reveal.
2. Viz integration where it teaches. Step 3 (Tokenization) renders
   `<TokenFlow>`; Step 6 (Sampling) renders `<SamplingPlot>`. The other
   steps use small custom renderers.
3. Animation serves comprehension. Stream tokens appear left-to-right
   on first render; everything else animates with the foundation's
   quiet `Stagger` choreography. Reduced-motion is respected.
4. One screen, two surfaces. The same composition mounts at `/chat`
   (with a top header) and inside ConceptWorkspace's Experiment tab
   (without a top header). Achieved by exporting two components from
   the same file.

## Layout

```text
┌──────────────────────────── /chat ──────────────────────────────┐
│ Eyebrow: "Chat product"                                          │
│ H1: Send a message; inspect every step                           │
│ Subline: small explanatory text                                  │
├──────────────────────────────┬──────────────────────────────────┤
│ Left column (~55%)           │ Right column (~45%)              │
│                              │                                  │
│  <ChatComposer>              │  <TraceTimeline trace={trace} /> │
│   - Mode switches            │   - One vertical card per step   │
│   - Message textarea         │   - Steps 1..8                   │
│   - [Send] button            │   - Status: empty / loading      │
│                              │     / populated                  │
│  <ChatReply reply={…} />     │                                  │
│   - Final assistant text     │                                  │
└──────────────────────────────┴──────────────────────────────────┘

Below the lg breakpoint: columns stack (chat first, trace below).
```

The screen container uses
`flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr] gap-6`.

When embedded in the Experiment tab the page-level header is omitted;
ConceptHeader above the tab list already orients the learner.

## Files

| Path | Responsibility |
|------|----------------|
| `apps/web/src/screens/ChatPlayground.tsx` | Exports `ChatPlayground` (with top header, for `/chat`) and `ChatPlaygroundBody` (header-less, for embedding). |
| `apps/web/src/screens/chat/ChatComposer.tsx` | Mode switches + textarea + Send button. |
| `apps/web/src/screens/chat/ChatReply.tsx` | The assistant's final reply rendered as a bubble from `trace.finalReply`. |
| `apps/web/src/screens/chat/TraceTimeline.tsx` | Vertical timeline composing the per-step renderers. |
| `apps/web/src/screens/chat/useChatSession.ts` | Hook owning composer state + trace + loading/error + actions. |
| `apps/web/src/screens/chat/trace/TraceStep.tsx` | Shared per-step wrapper (numbered eyebrow + name + hint + content). |
| `apps/web/src/screens/chat/trace/UserStep.tsx` | Step 1: user message bubble. |
| `apps/web/src/screens/chat/trace/FormatStep.tsx` | Step 2: role-tagged formatted prompt. |
| `apps/web/src/screens/chat/trace/TokenStep.tsx` | Step 3: `<TokenFlow>` for `text → tokens → ids`. |
| `apps/web/src/screens/chat/trace/ContextStep.tsx` | Step 4: context-window strip with slot segments and a usage meter. |
| `apps/web/src/screens/chat/trace/GenerationStep.tsx` | Step 5: short prose + arrow into sampling. |
| `apps/web/src/screens/chat/trace/SamplingStep.tsx` | Step 6: `<SamplingPlot>` with the selected token highlighted. |
| `apps/web/src/screens/chat/trace/StreamStep.tsx` | Step 7: tokens animate left-to-right at 50 ms/token (capped at 60); Replay button. |
| `apps/web/src/screens/chat/trace/ReplyStep.tsx` | Step 8: compact echo of `ChatReply`. |
| `apps/web/src/screens/chat/trace/ToolStep.tsx` | Conditional, between Generation and Sampling when `toolTrace !== null`. |
| `apps/web/src/screens/chat/__tests__/*` and `apps/web/src/screens/chat/trace/__tests__/*` | Per-piece + integration tests. |
| `apps/web/src/routes.tsx` (modify) | Point `/chat` at the new screen. |
| `apps/web/src/screens/RouteWrappers.tsx` (modify) | Remove `ChatRoute`. |
| `apps/web/src/screens/concept/vizRegistry.ts` (modify) | `"chat-playground"` entry's Component changes from old `ChatPlayground` to `ChatPlaygroundBody`. |
| `apps/api/learn_llm_api/app.py` (modify) | Audit `/api/chat/demo` returns all trace fields the timeline reads; add any missing fields. |
| `apps/api/tests/test_app.py` (modify) | New tests: `toolMode=verified` populates `toolTrace`; `answerStyle=scratch` produces multi-entry `samplingTrace`. |
| `apps/web/src/components/ChatPlayground.tsx` (delete in Task 5) | Legacy. |
| `apps/web/src/components/TracePanel.tsx` (delete in Task 5) | Subsumed by TraceTimeline. |
| `apps/web/src/components/{FailureMuseum,PreferencePanel}.tsx` | **Kept** — sub-project 7 owns their polish. |

## ChatComposer

Four segmented switches (shadcn `<Tabs>` styled like sub-project 5's
`MapControls` filter):

- **Mode**: `base` | `assistant` — base-model completion vs assistant chat.
- **Answer style**: `short` | `scratch` — emit scratch-work tokens?
- **Tool mode**: `none` | `verified` — tool-verification on/off.
- **Memory mode**: `context` | `saved` — context-only vs saved-memory store.

Textarea uses `font-mono` for prompt-like inputs. Send button:
`disabled` while loading; shows "Sending…" during the request.

When `memoryMode === "saved"` and `GET /api/chat/memory` returns an
empty list, the composer shows a small inline hint:

> No saved memories yet. Open a chat concept to record one.

This avoids duplicating sub-project 7's memory UI while making the
empty case obvious.

## ChatReply

- No trace yet: empty state — *"Send a message to see how it flows
  through the model."*
- Trace with `finalReply`: rendered as an assistant bubble.
- Error from the send: inline `role="alert"` card with a Retry button;
  composer remains usable.

Scratch-work pedagogy is rendered inside `<SamplingStep>` (which shows
every entry in `samplingTrace`), not as a separate section in
`ChatReply`.

## Trace data shape

`POST /api/chat/demo` already returns a `ChatTrace`. The actual shape
in `apps/web/src/types.ts` is:

```ts
interface ChatTrace {
  messages:        Array<{ role: string; content: string }>;
  formattedPrompt: string;
  tokenTrace:      { text: string; tokens: string[]; tokenIds: number[]; vocabulary: ... };
  contextTrace:    { contextSize: number; keptTokens: string[]; keptTokenIds: number[];
                     droppedTokens: string[]; droppedTokenIds: number[] };
  samplingTrace:   Array<{ step: number; token: string; probabilities: Record<string, number>;
                     candidates: ... }>;
  streamChunks:    string[];
  toolTrace:       { tool: string; expression: string; result: string; explanation: string } | null;
  memoryTrace:     { mode: string; savedMemoriesUsed: string[]; contextOnly: boolean };
  finalReply:      string;
}
```

Per-step component mapping:

- `<UserStep>` → last `messages` entry with `role === "user"`.
- `<FormatStep>` → `formattedPrompt`.
- `<TokenStep>` → `tokenTrace.tokens` + `tokenTrace.tokenIds`.
- `<ContextStep>` → `contextTrace.keptTokens`, `contextTrace.droppedTokens`, `contextTrace.contextSize`.
- `<GenerationStep>` → narrative prose only; no dedicated field.
- `<SamplingStep>` → `samplingTrace` (one entry per generation step).
- `<StreamStep>` → `streamChunks`.
- `<ReplyStep>` → `finalReply` (rendered identically in the left-column `ChatReply`).
- `<ToolStep>` (conditional on `toolTrace !== null`) → `toolTrace`.

There is no dedicated `scratchWork` field. The `answerStyle: scratch`
mode already produces additional `samplingTrace` entries (the model
samples more intermediate tokens before settling on the final one).
The `<SamplingStep>` renders the full array and labels each entry as
"Step k of N", which gives the same pedagogical content as a separate
ScratchStep would. **There is no separate `<ScratchStep>`.**

Task 1 audits the chat-demo backend across mode combinations to
confirm every UI-consumed field is present and non-trivial. If a field
is empty for some combination (e.g. `samplingTrace` is single-entry
even when `answerStyle === "scratch"`), Task 1 patches the deterministic
local model to produce richer traces — no new ML.

## TraceTimeline composition

```text
①  User message               UserStep
②  Prompt formatting          FormatStep
③  Tokenization               TokenStep            → <TokenFlow>
④  Context window             ContextStep
⑤  Generation                 GenerationStep
   (⑤b)  Tool verification    ToolStep            ← conditional on toolTrace
⑥  Sampling                   SamplingStep         → <SamplingPlot>
   (renders one panel per samplingTrace entry; scratch mode produces extras)
⑦  Token stream               StreamStep          ← Motion stagger
⑧  Assistant reply            ReplyStep
```

Each step renders inside a shared `<TraceStep>` wrapper:

- Numbered eyebrow ("Step 3 of 8").
- `<h3>` name (17 / 24 semibold).
- Optional one-line hint that says what to look for.
- Vertical connecting line between consecutive cards so the timeline
  feel is intact.

## State model

`useChatSession()` owns:

```ts
interface ChatSessionState {
  message: string;
  mode: "base" | "assistant";
  answerStyle: "short" | "scratch";
  toolMode: "none" | "verified";
  memoryMode: "context" | "saved";

  trace: ChatTrace | null;
  loading: boolean;
  error: string | null;

  setMessage(value: string): void;
  setMode(value: "base" | "assistant"): void;
  setAnswerStyle(value: "short" | "scratch"): void;
  setToolMode(value: "none" | "verified"): void;
  setMemoryMode(value: "context" | "saved"): void;
  send(): Promise<void>;
}
```

`send()` calls
`runChatDemo({ message, mode, answerStyle, toolMode, memoryMode, contextSize: 96 })`,
sets the trace, surfaces errors. No persistence across navigation in
v1; the previous trace disappears on refresh.

`ChatComposer`, `ChatReply`, `TraceTimeline`, and each step are dumb
children — none of them call the API; each receives only the slice of
state it renders.

## Animation

- The whole `TraceTimeline` wraps in `<Stagger>` with 60 ms inter-step
  delay so the steps animate in top-to-bottom on first paint and on
  each new trace.
- `<StreamStep>` has its own token-by-token animation: tokens appear
  left-to-right at 50 ms each, capped at the first 60 tokens (remaining
  tokens render instantly). A Replay button re-triggers the animation.
- All animation honours `prefers-reduced-motion`.

## Loading / empty / error states

- Initial mount, no trace: `<TraceTimeline>` renders 8 ghost cards with
  `<Skeleton>` content so the layout does not shift when the first
  trace arrives.
- Request in flight: each step's body shows a subtle `<Skeleton>`
  overlay so the previous trace stays visible — supports A/B comparison
  by switching modes and re-sending.
- Send rejected: the timeline renders a single error card with
  "Couldn't run chat demo" + Retry; composer stays usable.

## API touch

`POST /api/chat/demo` already returns the full trace. Task 1 verifies
every field the timeline reads is present for every mode combination
and adds any that are missing (using the same hard-coded deterministic
local model in `llm_from_scratch.chat.local_model`; no new ML).

| File | Change |
|------|--------|
| `apps/api/learn_llm_api/app.py` | Field audit; add any missing field with the same deterministic data so the timeline never renders an empty step. |
| `apps/api/tests/test_app.py` | New test: `toolMode=verified` round-trips `toolVerification`; new test: `answerStyle=scratch` round-trips `scratchWork`. |

About 30 LOC of backend changes plus 2 new API tests.

## Migration plan

Five ordered tasks; each independently verifiable.

### Task 1: API trace-field audit + tests

Confirm every trace field the UI reads exists for every mode
combination. Add fields if missing; add the two API tests. Verify:
`npm run api:test` shows 30 passed.

### Task 2: `useChatSession` + minimal composer/reply (TDD)

Build the hook and TDD it: state transitions, send sets loading,
populates trace, surfaces error. Add `ChatComposer` and `ChatReply` so
the playground can already run (without the trace) at the end of this
task. Verify: web suite green, build clean.

### Task 3: Per-step components + `<TraceTimeline>` (TDD)

Build `TraceStep`, the 8 mandatory step components (UserStep,
FormatStep, TokenStep, ContextStep, GenerationStep, SamplingStep,
StreamStep, ReplyStep), the 2 conditional ones (ScratchStep, ToolStep),
and the `TraceTimeline` container. TDD each. Verify: ~12 new test files,
build clean.

### Task 4: `ChatPlayground` screen + route swap + e2e selector updates

Compose composer + reply + timeline into `ChatPlayground` and
`ChatPlaygroundBody`. Update `routes.tsx` to point `/chat` at the new
screen. Update `vizRegistry.ts`'s `"chat-playground"` entry to point at
`ChatPlaygroundBody`. Remove `ChatRoute` from `RouteWrappers.tsx`. Run
e2e — phase-4 currently exercises the legacy ChatPlayground; its
selectors need updating (likely: `getByLabel("Chat message")` →
`getByRole("textbox", { name: /message/i })`, etc.; the "Save memory"
flow is dropped because memory editing moves to sub-project 7). Verify:
web suite + e2e green.

### Task 5: Cleanup

Audit + delete `apps/web/src/components/ChatPlayground.tsx` and
`apps/web/src/components/TracePanel.tsx`. Keep `FailureMuseum.tsx` and
`PreferencePanel.tsx` — sub-project 7 owns them. Verify: build clean;
no dead imports.

## Verification

The sub-project is done when all of these are green.

- `npm run labs:test` — 40 passed (unchanged).
- `npm run api:test` — 28 baseline + 2 new = 30 passed.
- `npm --prefix apps/web test` — baseline 148 + ~22 new − a handful
  from deleted legacy tests ≈ 165+ passing.
- `npm --prefix apps/web run build` — clean.
- `npm run e2e` — 4 chromium flows pass. Phase-4 selectors updated;
  remember to `rm -f .learn-llm/e2e-progress.sqlite` if the suite
  flakes.
- Manual: visit `/chat` — split layout, switches, send → trace
  populates with the 8 steps; TokenFlow appears in step 3, SamplingPlot
  in step 6; step 7 animates the stream.
- Manual: visit `/concepts/message-formatting` → Experiment tab — the
  header-less ChatPlaygroundBody renders inside the workspace; no page
  header collision.
- Manual: viewport narrower than `lg` — columns stack cleanly.
- Manual: `prefers-reduced-motion: reduce` — Stagger and StreamStep
  skip animation; everything still renders.

## Out of scope

Deferred to later sub-projects or follow-ups.

- Chat memory editor / list — sub-project 7.
- Failure Museum embed inside the playground — sub-project 7.
- Preference RLHF panel — sub-project 7.
- Persistent chat sessions or history — v1 is single-shot per send.
- Streaming the trace live from the server (chunked transfer); v1
  animates client-side over a complete trace.
- Free-form prompt editing of the formatted prompt (step 2) is
  read-only in v1.
- Multi-turn chat threads — v1 is one user message per send.

## Risks and mitigations

- **e2e phase-4 selector drift.** The phase-4 test currently clicks an
  old "Save memory" button inside the legacy ChatPlayground. The new
  ChatPlayground does not have memory editing. We update the e2e to
  test only the new flow (send + assistant reply visible + sampling
  probability visible). The "Save memory" coverage moves to
  sub-project 7's memory UI.
- **Trace size.** For long generations `stream[]` could have hundreds
  of tokens. The 50 ms-per-token animation would drag. Cap the animated
  segment at 60 tokens; tokens beyond render instantly. Documented in
  `StreamStep`.
- **Embedded vs route in the Experiment tab.** Because the same
  `ChatPlaygroundBody` renders in two surfaces, any `position: fixed`
  element would risk double-mount. The shell owns the Toaster from
  sub-project 2; the playground uses no portals of its own.
- **`vizRegistry` cycle risk.** After the swap, `vizRegistry.ts`
  imports `ChatPlaygroundBody` from `screens/ChatPlayground.tsx`. That
  file does not import the registry, so no cycle. Verified by the
  build's TS check.
