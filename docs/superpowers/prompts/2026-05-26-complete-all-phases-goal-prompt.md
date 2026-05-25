# Goal Prompt: Complete Learn LLM The Hard Way End To End

Use this prompt in a new Codex session when the goal is to continue this project until every planned phase has working, verified code.

~~~text
You are Codex working on the `learn-llm-hard-way` project.

Mission
Complete the full local-first learning project for building LLMs from first principles through a user-facing chat experience. The outcome must be a working codebase, not a documentation-only plan. Every phase must include real labs, real app behavior, tests, run instructions, and browser verification.

Current Source Of Truth
- Start from the latest verified Phase 1 work. If `phase-1-foundation` has not been merged to `main`, branch from `phase-1-foundation` or merge it safely first.
- Read these files before changing code:
  - `docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md`
  - `docs/superpowers/plans/2026-05-25-phase-1-foundation.md`
  - `docs/superpowers/specs/2026-05-26-phase-2-learning-core-design.md`
  - `docs/superpowers/plans/2026-05-26-phase-2-learning-core.md`
  - `README.md`
  - `docs/run.md`
- Keep the Karpathy deep-dive requirements from the design spec visible throughout the work: pretraining, SFT, RL/RLHF, base model versus assistant, context window, memory, hallucination/factuality, tool use, reasoning, and the user-facing chat trace.

Non-Negotiables
- Do not skip phases.
- Do not leave placeholder code, fake UI, TODO implementation notes, or untested stubs.
- Do not claim completion without running verification commands and checking their output.
- Keep the project local-first. No cloud auth, hosted sync, paid model API, or required GPU path.
- Keep early labs CPU-friendly. Colab/GPU is optional extension material only.
- Use real, understandable implementations before using larger libraries. For example: pure Python tokenization, math, gradients, attention, sampling, and tiny training loops before optional PyTorch-style scale-up lanes.
- Follow the existing architecture: `apps/web`, `apps/api`, `content`, `labs/python`, `docs`, and `tests/e2e`.
- Keep learner state local in SQLite and artifacts as local files.
- Keep app-triggered lab execution safe: only allowlisted deterministic demos, no arbitrary command execution from the web UI.
- Treat Gemini-generated SVG or animation assets as drafts. Validate them using the local `gemini-svg-animation` workflow before using them in the app.
- Commit coherent working slices. Each meaningful phase/task should end with tests passing and a clean status except intentional generated artifacts ignored by git.

Required Working Phases

Phase 1: Foundation
- Confirm the existing foundation still works.
- Expected capabilities: monorepo tooling, Python tokenizer labs, FastAPI content/progress API, React learning shell, Data and Tokens lessons, tokenization visual, local notes/progress/revisit state, and Phase 1 e2e path.
- If Phase 1 is not merged into the active branch, integrate it safely before extending it.

Phase 2: Learning Core
- Execute `docs/superpowers/plans/2026-05-26-phase-2-learning-core.md` task by task.
- Required capabilities: concept map, glossary, checkpoint attempts, notes, confidence tracking, missed-topic queue, safe tiny lab runner, recent artifacts, Math for Models content, Early Neural Nets content, and Phase 2 e2e flow.
- Required labs: vectors, dot products, similarity, logits/softmax, scalar gradients, tiny linear model, loss, and one-step optimization.
- Required UI: dense learning cockpit, concept workspace tabs, glossary panel, lab panel, checkpoint panel, and direct navigation from missed topics back to the right concept.

Phase 3: Mini LLM
- Write a focused Phase 3 design spec and implementation plan before coding.
- Required capabilities:
  - Attention labs with visible dot-product attention.
  - Masked self-attention.
  - Positional encoding.
  - Transformer block implementation.
  - Tiny dataset preparation and packing.
  - Tiny next-token training loop.
  - Loss charts and generated sample artifacts.
  - Artifact browser integration.
  - Sampling controls: greedy, temperature, top-k or nucleus where appropriate.
  - Base-model versus assistant-behavior demonstration using small local examples.
  - Hallucination/factuality failure examples tied to model limitations.
- Keep the implementation small enough to run locally. If an optional larger experiment is useful, document it separately as a Colab/GPU extension without making it required.

Phase 4: Chat
- Write a focused Phase 4 design spec and implementation plan before coding.
- Required capabilities:
  - Local chat playground.
  - Prompt/message formatting trace.
  - Tokenization trace.
  - Context-window assembly trace.
  - Sampling decision trace.
  - Token streaming trace.
  - Base-completion mode versus assistant-chat mode.
  - Short-answer mode versus scratch-work mode.
  - No-tools mode versus tool-verified mode.
  - Context-only memory versus saved local memory.
  - Failure museum for counting, spelling, arithmetic, token-boundary surprises, date/factuality traps, and hallucinations.
  - Tool-use verification demos where code execution is visibly more reliable than model-only arithmetic or factual guessing.
  - Tiny preference/RLHF-style simulations that explain reward modeling, preference ranking, verifiable tasks, and unverifiable tasks.
- The chat UI must show how a user-facing chat maps back to model mechanics. It should not be a black-box chat screen.

Extension Readiness
- Add optional Colab notebooks or documented Colab lanes only after the local path is complete.
- Colab material must connect back to local artifacts and explain what changes at larger scale.
- Add future nodes for multimodality, agents, computer use, and long-running tasks, but do not make them dependencies of the core text LLM/chat path.

Implementation Method
1. Inspect current branch, status, and recent commits.
2. If there is an approved plan for the current phase, execute it directly with task checkboxes.
3. If the next phase has no plan yet, create:
   - `docs/superpowers/specs/YYYY-MM-DD-<phase-name>-design.md`
   - `docs/superpowers/plans/YYYY-MM-DD-<phase-name>.md`
4. Use test-driven development for code changes:
   - Write or update failing tests first.
   - Implement the smallest real code that passes.
   - Refactor only after tests pass.
5. For frontend changes, add or update component tests and e2e tests.
6. For educational visuals, use SVG, Canvas, D3, React Flow, Motion for React, and CSS transitions according to the existing design spec.
7. Run browser verification after meaningful UI changes and save screenshots under ignored output paths.
8. Update `README.md` and `docs/run.md` whenever setup, run commands, ports, or workflows change.
9. Keep commits small enough to review, but do not commit broken intermediate states.

Verification Gates
Before claiming any phase is complete, run the relevant full local verification from a clean shell:

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e
```

Also perform a browser visual check:
- Start API locally.
- Start web locally.
- Open `http://127.0.0.1:5173`.
- Verify the dashboard, concept workspace, labs, progress state, and any new phase-specific UI.
- For Chat phase, verify the full chat trace from user message to rendered assistant reply.
- Capture at least one screenshot for the completed phase.

Final Acceptance Criteria
- All planned phases are implemented with working code.
- The app can be run locally from documented commands.
- The learner can start at bytes/tokens and proceed through math, learning, transformers, mini LLM training, and chat mechanics.
- Missed or confusing topics can be revisited from persisted local state.
- Labs produce deterministic artifacts that the app can show.
- The chat playground exposes message formatting, tokenization, context assembly, generation/sampling, streaming, tool verification, and memory behavior.
- The failure museum and factuality demos are connected to real examples, not static filler.
- Tests pass across labs, API, web, and e2e.
- `README.md` and `docs/run.md` explain setup, running, verification, and optional Colab extension paths.
- Git status is clean or only contains explicitly explained untracked ignored artifacts.

Final Report Format
When finished, report:
- Branch name and commit range.
- Phases completed.
- Verification commands run and results.
- Local run commands and URL.
- Screenshots or artifact paths created.
- Any known limitations or explicitly deferred extension work.

Stop Only If
- A required dependency cannot be installed after reasonable recovery.
- Existing user changes conflict with the phase implementation and cannot be safely merged.
- A security constraint would be violated.
- The project direction needs a user decision that cannot be inferred from the approved specs.
~~~
