# Phase 4 Chat Mechanics Design

Date: 2026-05-27

Base design: `docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md`

## Goal

Build the local chat-product learning slice. The learner should be able to type a message, see a deterministic local response, and inspect every step that turns the user-facing chat into model-facing mechanics.

Phase 4 should not be a black-box chatbot. It should be a traceable chat playground that explains prompt formatting, tokenization, context-window assembly, sampling, streaming, tools, memory, failures, and preference-style post-training concepts.

## Approved Direction

Use a **Transparent Chat Playground** approach.

This means Phase 4 prioritizes:

- Local deterministic behavior over external model APIs.
- Every user-facing output paired with an internal trace.
- Small allowlisted demos for arithmetic/date verification instead of arbitrary code execution.
- Saved local memory as explicit SQLite state.
- Failure examples connected to tokenization, limited context, missing facts, and model-only guessing.
- Tiny preference/RLHF-style simulations as understandable artifacts, not production RLHF.

## Scope

### Included

1. Chat Product curriculum
   - Prompt/message formatting.
   - Tokenization trace.
   - Context-window assembly.
   - Sampling and streaming trace.
   - Base completion versus assistant chat.
   - Short answer versus scratch-work mode.
   - No-tools versus tool-verified mode.
   - Context-only memory versus saved local memory.
   - Failure museum.
   - Preference/RLHF-style simulations.

2. Python chat mechanics
   - Role/message formatting.
   - Deterministic local tokenization with the existing character tokenizer.
   - Context-window packing and truncation trace.
   - Deterministic local next-token style response demo.
   - Sampling decision trace.
   - Token streaming chunks.
   - Allowlisted tool verification for arithmetic and fixed-date examples.
   - Memory assembly that separates current context from saved local memory.
   - Preference ranking and reward-model toy simulation.

3. API integration
   - Deterministic chat demo endpoint.
   - Failure museum endpoint.
   - Preference simulation endpoint.
   - Optional local memory save/list endpoints backed by SQLite.
   - No arbitrary code, shell, network, model name, or command execution from the browser.

4. Web app
   - Chat Playground screen/panel.
   - Mode controls:
     - Base completion versus assistant chat.
     - Short answer versus scratch-work.
     - No tools versus tool verified.
     - Context-only memory versus saved local memory.
   - Trace panels:
     - Messages.
     - Prompt formatting.
     - Tokenization.
     - Context assembly.
     - Sampling.
     - Streaming.
     - Tool verification.
     - Memory.
   - Failure Museum panel.
   - Preference/RLHF simulation panel.

5. Documentation
   - Add Phase 4 course page.
   - Update README and course index when Phase 4 is available.
   - Keep optional Colab/GPU material separate from the required local path.

### Deferred

- Paid model API integration.
- Internet retrieval.
- Arbitrary Python execution from the web app.
- Full production RAG.
- Production RLHF.
- Multi-user cloud memory.
- Hosted deployment.

## Learning Model

Phase 4 should answer this sequence:

1. What does the chat UI collect from the user?
2. How do system/user/assistant roles become a formatted prompt?
3. What tokens does that prompt become?
4. What fits into the context window and what is dropped?
5. How does a base-completion mode differ from assistant-chat mode?
6. How do sampling choices become a response?
7. What does token streaming mean at the UI layer?
8. Why do short-answer constraints hurt tasks that need intermediate work?
9. When are tools more reliable than model-only guessing?
10. What is the difference between current context and saved local memory?
11. Why do failure cases happen?
12. What does preference ranking optimize in a tiny RLHF-style simulation?

## Content Design

Add a new `chat-product` track under `content/concepts/`.

Initial concepts:

- `message-formatting`
- `tokenization-trace`
- `context-window-trace`
- `sampling-streaming`
- `base-vs-assistant-chat`
- `scratch-work`
- `tool-verification`
- `chat-memory`
- `failure-museum`
- `preference-rlhf`

Each concept should include:

- Prerequisites from Phase 1-3.
- Lesson markdown.
- Lab id.
- Visual id.
- Checkpoint answer and accepted keywords.
- Glossary ids.
- Status `available`.

## Python Lab Design

Add focused modules under `labs/python/llm_from_scratch/`:

```text
chat/
  __init__.py
  formatting.py
  context.py
  local_model.py
  tools.py
  failures.py
  preference.py
experiments/
  chat_demo.py
```

Core data structures:

- `ChatMessage`: role and content.
- `ChatOptions`: mode, answer style, tool mode, memory mode, context size.
- `ChatTrace`: messages, formatted prompt, tokens, context, sampling decisions, stream chunks, tool trace, memory trace, final reply.
- `FailureCase`: id, category, prompt, model-only output, explanation, better strategy.
- `PreferenceSimulation`: prompt, candidate responses, ranking, reward scores, explanation.

Keep all examples deterministic so tests, screenshots, and learning traces stay stable.

## API Design

Add endpoints:

- `POST /api/chat/demo`
- `GET /api/chat/failures`
- `GET /api/chat/preference`
- `GET /api/chat/memory`
- `POST /api/chat/memory`

`POST /api/chat/demo` accepts only structured options and a user message. It must not accept arbitrary commands, tool code, file paths, model names, URLs, or network instructions.

## Web UX Design

Add a Chat Playground to the learning cockpit.

The main chat area should be compact:

- User message input.
- Mode controls.
- Send button.
- Assistant reply.
- Streaming chunks.

The inspection area should be the primary learning surface:

- Prompt Trace.
- Token Trace.
- Context Trace.
- Sampling Trace.
- Tool Trace.
- Memory Trace.

The screen should remain work-focused and dense. It should not become a marketing chat page.

## Failure Museum Design

Failure cases should be structured examples, not static filler:

- Counting: tokenization and sequence tracking problems.
- Spelling: token boundary surprises.
- Arithmetic: model-only guessing versus tool verification.
- Date/factuality: missing or unstable facts.
- Hallucination: plausible unsupported completions.

Each case should show:

- Prompt.
- Model-only behavior.
- Why it fails.
- Better strategy.
- Related concept ids.

## Preference/RLHF Simulation Design

The simulation should show:

- A prompt.
- Candidate responses.
- Preference ranking.
- A tiny reward score.
- Which response would be selected.
- Why verifiable tasks are easier to reward than unverifiable tasks.

This is a conceptual simulation, not production reinforcement learning.

## Testing Strategy

Python tests:

- Message formatting.
- Tokenization trace.
- Context-window truncation.
- Base mode versus assistant mode.
- Sampling and streaming trace.
- Tool verification.
- Memory assembly.
- Failure cases.
- Preference simulation.

API tests:

- Chat demo endpoint returns trace fields.
- Memory endpoints persist local state.
- Failure/preference endpoints return structured examples.
- Unknown or unsafe tool modes are rejected.

Frontend tests:

- Chat Playground renders controls and trace panels.
- Sending a message shows assistant output and trace details.
- Failure Museum renders structured cases.
- Preference panel renders ranking and reward scores.

End-to-end tests:

- Open Chat Product concept or playground.
- Send a message.
- Inspect prompt, token, context, sampling, stream, tool, and memory traces.
- Save memory and run a message that includes it.
- Open Failure Museum and Preference simulation.

## Acceptance Criteria

- Phase 4 has a design spec and implementation plan.
- The app exposes a local chat playground.
- The chat playground shows message formatting, tokenization, context assembly, sampling decisions, streaming chunks, tools, and memory behavior.
- Base-completion and assistant-chat modes produce visibly different traces.
- Tool-verified arithmetic/date demos are visibly more reliable than model-only guesses.
- Saved local memory is persisted in SQLite and shown separately from current context.
- Failure museum examples are connected to real deterministic examples.
- Preference/RLHF simulation explains ranking and reward scoring.
- The full verification gate passes:

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e
```
