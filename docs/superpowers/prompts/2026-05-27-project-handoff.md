# Project Handoff: Learn LLM The Hard Way

Use this handoff in a new Codex session to continue from the completed local-first LLM learning project.

```text
You are Codex working on the `learn-llm-hard-way` project.

Repo
- Path: /Users/anchitgupta/Documents/Github/learn-llm-hard-way
- Branch: main
- Latest implementation commit before this handoff document: 992362f test: add phase four chat e2e
- main was ahead of origin/main by 44 commits before this handoff document was added.

Current Status
All four core phases are implemented locally with working code:

Phase 1: Foundation
- Data and Tokens curriculum.
- Character tokenizer and BPE labs.
- FastAPI content/progress API.
- React learning shell.
- SQLite-backed notes, progress, confidence, and revisit state.
- Phase 1 Playwright flow.

Phase 2: Learning Core
- Math for Models and Early Neural Nets curriculum.
- Concept map, glossary, checkpoint attempts, missed-topic queue, confidence, notes.
- Safe allowlisted local lab runner.
- Pure-Python vector, softmax, scalar-gradient, and tiny-linear-model labs.
- Phase 2 Playwright flow.

Phase 3: Mini LLM
- Transformer curriculum.
- Attention, causal masking, positional encoding, transformer block mechanics.
- Tiny dataset packing.
- Tiny next-token training and sampling artifacts.
- Base versus assistant and factuality failure examples.
- Structured artifact preview in the web app.
- Phase 3 Playwright flow.

Phase 4: Chat Mechanics
- Chat Product curriculum.
- Local transparent chat trace engine.
- Chat API endpoints.
- SQLite-backed saved local memory.
- React Chat Playground.
- Prompt, tokenization, context, sampling, stream, tool, and memory traces.
- Tool-verified arithmetic demo.
- Failure museum.
- Preference/RLHF-style simulation.
- Phase 4 Playwright flow.

Important Source Docs
- README.md
- docs/run.md
- docs/course/index.md
- docs/course/phase-1-foundation.md
- docs/course/phase-2-learning-core.md
- docs/course/phase-3-mini-llm.md
- docs/course/phase-4-chat.md
- docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md
- docs/superpowers/specs/2026-05-26-phase-2-learning-core-design.md
- docs/superpowers/specs/2026-05-26-phase-3-mini-llm-design.md
- docs/superpowers/specs/2026-05-27-phase-4-chat-design.md
- docs/superpowers/plans/2026-05-25-phase-1-foundation.md
- docs/superpowers/plans/2026-05-26-phase-2-learning-core.md
- docs/superpowers/plans/2026-05-26-phase-3-mini-llm.md
- docs/superpowers/plans/2026-05-27-phase-4-chat.md

Run Locally
Terminal 1:

source .venv/bin/activate
npm run api:dev

Terminal 2:

npm run web:dev

Open:

http://127.0.0.1:5173

Full Verification Command
Run this from repo root:

source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e

Last Full Verification Evidence
- Labs: 40 passed.
- API: 22 passed.
- Web: 16 passed.
- Web build: passed.
- E2E: 4 passed.

Manual Browser Checks
- Phase 3 screenshot: output/playwright/phase3-mini-llm-manual-check.png
- Phase 4 screenshot: output/playwright/phase4-chat-mechanics-manual-check.png

Local Artifacts
- artifacts/labs/math-vector-demo.json
- artifacts/labs/attention-demo.json
- artifacts/labs/chat-mechanics-demo.json
- Other lab artifacts can be regenerated from the app by running labs.

Non-Negotiables
- Keep the project local-first.
- No paid model API, cloud auth, hosted sync, required GPU, arbitrary command execution, or browser-triggered shell execution.
- Keep labs CPU-friendly and deterministic.
- App-triggered labs must stay allowlisted.
- Use TDD for new behavior.
- Verify before claiming completion.
- Keep curriculum content versioned in `content/`.
- Keep learner state local in SQLite and lab artifacts as local files.

Immediate Next Actions
1. Push `main` to origin if the user wants the completed work backed up remotely.
2. Optionally run the full verification gate again after any pull, rebase, or environment change.
3. Next product work should be optional polish or extension, not core phase completion:
   - Improve visual design density and responsive polish.
   - Add an artifact browser page.
   - Add optional Colab notebooks after the local path remains green.
   - Add Gemini-generated and validated educational SVGs for attention/chat traces.
   - Add larger optional training experiments without making them required.

If continuing implementation, start by checking:

git status --short --branch
git log --oneline -10

Then read README.md and docs/run.md before making changes.
```
