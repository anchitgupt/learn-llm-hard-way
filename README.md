# Learn LLM The Hard Way

A local-first, code-first course for learning how large language models are built, from bytes and tokens to a user-facing chat experience.

This repository is not only notes. It contains working Python labs, a local FastAPI backend, a React learning app, local progress state, checkpoints, artifacts, and browser-tested learning flows.

## Start Here

1. Set up and run the project with [docs/run.md](docs/run.md).
2. Open the learning app at `http://127.0.0.1:5173`.
3. Follow the course map below in order.
4. Use checkpoints, confidence, notes, and missed topics to return to anything you skipped or forgot.

## Course Map

| Stage | Module | Status | Main outcome |
| --- | --- | --- | --- |
| 1 | [Foundation: Data And Tokens](docs/course/phase-1-foundation.md) | Available | Understand bytes, Unicode, tokenization, and BPE with working labs. |
| 2 | [Learning Core: Math And Tiny Models](docs/course/phase-2-learning-core.md) | Available | Build intuition for vectors, logits, softmax, gradients, loss, and one-step optimization. |
| 3 | [Mini LLM](docs/course/upcoming-phases.md#phase-3-mini-llm) | Planned | Implement attention, transformer blocks, next-token training, and sampling. |
| 4 | [Chat Mechanics](docs/course/upcoming-phases.md#phase-4-chat-mechanics) | Planned | Trace prompt formatting, tokenization, context assembly, streaming, tools, and memory. |

For the full course structure, see [docs/course/index.md](docs/course/index.md).

## How Each Module Works

Each module is meant to be revisitable:

1. Read a short lesson.
2. Run a small deterministic lab.
3. Inspect the output artifact.
4. Answer a checkpoint.
5. Mark confidence and save notes.
6. Return from the missed-topic queue when something needs review.

## Current Implementation

Available now:

- Phase 1 foundation.
- Phase 2 learning core.
- Local API and web app.
- Local SQLite learner state.
- Safe allowlisted lab execution.
- Recent lab artifacts.
- Browser-tested learning flows.

Planned next:

- Phase 3 mini LLM implementation.
- Phase 4 chat mechanics playground.
- Optional Colab/GPU extension lanes after the local path is complete.

## Project Layout

```text
apps/api       Local FastAPI backend
apps/web       Vite + React learning app
content        Course concepts, lessons, and glossary
labs/python    From-scratch Python labs
tests/e2e      Playwright browser flows
docs           Runbooks, specs, plans, prompts, and course pages
```

## Run And Verify

- Setup and local run commands: [docs/run.md](docs/run.md)
- Course overview: [docs/course/index.md](docs/course/index.md)
- Core design: [LLM course design spec](docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md)
- Continuation prompt: [complete all phases goal prompt](docs/superpowers/prompts/2026-05-26-complete-all-phases-goal-prompt.md)
