# Learn LLM The Hard Way

A local-first, code-first project for learning how large language models are built from the smallest pieces up to a user-facing chat experience.

The project combines:

- Python labs that implement model-building mechanics directly.
- A FastAPI local API for curriculum, progress, safe lab runs, and artifacts.
- A React learning app for concept navigation, visuals, checkpoints, notes, and revisit recovery.
- Versioned lessons and glossary content in the repo.
- Local SQLite progress state and local artifact files.

## Current Status

Phase 1 and Phase 2 are implemented on `main`.

Phase 1 foundation includes:

- Monorepo tooling.
- Character tokenizer and byte pair encoding labs.
- Tokenization demo artifacts.
- FastAPI content/progress API.
- React learning shell.
- Data and Tokens lessons.
- Browser-tested flow for opening a lesson and saving revisit progress.

Phase 2 learning core includes:

- Math for Models and Early Neural Nets curriculum.
- Glossary content and glossary UI.
- Concept map with prerequisite edges.
- Missed-topic queue.
- Notes and confidence tracking.
- Checkpoint attempts with deterministic feedback.
- Safe allowlisted lab runner.
- Recent artifact tracking.
- Pure-Python vector, softmax, scalar-gradient, and tiny-linear-model labs.
- Browser-tested flow for running a math lab and adding a low-confidence checkpoint to missed topics.

## What You Can Learn Now

The implemented path currently covers:

- Bytes, Unicode, character tokenization, and BPE.
- Vectors, dot products, logits, and softmax.
- Scalar gradients, loss, and one-step optimization.
- How local progress, confidence, failed checkpoints, and revisit state create a recoverable learning path.

Upcoming phases are planned to add:

- Attention and masked self-attention.
- Transformer blocks.
- Tiny next-token training loops.
- Loss charts and generated samples.
- Base-model versus assistant demonstrations.
- Hallucination and factuality failure cases.
- A chat playground with prompt, tokenization, context, sampling, streaming, tool-use, and memory traces.

## Repository Layout

```text
apps/
  api/        FastAPI local API
  web/        Vite + React learning app
content/      Curriculum JSON, lessons, and glossary
labs/python/  From-scratch Python implementations and experiments
tests/e2e/    Playwright browser flows
docs/         Runbooks, specs, plans, and reusable prompts
```

## First Setup

```bash
uv venv --python 3.13 --seed .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[dev]"
npm install
npm --prefix apps/web install
npx playwright install chromium
```

## Run Locally

Terminal 1:

```bash
source .venv/bin/activate
npm run api:dev
```

Terminal 2:

```bash
npm run web:dev
```

Open `http://127.0.0.1:5173`.

## Verify

Use the virtual environment for Python-backed commands:

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e
```

Current verified counts:

- Labs: 20 tests.
- API: 15 tests.
- Web: 10 tests.
- E2E: 2 browser flows.

## Run

See [docs/run.md](docs/run.md) for the concise runbook.

## Design

Core project design:

- [Learn LLM The Hard Way Design](docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md)
- [Phase 2 Learning Core Design](docs/superpowers/specs/2026-05-26-phase-2-learning-core-design.md)

Execution plans:

- [Phase 1 Foundation Plan](docs/superpowers/plans/2026-05-25-phase-1-foundation.md)
- [Phase 2 Learning Core Plan](docs/superpowers/plans/2026-05-26-phase-2-learning-core.md)

Reusable continuation prompt:

- [Complete All Phases Goal Prompt](docs/superpowers/prompts/2026-05-26-complete-all-phases-goal-prompt.md)
