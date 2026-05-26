# Phase 3 Mini LLM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 3: a CPU-friendly mini LLM learning path with attention, masking, positional encoding, transformer block mechanics, tiny next-token training, generation samples, factuality examples, artifacts, and browser verification.

**Architecture:** Extend the existing content/API/lab/UI seams. Curriculum stays in `content/`, pure-Python mechanics stay in `labs/python/llm_from_scratch/`, FastAPI exposes allowlisted deterministic lab runs, SQLite records artifact history, and the React cockpit renders the transformer track through the same concept workspace with richer artifact previews.

**Tech Stack:** Python 3.13, pytest, FastAPI, SQLite, Vite, React, TypeScript, Vitest, React Testing Library, Playwright, plain Python math/list implementations, SVG/CSS educational visuals.

---

## Scope Boundary

This plan implements Phase 3 from `docs/superpowers/specs/2026-05-26-phase-3-mini-llm-design.md`.

Included:

- Transformer content and course docs.
- Attention, masked attention, positional encoding, transformer block, tiny dataset packing, tiny training, sampling, base-versus-assistant, and factuality demos.
- Deterministic JSON artifacts.
- Allowlisted Phase 3 API lab execution.
- Web artifact previews for attention/loss/sample outputs.
- Phase 3 e2e flow.

Deferred:

- Final chat playground.
- Token streaming.
- Tool-use verification.
- Saved local chat memory.
- Preference/RLHF simulations.
- Required GPU or Colab execution.

## File Structure

Create or modify these files:

```text
content/
  concepts/
    transformer.json
  lessons/
    transformer/
      attention-scores.md
      masked-self-attention.md
      positional-encoding.md
      transformer-block.md
      dataset-packing.md
      next-token-training.md
      sampling-generation.md
      base-vs-assistant.md
      factuality-failures.md
  glossary/
    core.json
labs/python/
  llm_from_scratch/
    data/
      __init__.py
      tiny_corpus.py
    generation/
      __init__.py
      sampling.py
    transformer/
      __init__.py
      attention.py
      block.py
      positional.py
    experiments/
      transformer_demo.py
      mini_training_demo.py
  tests/
    test_transformer_attention.py
    test_transformer_block.py
    test_tiny_corpus.py
    test_generation_sampling.py
    test_phase3_experiments.py
apps/api/
  learn_llm_api/
    lab_runner.py
  tests/
    test_lab_runner.py
apps/web/
  src/
    components/
      ArtifactPreview.tsx
      LabPanel.tsx
      VisualExperiment.tsx
    __tests__/
      ArtifactPreview.test.tsx
      App.test.tsx
      LabPanel.test.tsx
docs/course/
  index.md
  phase-3-mini-llm.md
  upcoming-phases.md
README.md
tests/e2e/
  phase3-mini-llm.spec.ts
```

---

## Task 1: Add Phase 3 Curriculum And Course Docs

**Files:**
- Create: `content/concepts/transformer.json`
- Create: `content/lessons/transformer/attention-scores.md`
- Create: `content/lessons/transformer/masked-self-attention.md`
- Create: `content/lessons/transformer/positional-encoding.md`
- Create: `content/lessons/transformer/transformer-block.md`
- Create: `content/lessons/transformer/dataset-packing.md`
- Create: `content/lessons/transformer/next-token-training.md`
- Create: `content/lessons/transformer/sampling-generation.md`
- Create: `content/lessons/transformer/base-vs-assistant.md`
- Create: `content/lessons/transformer/factuality-failures.md`
- Modify: `content/glossary/core.json`
- Create: `docs/course/phase-3-mini-llm.md`
- Modify: `docs/course/index.md`
- Modify: `docs/course/upcoming-phases.md`
- Modify: `README.md`
- Test: `apps/api/tests/test_content_loader.py`

- [x] **Step 1: Write failing content test**

Append this test to `apps/api/tests/test_content_loader.py`:

```python
def test_phase3_transformer_track_loads(repo_root: Path) -> None:
    tracks = load_tracks(repo_root)
    transformer = next(track for track in tracks if track["id"] == "transformer")

    assert transformer["title"] == "Transformer"
    assert [concept["id"] for concept in transformer["concepts"]] == [
        "attention-scores",
        "masked-self-attention",
        "positional-encoding",
        "transformer-block",
        "dataset-packing",
        "next-token-training",
        "sampling-generation",
        "base-vs-assistant",
        "factuality-failures",
    ]
    assert transformer["concepts"][0]["prerequisites"] == ["logits-softmax"]
    assert transformer["concepts"][0]["lab"] == "attention-demo"
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py::test_phase3_transformer_track_loads -q
```

Expected: fails because `content/concepts/transformer.json` does not exist.

- [x] **Step 3: Add curriculum files**

Create `content/concepts/transformer.json` with the nine concepts listed above. Use these lab ids:

```text
attention-demo
masked-attention-demo
positional-encoding-demo
transformer-block-demo
mini-training-demo
mini-training-demo
sampling-generation-demo
base-vs-assistant-demo
factuality-failure-demo
```

Create the nine lesson markdown files with short explanations, a "What to inspect" section, and a "Checkpoint" section.

- [x] **Step 4: Add glossary terms**

Extend `content/glossary/core.json` with entries for:

```text
attention
causal-mask
positional-encoding
transformer-block
context-window
next-token-prediction
sampling
temperature
top-k
base-model
assistant-model
hallucination
```

- [x] **Step 5: Add course docs**

Create `docs/course/phase-3-mini-llm.md` and update the README/course index so Phase 3 points to the new page with status `Available` after implementation.

- [x] **Step 6: Run focused tests**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py -q
```

Expected: all content loader tests pass.

- [x] **Step 7: Commit**

```bash
git add content docs README.md apps/api/tests/test_content_loader.py
git commit -m "docs: add phase three mini llm curriculum"
```

---

## Task 2: Implement Attention And Positional Mechanics

**Files:**
- Create: `labs/python/llm_from_scratch/transformer/__init__.py`
- Create: `labs/python/llm_from_scratch/transformer/attention.py`
- Create: `labs/python/llm_from_scratch/transformer/positional.py`
- Test: `labs/python/tests/test_transformer_attention.py`

- [x] **Step 1: Write failing tests**

Create `labs/python/tests/test_transformer_attention.py` with tests for:

- `dot_product_attention` returns scores, weights, and context vectors.
- `causal_mask` prevents a token from attending to future positions.
- `sinusoidal_positions` returns deterministic values for a tiny dimension.

- [x] **Step 2: Run tests to verify failure**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_transformer_attention.py -q
```

Expected: fails because `llm_from_scratch.transformer` modules do not exist.

- [x] **Step 3: Implement minimal mechanics**

Implement plain-Python helpers:

```python
dot(vector_a: list[float], vector_b: list[float]) -> float
softmax(values: list[float]) -> list[float]
causal_mask(size: int) -> list[list[int]]
apply_causal_mask(scores: list[list[float]]) -> list[list[float]]
dot_product_attention(queries, keys, values, causal=False) -> dict[str, Any]
sinusoidal_positions(length: int, dimensions: int) -> list[list[float]]
add_positions(token_vectors, positions) -> list[list[float]]
```

- [x] **Step 4: Run focused tests**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_transformer_attention.py -q
```

Expected: pass.

- [x] **Step 5: Commit**

```bash
git add labs/python/llm_from_scratch/transformer labs/python/tests/test_transformer_attention.py
git commit -m "feat: add transformer attention mechanics"
```

---

## Task 3: Implement Transformer Block And Tiny Dataset Packing

**Files:**
- Create: `labs/python/llm_from_scratch/transformer/block.py`
- Create: `labs/python/llm_from_scratch/data/__init__.py`
- Create: `labs/python/llm_from_scratch/data/tiny_corpus.py`
- Test: `labs/python/tests/test_transformer_block.py`
- Test: `labs/python/tests/test_tiny_corpus.py`

- [x] **Step 1: Write failing tests**

Create tests for:

- `transformer_block` returns attention output, feed-forward output, and final vectors.
- `build_vocabulary` creates deterministic character ids.
- `pack_next_token_examples` returns fixed-size input and target pairs.

- [x] **Step 2: Run tests to verify failure**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_transformer_block.py labs/python/tests/test_tiny_corpus.py -q
```

Expected: fails because modules do not exist.

- [x] **Step 3: Implement minimal mechanics**

Implement a tiny deterministic block using the attention helpers and a two-layer feed-forward helper. Implement character vocabulary and next-token packing with clear return shapes.

- [x] **Step 4: Run focused tests**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_transformer_block.py labs/python/tests/test_tiny_corpus.py -q
```

Expected: pass.

- [x] **Step 5: Commit**

```bash
git add labs/python/llm_from_scratch/transformer/block.py labs/python/llm_from_scratch/data labs/python/tests/test_transformer_block.py labs/python/tests/test_tiny_corpus.py
git commit -m "feat: add tiny transformer block and dataset packing"
```

---

## Task 4: Implement Tiny Training And Sampling Artifacts

**Files:**
- Create: `labs/python/llm_from_scratch/generation/__init__.py`
- Create: `labs/python/llm_from_scratch/generation/sampling.py`
- Create: `labs/python/llm_from_scratch/experiments/transformer_demo.py`
- Create: `labs/python/llm_from_scratch/experiments/mini_training_demo.py`
- Test: `labs/python/tests/test_generation_sampling.py`
- Test: `labs/python/tests/test_phase3_experiments.py`

- [ ] **Step 1: Write failing tests**

Create tests for:

- Greedy sampling returns the max-logit token.
- Top-k sampling restricts candidates.
- Tiny training demo loss decreases.
- Phase 3 artifacts include attention, mask, training, generation, comparison, and failure sections.

- [ ] **Step 2: Run tests to verify failure**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_generation_sampling.py labs/python/tests/test_phase3_experiments.py -q
```

Expected: fails because generation and experiment modules do not exist.

- [ ] **Step 3: Implement minimal mechanics**

Implement deterministic sampling and tiny training artifact builders. Keep the training loop small and CPU-friendly. The loss history must decrease across at least two steps for the fixed corpus.

- [ ] **Step 4: Run focused tests**

```bash
source .venv/bin/activate
pytest labs/python/tests/test_generation_sampling.py labs/python/tests/test_phase3_experiments.py -q
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add labs/python/llm_from_scratch/generation labs/python/llm_from_scratch/experiments/transformer_demo.py labs/python/llm_from_scratch/experiments/mini_training_demo.py labs/python/tests/test_generation_sampling.py labs/python/tests/test_phase3_experiments.py
git commit -m "feat: add tiny training and sampling artifacts"
```

---

## Task 5: Wire Phase 3 Labs Into API

**Files:**
- Modify: `apps/api/learn_llm_api/lab_runner.py`
- Modify: `apps/api/tests/test_lab_runner.py`

- [ ] **Step 1: Write failing API tests**

Add tests that `run_lab("attention-demo", tmp_path)` and `run_lab("mini-training-demo", tmp_path)` write artifacts with Phase 3 sections.

- [ ] **Step 2: Run tests to verify failure**

```bash
source .venv/bin/activate
pytest apps/api/tests/test_lab_runner.py -q
```

Expected: fails because Phase 3 lab ids are not allowlisted.

- [ ] **Step 3: Add lab runner allowlist entries**

Map each Phase 3 lab id to a deterministic artifact writer.

- [ ] **Step 4: Run focused API tests**

```bash
source .venv/bin/activate
pytest apps/api/tests/test_lab_runner.py -q
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/learn_llm_api/lab_runner.py apps/api/tests/test_lab_runner.py
git commit -m "feat: allow phase three lab runs"
```

---

## Task 6: Add Web Artifact Preview And Phase 3 Browser Flow

**Files:**
- Create: `apps/web/src/components/ArtifactPreview.tsx`
- Modify: `apps/web/src/components/LabPanel.tsx`
- Modify: `apps/web/src/components/VisualExperiment.tsx`
- Test: `apps/web/src/__tests__/ArtifactPreview.test.tsx`
- Test: `apps/web/src/__tests__/LabPanel.test.tsx`
- Test: `apps/web/src/__tests__/App.test.tsx`
- Create: `tests/e2e/phase3-mini-llm.spec.ts`

- [ ] **Step 1: Write failing web tests**

Add tests that the artifact preview renders generated text, loss values, and attention weights from a Phase 3 artifact shape.

- [ ] **Step 2: Run tests to verify failure**

```bash
npm run web:test
```

Expected: fails because `ArtifactPreview` does not exist or is not wired.

- [ ] **Step 3: Implement artifact preview**

Render compact previews for:

- Attention weights.
- Loss history.
- Generated sample text.
- Base versus assistant comparison.
- Factuality failure explanation.

- [ ] **Step 4: Add e2e test**

Create a browser test that opens `Attention Scores`, runs the lab, checks for an artifact path or preview, submits a low-confidence checkpoint, and sees `attention-scores - low-confidence`.

- [ ] **Step 5: Run focused web/e2e tests**

```bash
npm run web:test
source .venv/bin/activate
npm run e2e
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web tests/e2e/phase3-mini-llm.spec.ts
git commit -m "feat: show phase three lab artifacts in web app"
```

---

## Task 7: Final Verification And Documentation Cleanup

**Files:**
- Modify if needed: `README.md`
- Modify if needed: `docs/run.md`
- Modify: `docs/superpowers/plans/2026-05-26-phase-3-mini-llm.md`

- [ ] **Step 1: Mark completed plan tasks**

Update this plan's checkboxes for tasks completed in the implementation.

- [ ] **Step 2: Run full verification**

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit final docs if changed**

```bash
git add README.md docs/run.md docs/superpowers/plans/2026-05-26-phase-3-mini-llm.md
git commit -m "docs: record phase three verification"
```

## Final Report

Report:

- Branch name and commit range.
- Phase 3 capabilities completed.
- Verification commands and results.
- Local run commands and URL.
- Artifact paths produced.
- Known limitations deferred to Phase 4.
