# Course Overview

Learn LLM The Hard Way is organized as a hands-on course. The path starts from the smallest representations and gradually builds toward the behavior a user sees in chat.

## Study Path

| Order | Module | Why it matters |
| --- | --- | --- |
| 1 | [Foundation: Data And Tokens](phase-1-foundation.md) | Models do not read text directly. They receive token IDs built from bytes, Unicode, and tokenization rules. |
| 2 | [Learning Core: Math And Tiny Models](phase-2-learning-core.md) | Neural networks turn vectors into scores, probabilities, losses, gradients, and parameter updates. |
| 3 | [Mini LLM](phase-3-mini-llm.md) | Transformers combine attention, positional information, training loops, and sampling into a small language model. |
| 4 | [Chat Mechanics](phase-4-chat.md) | Chat products wrap model completion with prompts, messages, context windows, tools, streaming, and memory. |

## Learning Loop

Use the same loop for every topic:

1. Open the lesson in the web app.
2. Read the concept explanation.
3. Run the matching lab.
4. Inspect the generated artifact.
5. Answer the checkpoint.
6. Save notes and confidence.
7. Revisit missed or low-confidence topics later.

## Local Components

- `apps/web` shows the course cockpit, concepts, glossary, labs, checkpoints, notes, and revisit state.
- `apps/api` serves course content, learner progress, safe lab runs, and artifact metadata.
- `content` stores the versioned concepts, lessons, and glossary entries.
- `labs/python` contains the from-scratch implementations used by the course.
- `artifacts/labs` stores generated local lab outputs.

## Run The Course

Use [../run.md](../run.md) for setup, local dev servers, verification commands, and troubleshooting.
