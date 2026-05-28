# Lab: `chat-mechanics-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`../chat-playground.md`](../chat-playground.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `chat-mechanics-demo`                                                  |
| Concept | `message-formatting` (also covers `tool-verification` and `chat-memory`) |
| Writer  | `labs/python/llm_from_scratch/experiments/chat_demo.py:write_chat_demo_artifact` |
| Viz key | `chat-playground` (mounts `<ChatPlaygroundBody>`)                      |

## Artifact shape

| Key             | Type                                  | Use                                  |
|-----------------|---------------------------------------|--------------------------------------|
| `trace`         | `ChatTrace`                           | Reused by the live `/chat` surface   |
| `failures`      | `FailureCase[]`                       | Stable cross-link to `/failures`     |
| `preference`    | `PreferenceSimulation`                | Cross-link to PreferenceSection      |
| `memoryExample` | `{ savedMemories, memoryTrace }`     | Memory-effect snapshot               |
| `conceptIds`    | string[]                              | Multi-concept attribution            |

## Experiment-tab rules

- The Experiment tab on this concept mounts `<ChatPlaygroundBody>` (header-
  less) via the viz registry. **Don't** add a page header inside the body
  — the concept page already has an h1 from `ConceptHeader`.
- The mounted playground is fully interactive and not bound to the
  artifact's `trace` — users can issue new messages from inside the
  Experiment tab.

## Lab-tab notes

- The Run-lab button produces a deterministic artifact based on a fixed
  prompt. The artifact is intentionally separate from any session the user
  is having in `/chat`.
- Don't show the recorded `trace` as a static rendering on the Lab tab —
  the live playground does that better. The Lab tab is for "I ran the
  lab; it succeeded; see Artifacts".

## A11y

- Same as the chat playground page.
- The Experiment tab inherits the dual-view (composer + timeline)
  semantics; do not refactor to mutual-exclusive views.
