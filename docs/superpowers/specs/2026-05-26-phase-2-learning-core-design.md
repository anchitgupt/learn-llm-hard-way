# Phase 2 Learning Core Design

Date: 2026-05-26

Base design: `docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md`

## Goal

Build the next local-first learning slice after Phase 1: a real learning cockpit that lets the learner move through concepts, answer checkpoints, track confidence, recover missed topics, browse glossary terms, and run the first safe tiny math/neural-net demos.

This phase exists to make the project usable as a long-running learning system. The learner should be able to leave, return in another study session, and see what they completed, what confused them, which prerequisites matter, and which tiny lab artifacts were produced.

## Approved Direction

Use the **Learning Core** approach.

This means Phase 2 prioritizes:

- Concept map and prerequisite visibility.
- Checkpoint attempts and confidence tracking.
- Missed-topic queue generated from learner state.
- Glossary index linked from curriculum concepts.
- Safe app-triggered tiny demos with deterministic outputs.
- Math for Models and early Neural Net content.

Phase 2 deliberately does not jump directly into attention, transformer blocks, or chat. Those depend on a stronger recovery model and early model-building foundations.

## Base Branch Assumption

Phase 2 implementation should start from the verified Phase 1 foundation work. If Phase 1 has not been merged into `main`, the Phase 2 worktree should branch from `phase-1-foundation` or from `main` after merging Phase 1.

The current Phase 1 foundation provides:

- Monorepo scripts.
- Python lab package.
- FastAPI content/progress API.
- SQLite-backed progress storage.
- React learning shell.
- Data and Tokens curriculum.
- Tokenization labs and demo artifact.
- Browser e2e path for opening a lesson and saving progress.

## Scope

### Included

1. Dashboard improvements
   - Current mission summary.
   - Missed-topic queue.
   - Recent lab artifacts.
   - Quick links into tracks and glossary.

2. Concept map
   - Visual graph of concepts and prerequisites.
   - Completion, low-confidence, skipped-lab, and revisit states.
   - Initial graph can be two tracks deep: Data and Tokens, Math for Models, and Early Neural Nets.

3. Concept workspace tabs
   - Lesson.
   - Visual.
   - Lab.
   - Checkpoint.
   - Notes.

4. Checkpoint flow
   - Learner can submit an answer.
   - App compares against deterministic expected answer keywords or exact options for Phase 2.
   - Stores attempt, correctness, confidence, and note.
   - Wrong or low-confidence answers add the concept to the missed-topic queue.

5. Notes and confidence tracking
   - Confidence is a 1-5 scale.
   - Notes remain local in SQLite.
   - Revisit state is explicit and can also be inferred from low confidence or failed checkpoint.

6. Missed-topic queue
   - Populated by low confidence, failed checkpoint attempts, skipped labs, or manual revisit marking.
   - Shows reason, concept, track, last updated time, and next recommended action.

7. Glossary
   - Versioned glossary entries live in repo content.
   - Concepts link to glossary terms.
   - The app exposes a glossary panel or screen with definitions and related concepts.

8. Safe app-triggered tiny demos
   - API exposes allowlisted demo runs only.
   - Demos are deterministic, CPU-only, fast, and write small JSON artifacts.
   - Phase 2 demos should cover vector dot product, logits/softmax, scalar gradient, and tiny linear-model loss.

9. Math for Models and Early Neural Nets content
   - Add structured lessons, labs, glossary, checkpoints, and visuals for:
     - Vectors.
     - Dot products.
     - Similarity.
     - Logits.
     - Softmax intuition.
     - Scalar gradients.
     - Tiny linear model.
     - Loss and one-step optimization.

### Deferred

- Attention labs.
- Transformer block implementation.
- Tiny dataset training loop for a language model.
- Chat playground.
- Prompt/message formatting trace.
- Token streaming trace.
- Tool-use verification demos.
- Preference/RLHF simulations.
- Required GPU or Colab execution.
- Full artifact browser beyond the first recent-artifact panel.

## UX Design

### Dashboard

The dashboard should become the learner's return point.

It should show:

- Current mission: the next recommended concept.
- Progress snapshot: completed count, revisit count, low-confidence count.
- Missed-topic queue: concepts needing attention and why.
- Recent artifacts: latest deterministic demo outputs.
- Quick navigation: track list and glossary.

The dashboard should not feel like a marketing page. It should be dense, calm, and useful for repeated study sessions.

### Concept Map

The concept map should show the learning structure, not just decoration.

Nodes represent concepts. Edges represent prerequisites. Node state should show:

- Available.
- Completed.
- In progress.
- Confusing.
- Revisit.
- Locked by prerequisites.

Initial implementation should use a compact React Flow graph. If a full graph grows too dense, the graph should stay compact and the selected concept details should show the prerequisite chain.

### Concept Workspace

The workspace should become tabbed because Phase 2 concepts have more learning surfaces than Phase 1.

Tabs:

- `Lesson`: rendered markdown with glossary links.
- `Visual`: concept-specific visual experiment.
- `Lab`: deterministic tiny demo runner and artifact preview.
- `Checkpoint`: answer input, feedback, expected concept explanation, confidence selector.
- `Notes`: local notes, revisit toggle, confidence.

Tab state should not hide saved progress. If the learner leaves and returns, the saved note, confidence, checkpoint attempt, and revisit state should rehydrate from the API.

### Missed-Topic Queue

The missed-topic queue should answer: "What should I revisit and why?"

Each item should show:

- Concept title.
- Track.
- Reason: low confidence, wrong checkpoint, skipped lab, or manual revisit.
- Last updated time.
- Recommended action: read lesson, rerun lab, answer checkpoint, or review prerequisite.

The queue should link directly to the relevant concept tab.

### Glossary

Glossary terms should be content, not hardcoded UI text.

Each entry should include:

- Term id.
- Display term.
- Short definition.
- Longer explanation.
- Related concept ids.

Concept lessons should show an explicit glossary list beside the rendered lesson content. Phase 2 should not add automatic markdown term replacement because explicit concept metadata is easier to test and maintain.

## Data Model

Phase 2 should keep the split between versioned content and local personal state.

### Versioned Content

Content JSON should support:

- Tracks.
- Concepts.
- Prerequisites.
- Lesson markdown path.
- Lab id.
- Visual id.
- Checkpoint definition.
- Glossary term ids.

Add content for:

- `math-for-models`
- `early-neural-nets`

Add glossary content as JSON:

- `content/glossary/core.json`

### Local SQLite State

SQLite should add or evolve tables for:

- Concept progress.
- Notes.
- Checkpoint attempts.
- Lab run history.
- Artifact index.

The schema should be explicit in Python code. Migrations can remain simple setup/alter functions in Phase 2 as long as they are deterministic and tested.

Checkpoint attempts should store:

- Concept id.
- Submitted answer.
- Correctness.
- Feedback.
- Confidence.
- Created timestamp.

Lab run history should store:

- Lab id.
- Concept id.
- Artifact path.
- Status.
- Created timestamp.

## API Design

The API should expose:

- `GET /api/tracks`
- `GET /api/glossary`
- `GET /api/progress`
- `PUT /api/progress/{concept_id}`
- `POST /api/checkpoints/{concept_id}/attempts`
- `GET /api/revisit`
- `POST /api/labs/{lab_id}/runs`
- `GET /api/artifacts/recent`

The lab-run endpoint must be allowlisted. It should reject unknown lab ids and should not execute arbitrary command text from the web app.

## Python Lab Design

Add focused Python modules under `labs/python/llm_from_scratch/`:

- `math/vectors.py`
- `math/probability.py`
- `nn/scalar_grad.py`
- `nn/tiny_linear.py`
- `experiments/math_demo.py`
- `experiments/nn_demo.py`

The labs should be deliberately small:

- No PyTorch dependency in Phase 2.
- Use Python standard library and small pure-Python functions.
- Produce deterministic JSON artifacts.
- Include tests that prove the math, not just the file output.

Example artifacts:

- Dot product and cosine-like similarity values.
- Logits and softmax probabilities.
- Scalar derivative demonstration.
- Tiny linear model prediction, loss before update, gradient, loss after update.

## Visual Experiment Design

Phase 2 visuals should explain mechanics.

Initial visuals:

- Vector similarity: two vectors, dot product contribution bars, final score.
- Logits to softmax: raw scores becoming probabilities.
- Gradient step: point moving downhill on a simple loss curve.
- Tiny linear model: prediction line shifts after one update.

Use code-native React/SVG/D3 for data-driven visuals. Use Gemini-generated SVG only for static/animated educational drafts that can be validated before use.

## Error Handling

The web app should handle:

- API unavailable: show a useful local-run message.
- Unknown concept: return to dashboard or first available concept.
- Unknown lab id: API returns a 404-style error.
- Lab run failure: store failed status and show the error without breaking the workspace.
- Checkpoint submit failure: preserve the typed answer and show retry affordance.

## Testing Strategy

Python:

- Unit tests for vector math, softmax, scalar gradients, and tiny linear update.
- Experiment tests that validate artifact shape and deterministic values.

API:

- Content loader tests for multi-track curriculum and glossary.
- Progress store tests for notes, confidence, checkpoint attempts, missed-topic query, and lab run history.
- Endpoint tests for glossary, checkpoint attempt, lab run, recent artifacts, and revisit queue.

Web:

- API client tests for new endpoints.
- Component tests for dashboard queue, concept tabs, checkpoint submission, glossary display, and lab-run panel.
- Accessibility checks through Testing Library roles and labels.

E2E:

- Start app.
- Open dashboard.
- Select a Math for Models concept from the concept map or track list.
- Run a tiny lab.
- Inspect the artifact preview.
- Submit a checkpoint answer with low confidence.
- Confirm the concept appears in the missed-topic queue.
- Navigate back from the queue to the concept.

## Success Criteria

Phase 2 is complete when:

- The learner can see multiple tracks and prerequisites.
- The learner can save confidence and notes per concept.
- The learner can answer a checkpoint and see stored feedback.
- Wrong or low-confidence work appears in the missed-topic queue.
- The learner can open the glossary and connect terms to concepts.
- The learner can run at least one deterministic math demo and one deterministic neural-net demo from the app.
- Demo artifacts are stored locally and visible in the dashboard or concept workspace.
- Tests pass for Python labs, API, web components, build, and e2e flow.

## Implementation Constraints

- Keep all data local by default.
- Keep early labs CPU-only and fast.
- Do not add cloud auth, hosted sync, paid model APIs, or GPU requirements.
- Do not execute arbitrary commands from the web app.
- Keep implementation incremental and test-driven.
- Prefer small focused modules over large catch-all files.
