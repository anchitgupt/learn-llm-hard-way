# Phase 4: Chat Mechanics

Phase 4 shows how a user-facing chat maps back to model mechanics.

## Goal

Build a concrete mental model for:

- Message formatting.
- Tokenization traces.
- Context-window assembly.
- Sampling and streaming.
- Base-completion mode versus assistant-chat mode.
- Short answers versus scratch-work.
- Tool verification.
- Saved local memory.
- Failure cases.
- Preference and RLHF-style ranking.

## Concepts

| Concept | Focus |
| --- | --- |
| [Chat Product Track](../../content/concepts/chat-product.json) | The ordered Phase 4 concept graph. |

## Lessons

| Lesson | Focus |
| --- | --- |
| [Message Formatting](../../content/lessons/chat-product/message-formatting.md) | How roles become model-facing text. |
| [Tokenization Trace](../../content/lessons/chat-product/tokenization-trace.md) | How formatted prompts become token IDs. |
| [Context Window Trace](../../content/lessons/chat-product/context-window-trace.md) | What the model can and cannot see. |
| [Sampling And Streaming](../../content/lessons/chat-product/sampling-streaming.md) | How generation chunks become UI output. |
| [Base Completion Versus Assistant Chat](../../content/lessons/chat-product/base-vs-assistant-chat.md) | How formatting changes behavior. |
| [Scratch Work](../../content/lessons/chat-product/scratch-work.md) | Why intermediate tokens matter. |
| [Tool Verification](../../content/lessons/chat-product/tool-verification.md) | Why tools beat model-only guessing for exact tasks. |
| [Chat Memory](../../content/lessons/chat-product/chat-memory.md) | Saved local memory versus current context. |
| [Failure Museum](../../content/lessons/chat-product/failure-museum.md) | Counting, spelling, arithmetic, factuality, and hallucination traps. |
| [Preference And RLHF](../../content/lessons/chat-product/preference-rlhf.md) | Ranking and reward scoring as a tiny simulation. |

## Labs

The Phase 4 lab produces a local chat trace artifact:

- Formatted prompt.
- Token trace.
- Context trace.
- Sampling trace.
- Stream chunks.
- Tool trace.
- Memory trace.
- Failure cases.
- Preference simulation.

## App Flow

Use the learning cockpit to:

1. Open the Chat Product track.
2. Start with Message Formatting.
3. Run the chat mechanics demo.
4. Inspect the trace.
5. Use the Chat Playground for a user-facing message.
6. Compare no-tools and tool-verified behavior.
7. Save local memory and inspect how it enters a later prompt.

## Verification

Phase 4 is covered by Python lab tests, API tests, web component tests, the Vite build, and Playwright e2e. Use [../run.md](../run.md) for the project verification commands.
