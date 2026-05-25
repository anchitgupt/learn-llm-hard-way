# Phase 2 Learning Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 2 Learning Core: concept map, glossary, checkpoint attempts, confidence/revisit recovery, safe tiny lab demos, math/neural-net content, and a browser-verified missed-topic workflow.

**Architecture:** Extend the Phase 1 seams instead of replacing them. Versioned curriculum stays under `content/`, deterministic lab mechanics stay in `labs/python/llm_from_scratch/`, FastAPI exposes safe local endpoints, SQLite stores personal progress and artifacts, and the React app presents a dense learning cockpit with dashboard, concept map, workspace tabs, glossary, checkpoint, lab, and missed-topic views.

**Tech Stack:** Python 3.13 in `.venv`, FastAPI, pytest, SQLite, Vite, React, TypeScript, Vitest, React Testing Library, Playwright, React Flow, D3/SVG, pure-Python math and neural-net labs.

---

## Scope Boundary

This plan implements only Phase 2 from `docs/superpowers/specs/2026-05-26-phase-2-learning-core-design.md`.

It includes:

- Math for Models and Early Neural Nets curriculum.
- Glossary content and endpoint.
- Concept map data and UI.
- Concept workspace tabs.
- Checkpoint attempts with deterministic feedback.
- Confidence and missed-topic recovery.
- Safe allowlisted tiny lab runs.
- Recent artifact visibility.
- A Phase 2 e2e flow.

It does not implement attention, transformer blocks, chat playground, token streaming, tool-use verification, preference/RLHF simulations, required GPU, or Colab execution.

## Base Branch

Start from the verified Phase 1 work. If `phase-1-foundation` has not been merged, create the Phase 2 worktree from `phase-1-foundation`.

Expected existing branch tip before Phase 2 planning:

```bash
git log --oneline --max-count=3
```

Expected to include:

```text
fad9a91 docs: add phase two learning core design
0a0b591 web: render lessons as markdown
4dd8f04 test: add phase one learning path e2e
```

## File Structure

Create or modify these files:

```text
content/
  concepts/
    data-and-tokens.json
    math-for-models.json
    early-neural-nets.json
  glossary/
    core.json
  lessons/
    math-for-models/
      vectors.md
      dot-products.md
      logits-softmax.md
    early-neural-nets/
      scalar-gradients.md
      tiny-linear-model.md
labs/
  python/
    llm_from_scratch/
      math/
        __init__.py
        vectors.py
        probability.py
      nn/
        __init__.py
        scalar_grad.py
        tiny_linear.py
      experiments/
        math_demo.py
        nn_demo.py
    tests/
      test_math_vectors.py
      test_math_probability.py
      test_nn_scalar_grad.py
      test_nn_tiny_linear.py
      test_phase2_experiments.py
apps/
  api/
    learn_llm_api/
      app.py
      content_loader.py
      lab_runner.py
      progress_store.py
    tests/
      test_app.py
      test_content_loader.py
      test_lab_runner.py
      test_progress_store.py
apps/
  web/
    src/
      App.tsx
      api.ts
      types.ts
      components/
        CheckpointPanel.tsx
        ConceptMap.tsx
        ConceptWorkspace.tsx
        Dashboard.tsx
        GlossaryPanel.tsx
        LabPanel.tsx
        ProgressPanel.tsx
        VisualExperiment.tsx
      __tests__/
        App.test.tsx
        CheckpointPanel.test.tsx
        ConceptMap.test.tsx
        Dashboard.test.tsx
        GlossaryPanel.test.tsx
        LabPanel.test.tsx
        api.test.ts
      styles.css
tests/
  e2e/
    phase1-learning-path.spec.ts
    phase2-learning-core.spec.ts
```

---

## Task 1: Add Phase 2 Curriculum And Glossary Content

**Files:**
- Create: `content/concepts/math-for-models.json`
- Create: `content/concepts/early-neural-nets.json`
- Create: `content/glossary/core.json`
- Create: `content/lessons/math-for-models/vectors.md`
- Create: `content/lessons/math-for-models/dot-products.md`
- Create: `content/lessons/math-for-models/logits-softmax.md`
- Create: `content/lessons/early-neural-nets/scalar-gradients.md`
- Create: `content/lessons/early-neural-nets/tiny-linear-model.md`
- Modify: `apps/api/learn_llm_api/content_loader.py`
- Modify: `apps/api/tests/test_content_loader.py`

- [x] **Step 1: Write failing content loader tests**

Add `import json` to `apps/api/tests/test_content_loader.py`, then append these tests:

```python
from learn_llm_api.content_loader import load_glossary


def test_load_tracks_allows_cross_track_prerequisites(tmp_path: Path) -> None:
    root = tmp_path
    (root / "content" / "concepts").mkdir(parents=True)
    (root / "content" / "lessons" / "a").mkdir(parents=True)
    (root / "content" / "lessons" / "b").mkdir(parents=True)
    (root / "content" / "lessons" / "a" / "intro.md").write_text("# Intro\n", encoding="utf-8")
    (root / "content" / "lessons" / "b" / "next.md").write_text("# Next\n", encoding="utf-8")
    (root / "content" / "concepts" / "a.json").write_text(
        json.dumps(
            {
                "track": {"id": "a", "title": "A", "summary": "A", "order": 1},
                "concepts": [
                    {
                        "id": "intro",
                        "title": "Intro",
                        "order": 1,
                        "prerequisites": [],
                        "lessonPath": "content/lessons/a/intro.md",
                        "lab": None,
                        "visual": None,
                        "checkpoint": {"question": "q", "answer": "a"},
                        "glossary": ["vector"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (root / "content" / "concepts" / "b.json").write_text(
        json.dumps(
            {
                "track": {"id": "b", "title": "B", "summary": "B", "order": 2},
                "concepts": [
                    {
                        "id": "next",
                        "title": "Next",
                        "order": 1,
                        "prerequisites": ["intro"],
                        "lessonPath": "content/lessons/b/next.md",
                        "lab": None,
                        "visual": None,
                        "checkpoint": {"question": "q", "answer": "a"},
                        "glossary": ["dot-product"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    tracks = load_tracks(root)

    assert [track["id"] for track in tracks] == ["a", "b"]
    assert tracks[1]["concepts"][0]["prerequisites"] == ["intro"]


def test_load_glossary_returns_sorted_entries(tmp_path: Path) -> None:
    root = tmp_path
    (root / "content" / "glossary").mkdir(parents=True)
    (root / "content" / "glossary" / "core.json").write_text(
        json.dumps(
            {
                "entries": [
                    {
                        "id": "softmax",
                        "term": "Softmax",
                        "shortDefinition": "Turns logits into probabilities.",
                        "explanation": "Exponentiates and normalizes scores.",
                        "relatedConcepts": ["logits-softmax"],
                    },
                    {
                        "id": "vector",
                        "term": "Vector",
                        "shortDefinition": "A list of numbers.",
                        "explanation": "A vector represents features or activations.",
                        "relatedConcepts": ["vectors"],
                    },
                ]
            }
        ),
        encoding="utf-8",
    )

    glossary = load_glossary(root)

    assert [entry["id"] for entry in glossary] == ["softmax", "vector"]
```

- [x] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py -q
```

Expected: fails because `load_glossary` does not exist and cross-track prerequisites are still validated per-file.

- [x] **Step 3: Implement content loader support**

Modify `apps/api/learn_llm_api/content_loader.py` so it first collects all concept ids, then validates prerequisites against the global set. Add `load_glossary`.

Core implementation:

```python
def _read_track_file(metadata_path: Path) -> dict[str, Any]:
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def load_tracks(repo_root: Path) -> list[dict[str, Any]]:
    content_dir = repo_root / "content" / "concepts"
    raw_tracks = [_read_track_file(path) for path in sorted(content_dir.glob("*.json"))]
    all_concept_ids = {
        concept["id"]
        for raw in raw_tracks
        for concept in raw["concepts"]
    }
    tracks: list[dict[str, Any]] = []

    for raw in raw_tracks:
        track = dict(raw["track"])
        concepts = sorted(raw["concepts"], key=lambda concept: concept["order"])
        hydrated_concepts: list[dict[str, Any]] = []
        for concept in concepts:
            for prerequisite in concept["prerequisites"]:
                if prerequisite not in all_concept_ids:
                    raise ValueError(f"Unknown prerequisite {prerequisite} for concept {concept['id']}")
            lesson_path = repo_root / concept["lessonPath"]
            if not lesson_path.exists():
                raise FileNotFoundError(f"Missing lesson file: {concept['lessonPath']}")
            hydrated = dict(concept)
            hydrated["lessonMarkdown"] = lesson_path.read_text(encoding="utf-8")
            hydrated_concepts.append(hydrated)
        track["concepts"] = hydrated_concepts
        tracks.append(track)

    return sorted(tracks, key=lambda track: track["order"])


def load_glossary(repo_root: Path) -> list[dict[str, Any]]:
    glossary_dir = repo_root / "content" / "glossary"
    entries: list[dict[str, Any]] = []
    for glossary_path in sorted(glossary_dir.glob("*.json")):
        raw = json.loads(glossary_path.read_text(encoding="utf-8"))
        entries.extend(dict(entry) for entry in raw["entries"])
    return sorted(entries, key=lambda entry: entry["term"].lower())
```

- [x] **Step 4: Add Phase 2 content files**

Replace the first assertions in the existing `test_load_tracks_reads_concepts_and_lessons` test in `apps/api/tests/test_content_loader.py` so it expects all Phase 2 tracks:

```python
assert len(tracks) == 3
assert [track["id"] for track in tracks] == [
    "data-and-tokens",
    "math-for-models",
    "early-neural-nets",
]
track = tracks[0]
assert track["id"] == "data-and-tokens"
assert track["title"] == "Data and Tokens"
```

Create `content/glossary/core.json`:

```json
{
  "entries": [
    {
      "id": "vector",
      "term": "Vector",
      "shortDefinition": "An ordered list of numbers.",
      "explanation": "A vector is a compact way to represent features, token embeddings, activations, or directions in a learned space.",
      "relatedConcepts": ["vectors", "dot-products"]
    },
    {
      "id": "dot-product",
      "term": "Dot Product",
      "shortDefinition": "A sum of element-by-element products.",
      "explanation": "Dot products measure aligned contribution between two same-length vectors and appear throughout attention and similarity calculations.",
      "relatedConcepts": ["dot-products"]
    },
    {
      "id": "logit",
      "term": "Logit",
      "shortDefinition": "A raw model score before probability normalization.",
      "explanation": "A language model produces logits for candidate next tokens. Sampling rules convert those raw scores into token choices.",
      "relatedConcepts": ["logits-softmax"]
    },
    {
      "id": "softmax",
      "term": "Softmax",
      "shortDefinition": "A function that turns logits into probabilities.",
      "explanation": "Softmax exponentiates scores and normalizes them so the outputs are positive and sum to one.",
      "relatedConcepts": ["logits-softmax"]
    },
    {
      "id": "gradient",
      "term": "Gradient",
      "shortDefinition": "A direction and size for changing a value to reduce loss.",
      "explanation": "Gradients tell training code how a small parameter change affects the loss.",
      "relatedConcepts": ["scalar-gradients", "tiny-linear-model"]
    },
    {
      "id": "loss",
      "term": "Loss",
      "shortDefinition": "A number measuring how wrong a prediction is.",
      "explanation": "Training updates parameters to reduce loss on examples.",
      "relatedConcepts": ["tiny-linear-model"]
    }
  ]
}
```

Create `content/concepts/math-for-models.json` with three concepts:

```json
{
  "track": {
    "id": "math-for-models",
    "title": "Math for Models",
    "summary": "Learn the small pieces of math that become embeddings, logits, probabilities, and training signals.",
    "order": 2
  },
  "concepts": [
    {
      "id": "vectors",
      "title": "Vectors",
      "order": 1,
      "prerequisites": ["byte-pair-encoding"],
      "lessonPath": "content/lessons/math-for-models/vectors.md",
      "lab": "math-vector-demo",
      "visual": "vector-similarity",
      "checkpoint": {
        "question": "What does a vector represent in the simplest model-building sense?",
        "answer": "A vector is an ordered list of numbers used to represent features, embeddings, or activations.",
        "acceptedKeywords": ["ordered", "numbers", "represent"]
      },
      "glossary": ["vector"],
      "status": "available"
    },
    {
      "id": "dot-products",
      "title": "Dot Products",
      "order": 2,
      "prerequisites": ["vectors"],
      "lessonPath": "content/lessons/math-for-models/dot-products.md",
      "lab": "math-vector-demo",
      "visual": "vector-similarity",
      "checkpoint": {
        "question": "Why do dot products appear in similarity and attention calculations?",
        "answer": "They add element-by-element aligned contributions between two vectors into one score.",
        "acceptedKeywords": ["element", "contribution", "score"]
      },
      "glossary": ["vector", "dot-product"],
      "status": "available"
    },
    {
      "id": "logits-softmax",
      "title": "Logits and Softmax",
      "order": 3,
      "prerequisites": ["dot-products"],
      "lessonPath": "content/lessons/math-for-models/logits-softmax.md",
      "lab": "math-softmax-demo",
      "visual": "softmax-bars",
      "checkpoint": {
        "question": "What changes when logits pass through softmax?",
        "answer": "Raw scores become positive probabilities that sum to one.",
        "acceptedKeywords": ["probabilities", "sum", "one"]
      },
      "glossary": ["logit", "softmax"],
      "status": "available"
    }
  ]
}
```

Create `content/concepts/early-neural-nets.json` with two concepts:

```json
{
  "track": {
    "id": "early-neural-nets",
    "title": "Early Neural Nets",
    "summary": "Build the first training intuition with scalar gradients and a tiny linear model.",
    "order": 3
  },
  "concepts": [
    {
      "id": "scalar-gradients",
      "title": "Scalar Gradients",
      "order": 1,
      "prerequisites": ["logits-softmax"],
      "lessonPath": "content/lessons/early-neural-nets/scalar-gradients.md",
      "lab": "nn-gradient-demo",
      "visual": "gradient-step",
      "checkpoint": {
        "question": "What does a scalar gradient tell us during training?",
        "answer": "It tells how changing one value changes the loss and which direction reduces it.",
        "acceptedKeywords": ["change", "loss", "direction"]
      },
      "glossary": ["gradient", "loss"],
      "status": "available"
    },
    {
      "id": "tiny-linear-model",
      "title": "Tiny Linear Model",
      "order": 2,
      "prerequisites": ["scalar-gradients"],
      "lessonPath": "content/lessons/early-neural-nets/tiny-linear-model.md",
      "lab": "nn-tiny-linear-demo",
      "visual": "linear-loss-step",
      "checkpoint": {
        "question": "Why does one optimization step change the model's prediction?",
        "answer": "The step uses gradients to move parameters in the direction that lowers loss.",
        "acceptedKeywords": ["gradients", "parameters", "loss"]
      },
      "glossary": ["gradient", "loss"],
      "status": "available"
    }
  ]
}
```

Create each lesson markdown with concise content matching its concept. Every lesson must include an H1 matching the concept title and one `## What To Notice` section. Use this exact pattern for `vectors.md` and mirror it for the other lessons:

```markdown
# Vectors

An LLM cannot directly train on words as human-visible objects. It needs numbers.
A vector is the smallest useful idea here: an ordered list of numbers.

In future transformer lessons, vectors will represent token embeddings, hidden activations,
queries, keys, values, and logits. For now, treat a vector as a position or direction made
from numbers.

## What To Notice

- The order of values matters.
- Two vectors can be compared only when their dimensions line up.
- Vector operations produce the scores used by attention and token probabilities.
```

- [x] **Step 5: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py -q
python -m json.tool content/concepts/math-for-models.json >/dev/null
python -m json.tool content/concepts/early-neural-nets.json >/dev/null
python -m json.tool content/glossary/core.json >/dev/null
```

Expected: all commands exit 0.

- [x] **Step 6: Commit**

```bash
git add content apps/api/learn_llm_api/content_loader.py apps/api/tests/test_content_loader.py
git commit -m "content: add phase two learning core curriculum"
```

---

## Task 2: Add Pure-Python Math Labs

**Files:**
- Create: `labs/python/llm_from_scratch/math/__init__.py`
- Create: `labs/python/llm_from_scratch/math/vectors.py`
- Create: `labs/python/llm_from_scratch/math/probability.py`
- Create: `labs/python/tests/test_math_vectors.py`
- Create: `labs/python/tests/test_math_probability.py`

- [x] **Step 1: Write failing vector tests**

Create `labs/python/tests/test_math_vectors.py`:

```python
from __future__ import annotations

import pytest

from llm_from_scratch.math.vectors import dot_product, vector_norm, cosine_similarity


def test_dot_product_sums_aligned_contributions() -> None:
    assert dot_product([1, 2, 3], [4, 5, 6]) == 32


def test_vector_norm_uses_sum_of_squares() -> None:
    assert vector_norm([3, 4]) == 5


def test_cosine_similarity_compares_direction() -> None:
    assert cosine_similarity([1, 0], [0, 1]) == 0
    assert cosine_similarity([2, 0], [10, 0]) == 1


def test_dot_product_rejects_mismatched_lengths() -> None:
    with pytest.raises(ValueError, match="same length"):
        dot_product([1, 2], [1])
```

- [x] **Step 2: Run vector tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_math_vectors.py -q
```

Expected: fails because `llm_from_scratch.math.vectors` does not exist.

- [x] **Step 3: Implement vector functions**

Create `labs/python/llm_from_scratch/math/__init__.py`:

```python
"""Small math primitives used by the learning labs."""
```

Create `labs/python/llm_from_scratch/math/vectors.py`:

```python
from __future__ import annotations

import math
from collections.abc import Sequence


def _require_same_length(left: Sequence[float], right: Sequence[float]) -> None:
    if len(left) != len(right):
        raise ValueError("Vectors must have the same length")


def dot_product(left: Sequence[float], right: Sequence[float]) -> float:
    _require_same_length(left, right)
    return sum(left_value * right_value for left_value, right_value in zip(left, right))


def vector_norm(values: Sequence[float]) -> float:
    return math.sqrt(sum(value * value for value in values))


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    _require_same_length(left, right)
    left_norm = vector_norm(left)
    right_norm = vector_norm(right)
    if left_norm == 0 or right_norm == 0:
        raise ValueError("Cosine similarity requires non-zero vectors")
    return dot_product(left, right) / (left_norm * right_norm)
```

- [x] **Step 4: Run vector tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_math_vectors.py -q
```

Expected: `4 passed`.

- [x] **Step 5: Write failing probability tests**

Create `labs/python/tests/test_math_probability.py`:

```python
from __future__ import annotations

import pytest

from llm_from_scratch.math.probability import softmax


def test_softmax_outputs_probabilities_that_sum_to_one() -> None:
    probabilities = softmax([1.0, 2.0, 3.0])

    assert sum(probabilities) == pytest.approx(1.0)
    assert probabilities[2] > probabilities[1] > probabilities[0]


def test_softmax_is_stable_for_large_logits() -> None:
    probabilities = softmax([1000.0, 1001.0])

    assert sum(probabilities) == pytest.approx(1.0)
    assert probabilities[1] > probabilities[0]


def test_softmax_rejects_empty_logits() -> None:
    with pytest.raises(ValueError, match="at least one"):
        softmax([])
```

- [x] **Step 6: Run probability tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_math_probability.py -q
```

Expected: fails because `llm_from_scratch.math.probability` does not exist.

- [x] **Step 7: Implement softmax**

Create `labs/python/llm_from_scratch/math/probability.py`:

```python
from __future__ import annotations

import math
from collections.abc import Sequence


def softmax(logits: Sequence[float]) -> list[float]:
    if not logits:
        raise ValueError("Softmax requires at least one logit")
    max_logit = max(logits)
    exponentials = [math.exp(logit - max_logit) for logit in logits]
    denominator = sum(exponentials)
    return [value / denominator for value in exponentials]
```

- [x] **Step 8: Run math tests**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_math_vectors.py labs/python/tests/test_math_probability.py -q
```

Expected: `7 passed`.

- [x] **Step 9: Commit**

```bash
git add labs/python/llm_from_scratch/math labs/python/tests/test_math_vectors.py labs/python/tests/test_math_probability.py
git commit -m "labs: add math primitives"
```

---

## Task 3: Add Pure-Python Neural Net Labs

**Files:**
- Create: `labs/python/llm_from_scratch/nn/__init__.py`
- Create: `labs/python/llm_from_scratch/nn/scalar_grad.py`
- Create: `labs/python/llm_from_scratch/nn/tiny_linear.py`
- Create: `labs/python/tests/test_nn_scalar_grad.py`
- Create: `labs/python/tests/test_nn_tiny_linear.py`

- [x] **Step 1: Write failing scalar gradient tests**

Create `labs/python/tests/test_nn_scalar_grad.py`:

```python
from __future__ import annotations

import pytest

from llm_from_scratch.nn.scalar_grad import finite_difference_gradient, squared_error


def test_squared_error_measures_prediction_error() -> None:
    assert squared_error(prediction=3.0, target=5.0) == 4.0


def test_finite_difference_gradient_matches_square_derivative() -> None:
    gradient = finite_difference_gradient(lambda value: value * value, at=3.0)

    assert gradient == pytest.approx(6.0, rel=1e-3)
```

- [x] **Step 2: Run scalar gradient tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_nn_scalar_grad.py -q
```

Expected: fails because `llm_from_scratch.nn.scalar_grad` does not exist.

- [x] **Step 3: Implement scalar gradient helpers**

Create `labs/python/llm_from_scratch/nn/__init__.py`:

```python
"""Tiny neural-network learning primitives."""
```

Create `labs/python/llm_from_scratch/nn/scalar_grad.py`:

```python
from __future__ import annotations

from collections.abc import Callable


def squared_error(prediction: float, target: float) -> float:
    error = prediction - target
    return error * error


def finite_difference_gradient(
    function: Callable[[float], float],
    at: float,
    epsilon: float = 1e-5,
) -> float:
    return (function(at + epsilon) - function(at - epsilon)) / (2 * epsilon)
```

- [x] **Step 4: Run scalar gradient tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_nn_scalar_grad.py -q
```

Expected: `2 passed`.

- [x] **Step 5: Write failing tiny linear tests**

Create `labs/python/tests/test_nn_tiny_linear.py`:

```python
from __future__ import annotations

from llm_from_scratch.nn.tiny_linear import LinearModel, one_step_update


def test_linear_model_predicts_weighted_input_plus_bias() -> None:
    model = LinearModel(weight=2.0, bias=1.0)

    assert model.predict(3.0) == 7.0


def test_one_step_update_reduces_loss_for_single_example() -> None:
    model = LinearModel(weight=0.0, bias=0.0)

    result = one_step_update(model, x=2.0, target=4.0, learning_rate=0.1)

    assert result.before_loss == 16.0
    assert result.after_loss < result.before_loss
    assert result.updated_model.weight > 0
```

- [x] **Step 6: Run tiny linear tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_nn_tiny_linear.py -q
```

Expected: fails because `llm_from_scratch.nn.tiny_linear` does not exist.

- [x] **Step 7: Implement tiny linear model**

Create `labs/python/llm_from_scratch/nn/tiny_linear.py`:

```python
from __future__ import annotations

from dataclasses import dataclass

from llm_from_scratch.nn.scalar_grad import squared_error


@dataclass(frozen=True)
class LinearModel:
    weight: float
    bias: float

    def predict(self, x: float) -> float:
        return self.weight * x + self.bias


@dataclass(frozen=True)
class UpdateResult:
    before_loss: float
    after_loss: float
    weight_gradient: float
    bias_gradient: float
    updated_model: LinearModel


def one_step_update(
    model: LinearModel,
    x: float,
    target: float,
    learning_rate: float,
) -> UpdateResult:
    prediction = model.predict(x)
    before_loss = squared_error(prediction, target)
    error = prediction - target
    weight_gradient = 2 * error * x
    bias_gradient = 2 * error
    updated_model = LinearModel(
        weight=model.weight - learning_rate * weight_gradient,
        bias=model.bias - learning_rate * bias_gradient,
    )
    after_loss = squared_error(updated_model.predict(x), target)
    return UpdateResult(
        before_loss=before_loss,
        after_loss=after_loss,
        weight_gradient=weight_gradient,
        bias_gradient=bias_gradient,
        updated_model=updated_model,
    )
```

- [x] **Step 8: Run neural-net tests**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_nn_scalar_grad.py labs/python/tests/test_nn_tiny_linear.py -q
```

Expected: `4 passed`.

- [x] **Step 9: Commit**

```bash
git add labs/python/llm_from_scratch/nn labs/python/tests/test_nn_scalar_grad.py labs/python/tests/test_nn_tiny_linear.py
git commit -m "labs: add tiny neural net primitives"
```

---

## Task 4: Add Phase 2 Experiment Artifacts

**Files:**
- Create: `labs/python/llm_from_scratch/experiments/math_demo.py`
- Create: `labs/python/llm_from_scratch/experiments/nn_demo.py`
- Create: `labs/python/tests/test_phase2_experiments.py`

- [x] **Step 1: Write failing experiment tests**

Create `labs/python/tests/test_phase2_experiments.py`:

```python
from __future__ import annotations

import json

from llm_from_scratch.experiments.math_demo import build_math_demo_artifact, write_math_demo_artifact
from llm_from_scratch.experiments.nn_demo import build_nn_demo_artifact, write_nn_demo_artifact


def test_math_demo_artifact_contains_vector_and_softmax_outputs(tmp_path) -> None:
    artifact = build_math_demo_artifact()

    assert artifact["labId"] == "math-vector-demo"
    assert artifact["dotProduct"] == 32
    assert round(sum(artifact["softmax"]["probabilities"]), 6) == 1.0

    path = write_math_demo_artifact(tmp_path)
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["labId"] == "math-vector-demo"


def test_nn_demo_artifact_contains_loss_reduction(tmp_path) -> None:
    artifact = build_nn_demo_artifact()

    assert artifact["labId"] == "nn-tiny-linear-demo"
    assert artifact["afterLoss"] < artifact["beforeLoss"]

    path = write_nn_demo_artifact(tmp_path)
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["afterLoss"] < written["beforeLoss"]
```

- [x] **Step 2: Run experiment tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_phase2_experiments.py -q
```

Expected: fails because `math_demo.py` and `nn_demo.py` do not exist.

- [x] **Step 3: Implement math demo artifact**

Create `labs/python/llm_from_scratch/experiments/math_demo.py`:

```python
from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.math.probability import softmax
from llm_from_scratch.math.vectors import cosine_similarity, dot_product


def build_math_demo_artifact() -> dict[str, object]:
    left = [1, 2, 3]
    right = [4, 5, 6]
    logits = [1.0, 2.0, 3.0]
    return {
        "labId": "math-vector-demo",
        "conceptIds": ["vectors", "dot-products", "logits-softmax"],
        "leftVector": left,
        "rightVector": right,
        "dotProduct": dot_product(left, right),
        "cosineSimilarity": cosine_similarity(left, right),
        "softmax": {
            "logits": logits,
            "probabilities": softmax(logits),
        },
    }


def write_math_demo_artifact(root: Path) -> Path:
    artifact = build_math_demo_artifact()
    output_path = root / "artifacts" / "labs" / "math-vector-demo.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
```

- [x] **Step 4: Implement neural-net demo artifact**

Create `labs/python/llm_from_scratch/experiments/nn_demo.py`:

```python
from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.nn.tiny_linear import LinearModel, one_step_update


def build_nn_demo_artifact() -> dict[str, object]:
    model = LinearModel(weight=0.0, bias=0.0)
    result = one_step_update(model, x=2.0, target=4.0, learning_rate=0.1)
    return {
        "labId": "nn-tiny-linear-demo",
        "conceptIds": ["scalar-gradients", "tiny-linear-model"],
        "input": 2.0,
        "target": 4.0,
        "beforeLoss": result.before_loss,
        "afterLoss": result.after_loss,
        "weightGradient": result.weight_gradient,
        "biasGradient": result.bias_gradient,
        "updatedWeight": result.updated_model.weight,
        "updatedBias": result.updated_model.bias,
    }


def write_nn_demo_artifact(root: Path) -> Path:
    artifact = build_nn_demo_artifact()
    output_path = root / "artifacts" / "labs" / "nn-tiny-linear-demo.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
```

- [x] **Step 5: Run experiment tests**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_phase2_experiments.py -q
```

Expected: `2 passed`.

- [x] **Step 6: Commit**

```bash
git add labs/python/llm_from_scratch/experiments/math_demo.py labs/python/llm_from_scratch/experiments/nn_demo.py labs/python/tests/test_phase2_experiments.py
git commit -m "labs: add phase two demo artifacts"
```

---

## Task 5: Extend SQLite Progress Store

**Files:**
- Modify: `apps/api/learn_llm_api/progress_store.py`
- Modify: `apps/api/tests/test_progress_store.py`

- [x] **Step 1: Write failing progress store tests**

Append these tests to `apps/api/tests/test_progress_store.py`:

```python
def test_records_checkpoint_attempts_and_missed_topics(tmp_path: Path) -> None:
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    attempt = store.record_checkpoint_attempt(
        concept_id="vectors",
        submitted_answer="numbers",
        correct=False,
        feedback="Mention ordered numbers.",
        confidence=2,
    )
    store.save_progress("vectors", status="confusing", confidence=2, note="Need practice", revisit=False)

    missed = store.list_missed_topics()

    assert attempt["conceptId"] == "vectors"
    assert missed[0]["conceptId"] == "vectors"
    assert missed[0]["reason"] in {"low-confidence", "failed-checkpoint"}


def test_records_lab_runs_and_recent_artifacts(tmp_path: Path) -> None:
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    run = store.record_lab_run(
        lab_id="math-vector-demo",
        concept_id="vectors",
        artifact_path="artifacts/labs/math-vector-demo.json",
        status="passed",
    )

    recent = store.list_recent_artifacts(limit=3)

    assert run["labId"] == "math-vector-demo"
    assert recent == [
        {
            "labId": "math-vector-demo",
            "conceptId": "vectors",
            "artifactPath": "artifacts/labs/math-vector-demo.json",
            "status": "passed",
            "error": "",
        }
    ]
```

- [x] **Step 2: Run progress store tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py -q
```

Expected: fails because checkpoint and lab-run methods do not exist.

- [x] **Step 3: Extend schema**

Modify `ProgressStore.initialize()` to create these tables in addition to `concept_progress`:

```python
connection.execute(
    """
    CREATE TABLE IF NOT EXISTS checkpoint_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL,
      submitted_answer TEXT NOT NULL,
      correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
      feedback TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """
)
connection.execute(
    """
    CREATE TABLE IF NOT EXISTS lab_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      artifact_path TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """
)
```

- [x] **Step 4: Add checkpoint and lab methods**

Add methods to `ProgressStore`:

```python
def record_checkpoint_attempt(
    self,
    concept_id: str,
    submitted_answer: str,
    correct: bool,
    feedback: str,
    confidence: int,
) -> dict[str, Any]:
    with sqlite3.connect(self.database_path) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            INSERT INTO checkpoint_attempts (concept_id, submitted_answer, correct, feedback, confidence)
            VALUES (?, ?, ?, ?, ?)
            RETURNING concept_id, submitted_answer, correct, feedback, confidence
            """,
            (concept_id, submitted_answer, int(correct), feedback, confidence),
        ).fetchone()
    return self._row_to_checkpoint_attempt(row)


def record_lab_run(
    self,
    lab_id: str,
    concept_id: str,
    artifact_path: str,
    status: str,
    error: str = "",
) -> dict[str, Any]:
    with sqlite3.connect(self.database_path) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            INSERT INTO lab_runs (lab_id, concept_id, artifact_path, status, error)
            VALUES (?, ?, ?, ?, ?)
            RETURNING lab_id, concept_id, artifact_path, status, error
            """,
            (lab_id, concept_id, artifact_path, status, error),
        ).fetchone()
    return self._row_to_lab_run(row)
```

Add query helpers:

```python
def list_missed_topics(self) -> list[dict[str, Any]]:
    with sqlite3.connect(self.database_path) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT concept_id, 'manual-revisit' AS reason, updated_at
            FROM concept_progress
            WHERE revisit = 1
            UNION ALL
            SELECT concept_id, 'low-confidence' AS reason, updated_at
            FROM concept_progress
            WHERE confidence <= 2
            UNION ALL
            SELECT concept_id, 'failed-checkpoint' AS reason, created_at AS updated_at
            FROM checkpoint_attempts
            WHERE correct = 0
            ORDER BY updated_at DESC, concept_id ASC
            """
        ).fetchall()
    seen: set[str] = set()
    missed: list[dict[str, Any]] = []
    for row in rows:
        if row["concept_id"] in seen:
            continue
        seen.add(row["concept_id"])
        missed.append({"conceptId": row["concept_id"], "reason": row["reason"]})
    return missed


def list_recent_artifacts(self, limit: int = 5) -> list[dict[str, Any]]:
    with sqlite3.connect(self.database_path) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT lab_id, concept_id, artifact_path, status, error
            FROM lab_runs
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [self._row_to_lab_run(row) for row in rows]
```

Add row mappers:

```python
@staticmethod
def _row_to_checkpoint_attempt(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "conceptId": row["concept_id"],
        "submittedAnswer": row["submitted_answer"],
        "correct": bool(row["correct"]),
        "feedback": row["feedback"],
        "confidence": row["confidence"],
    }


@staticmethod
def _row_to_lab_run(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "labId": row["lab_id"],
        "conceptId": row["concept_id"],
        "artifactPath": row["artifact_path"],
        "status": row["status"],
        "error": row["error"],
    }
```

- [x] **Step 5: Run progress store tests**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py -q
```

Expected: all progress store tests pass.

- [x] **Step 6: Commit**

```bash
git add apps/api/learn_llm_api/progress_store.py apps/api/tests/test_progress_store.py
git commit -m "api: extend local progress store"
```

---

## Task 6: Add Safe Lab Runner And API Endpoints

**Files:**
- Create: `apps/api/learn_llm_api/lab_runner.py`
- Create: `apps/api/tests/test_lab_runner.py`
- Modify: `apps/api/learn_llm_api/app.py`
- Modify: `apps/api/tests/test_app.py`

- [x] **Step 1: Write failing lab runner tests**

Create `apps/api/tests/test_lab_runner.py`:

```python
from __future__ import annotations

import json

import pytest

from learn_llm_api.lab_runner import run_lab


def test_run_lab_writes_allowlisted_math_artifact(tmp_path) -> None:
    result = run_lab("math-vector-demo", tmp_path)

    artifact_path = tmp_path / result["artifactPath"]
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert result["labId"] == "math-vector-demo"
    assert result["status"] == "passed"
    assert artifact["dotProduct"] == 32


def test_run_lab_rejects_unknown_lab(tmp_path) -> None:
    with pytest.raises(KeyError, match="Unknown lab"):
        run_lab("rm-rf-demo", tmp_path)
```

- [x] **Step 2: Run lab runner tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_lab_runner.py -q
```

Expected: fails because `learn_llm_api.lab_runner` does not exist.

- [x] **Step 3: Implement lab runner**

Create `apps/api/learn_llm_api/lab_runner.py`:

```python
from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from llm_from_scratch.experiments.math_demo import write_math_demo_artifact
from llm_from_scratch.experiments.nn_demo import write_nn_demo_artifact

LabWriter = Callable[[Path], Path]

LABS: dict[str, tuple[str, LabWriter]] = {
    "math-vector-demo": ("vectors", write_math_demo_artifact),
    "math-softmax-demo": ("logits-softmax", write_math_demo_artifact),
    "nn-gradient-demo": ("scalar-gradients", write_nn_demo_artifact),
    "nn-tiny-linear-demo": ("tiny-linear-model", write_nn_demo_artifact),
}


def run_lab(lab_id: str, repo_root: Path) -> dict[str, Any]:
    if lab_id not in LABS:
        raise KeyError(f"Unknown lab: {lab_id}")
    concept_id, writer = LABS[lab_id]
    artifact_path = writer(repo_root)
    return {
        "labId": lab_id,
        "conceptId": concept_id,
        "artifactPath": artifact_path.relative_to(repo_root).as_posix(),
        "status": "passed",
        "error": "",
    }
```

- [x] **Step 4: Add failing API endpoint tests**

Add these imports to `apps/api/tests/test_app.py`:

```python
import json
from pathlib import Path
```

Add this helper to `apps/api/tests/test_app.py`:

```python
def write_phase2_api_repo(root: Path) -> None:
    (root / "content" / "concepts").mkdir(parents=True)
    (root / "content" / "lessons" / "data-and-tokens").mkdir(parents=True)
    (root / "content" / "glossary").mkdir(parents=True)
    (root / "content" / "lessons" / "data-and-tokens" / "bytes-unicode.md").write_text("# Bytes and Unicode\n", encoding="utf-8")
    (root / "content" / "concepts" / "data-and-tokens.json").write_text(
        json.dumps(
            {
                "track": {"id": "data-and-tokens", "title": "Data and Tokens", "summary": "Tokens", "order": 1},
                "concepts": [
                    {
                        "id": "bytes-unicode",
                        "title": "Bytes and Unicode",
                        "order": 1,
                        "prerequisites": [],
                        "lessonPath": "content/lessons/data-and-tokens/bytes-unicode.md",
                        "lab": "math-vector-demo",
                        "visual": "token-flow-svg",
                        "checkpoint": {
                            "question": "What is a vector?",
                            "answer": "A vector is an ordered list of numbers.",
                            "acceptedKeywords": ["ordered", "numbers"],
                        },
                        "glossary": ["vector"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (root / "content" / "glossary" / "core.json").write_text(
        json.dumps(
            {
                "entries": [
                    {
                        "id": "vector",
                        "term": "Vector",
                        "shortDefinition": "A list of numbers.",
                        "explanation": "Used for embeddings.",
                        "relatedConcepts": ["bytes-unicode"],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
```

Append this test to `apps/api/tests/test_app.py`:

```python
def test_phase_two_endpoints_return_glossary_checkpoint_lab_and_artifacts(tmp_path: Path) -> None:
    write_phase2_api_repo(tmp_path)
    app = create_app(repo_root=tmp_path, database_path=tmp_path / "progress.sqlite")
    client = TestClient(app)

    glossary_response = client.get("/api/glossary")
    assert glossary_response.status_code == 200
    assert glossary_response.json()[0]["id"] == "vector"

    attempt_response = client.post(
        "/api/checkpoints/bytes-unicode/attempts",
        json={"submittedAnswer": "not sure", "confidence": 2},
    )
    assert attempt_response.status_code == 200
    assert attempt_response.json()["conceptId"] == "bytes-unicode"

    lab_response = client.post("/api/labs/math-vector-demo/runs")
    assert lab_response.status_code == 200
    assert lab_response.json()["status"] == "passed"

    artifacts_response = client.get("/api/artifacts/recent")
    assert artifacts_response.status_code == 200
    assert artifacts_response.json()[0]["labId"] == "math-vector-demo"

    revisit_response = client.get("/api/revisit")
    assert revisit_response.status_code == 200
    assert revisit_response.json()[0]["conceptId"] == "bytes-unicode"
```

- [x] **Step 5: Run API tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_lab_runner.py apps/api/tests/test_app.py -q
```

Expected: fails because endpoints are missing.

- [x] **Step 6: Add request models and checkpoint evaluation**

Modify `apps/api/learn_llm_api/app.py`:

```python
class CheckpointAttemptInput(BaseModel):
    submittedAnswer: str = Field(min_length=1)
    confidence: int = Field(ge=1, le=5)


def _find_concept(tracks: list[dict[str, Any]], concept_id: str) -> dict[str, Any]:
    for track in tracks:
        for concept in track["concepts"]:
            if concept["id"] == concept_id:
                return concept
    raise KeyError(concept_id)


def _evaluate_checkpoint(concept: dict[str, Any], submitted_answer: str) -> tuple[bool, str]:
    checkpoint = concept["checkpoint"]
    normalized = submitted_answer.lower()
    keywords = checkpoint.get("acceptedKeywords", [])
    if keywords:
        correct = all(keyword.lower() in normalized for keyword in keywords)
    else:
        correct = checkpoint["answer"].lower() in normalized
    feedback = "Checkpoint passed." if correct else checkpoint["answer"]
    return correct, feedback
```

- [x] **Step 7: Add API endpoints**

Inside `create_app`, add endpoints:

```python
    @app.get("/api/glossary")
    def glossary() -> list[dict[str, Any]]:
        return load_glossary(root)

    @app.get("/api/progress")
    def progress() -> list[dict[str, Any]]:
        return store.list_progress()

    @app.post("/api/checkpoints/{concept_id}/attempts")
    def submit_checkpoint(concept_id: str, payload: CheckpointAttemptInput) -> dict[str, Any]:
        concept = _find_concept(load_tracks(root), concept_id)
        correct, feedback = _evaluate_checkpoint(concept, payload.submittedAnswer)
        attempt = store.record_checkpoint_attempt(
            concept_id=concept_id,
            submitted_answer=payload.submittedAnswer,
            correct=correct,
            feedback=feedback,
            confidence=payload.confidence,
        )
        if not correct or payload.confidence <= 2:
            store.save_progress(
                concept_id=concept_id,
                status="confusing",
                confidence=payload.confidence,
                note="",
                revisit=True,
            )
        return attempt

    @app.post("/api/labs/{lab_id}/runs")
    def run_lab_endpoint(lab_id: str) -> dict[str, Any]:
        try:
            result = run_lab(lab_id, root)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        store.record_lab_run(
            lab_id=result["labId"],
            concept_id=result["conceptId"],
            artifact_path=result["artifactPath"],
            status=result["status"],
            error=result["error"],
        )
        return result

    @app.get("/api/artifacts/recent")
    def recent_artifacts() -> list[dict[str, Any]]:
        return store.list_recent_artifacts()
```

Change the existing `/api/revisit` endpoint so it returns missed topics:

```python
    @app.get("/api/revisit")
    def revisit() -> list[dict[str, Any]]:
        return store.list_missed_topics()
```

Also update imports:

```python
from fastapi import FastAPI, HTTPException
from learn_llm_api.content_loader import load_glossary, load_tracks
from learn_llm_api.lab_runner import run_lab
```

Add `list_progress()` to `ProgressStore` if the endpoint uses it:

```python
def list_progress(self) -> list[dict[str, Any]]:
    with sqlite3.connect(self.database_path) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT concept_id, status, confidence, note, revisit
            FROM concept_progress
            ORDER BY updated_at DESC, concept_id ASC
            """
        ).fetchall()
    return [self._row_to_progress(row) for row in rows]
```

- [x] **Step 8: Run API tests**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_lab_runner.py apps/api/tests/test_app.py apps/api/tests/test_progress_store.py -q
```

Expected: all selected API tests pass.

- [x] **Step 9: Commit**

```bash
git add apps/api/learn_llm_api apps/api/tests
git commit -m "api: add learning core endpoints"
```

---

## Task 7: Extend Web Types And API Client

**Files:**
- Modify: `apps/web/src/types.ts`
- Modify: `apps/web/src/api.ts`
- Modify: `apps/web/src/__tests__/api.test.ts`

- [x] **Step 1: Write failing web API client tests**

Append to `apps/web/src/__tests__/api.test.ts`:

```ts
import { fetchGlossary, fetchRecentArtifacts, runLab, submitCheckpoint } from "../api";

it("calls phase two learning core endpoints", async () => {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/api/glossary")) {
      return new Response(JSON.stringify([{ id: "vector", term: "Vector" }]));
    }
    if (url.endsWith("/api/checkpoints/vectors/attempts")) {
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify({ conceptId: "vectors", correct: false }));
    }
    if (url.endsWith("/api/labs/math-vector-demo/runs")) {
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify({ labId: "math-vector-demo", status: "passed" }));
    }
    if (url.endsWith("/api/artifacts/recent")) {
      return new Response(JSON.stringify([{ labId: "math-vector-demo" }]));
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(fetchGlossary()).resolves.toEqual([{ id: "vector", term: "Vector" }]);
  await expect(submitCheckpoint("vectors", { submittedAnswer: "numbers", confidence: 2 })).resolves.toMatchObject({ conceptId: "vectors" });
  await expect(runLab("math-vector-demo")).resolves.toMatchObject({ labId: "math-vector-demo" });
  await expect(fetchRecentArtifacts()).resolves.toEqual([{ labId: "math-vector-demo" }]);
});
```

- [x] **Step 2: Run API client tests to verify failure**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/api.test.ts
```

Expected: fails because the new API client functions do not exist.

- [x] **Step 3: Extend TypeScript types**

Modify `apps/web/src/types.ts`:

```ts
export interface GlossaryEntry {
  id: string;
  term: string;
  shortDefinition: string;
  explanation: string;
  relatedConcepts: string[];
}

export interface ProgressRecord {
  conceptId: string;
  status: string;
  confidence: number;
  note: string;
  revisit: boolean;
}

export interface CheckpointAttemptInput {
  submittedAnswer: string;
  confidence: number;
}

export interface CheckpointAttempt {
  conceptId: string;
  submittedAnswer: string;
  correct: boolean;
  feedback: string;
  confidence: number;
}

export interface LabRunArtifact {
  labId: string;
  conceptId: string;
  artifactPath: string;
  status: string;
  error: string;
}

export interface MissedTopic {
  conceptId: string;
  reason: string;
}
```

Also update `Checkpoint`:

```ts
export interface Checkpoint {
  question: string;
  answer: string;
  acceptedKeywords?: string[];
}
```

- [x] **Step 4: Add API client functions**

Modify `apps/web/src/api.ts`:

```ts
import type {
  CheckpointAttempt,
  CheckpointAttemptInput,
  GlossaryEntry,
  LabRunArtifact,
  MissedTopic,
  ProgressInput,
  ProgressRecord,
  Track
} from "./types";
```

Add functions:

```ts
export async function fetchGlossary(): Promise<GlossaryEntry[]> {
  return readJson<GlossaryEntry[]>(await fetch(`${API_BASE}/api/glossary`));
}

export async function fetchProgress(): Promise<ProgressRecord[]> {
  return readJson<ProgressRecord[]>(await fetch(`${API_BASE}/api/progress`));
}

export async function submitCheckpoint(
  conceptId: string,
  input: CheckpointAttemptInput
): Promise<CheckpointAttempt> {
  return readJson<CheckpointAttempt>(
    await fetch(`${API_BASE}/api/checkpoints/${conceptId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function runLab(labId: string): Promise<LabRunArtifact> {
  return readJson<LabRunArtifact>(
    await fetch(`${API_BASE}/api/labs/${labId}/runs`, {
      method: "POST"
    })
  );
}

export async function fetchRecentArtifacts(): Promise<LabRunArtifact[]> {
  return readJson<LabRunArtifact[]>(await fetch(`${API_BASE}/api/artifacts/recent`));
}

export async function fetchMissedTopics(): Promise<MissedTopic[]> {
  return readJson<MissedTopic[]>(await fetch(`${API_BASE}/api/revisit`));
}
```

- [x] **Step 5: Run API client tests**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/api.test.ts
```

Expected: API client tests pass.

- [x] **Step 6: Commit**

```bash
git add apps/web/src/types.ts apps/web/src/api.ts apps/web/src/__tests__/api.test.ts
git commit -m "web: add learning core api client"
```

---

## Task 8: Build Dashboard, Concept Map, And Glossary Components

**Files:**
- Create: `apps/web/src/components/ConceptMap.tsx`
- Create: `apps/web/src/components/GlossaryPanel.tsx`
- Create: `apps/web/src/__tests__/ConceptMap.test.tsx`
- Create: `apps/web/src/__tests__/Dashboard.test.tsx`
- Create: `apps/web/src/__tests__/GlossaryPanel.test.tsx`
- Modify: `apps/web/src/components/Dashboard.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing ConceptMap test**

Create `apps/web/src/__tests__/ConceptMap.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConceptMap } from "../components/ConceptMap";
import type { Track } from "../types";

const tracks: Track[] = [
  {
    id: "math-for-models",
    title: "Math for Models",
    summary: "Math",
    order: 2,
    concepts: [
      {
        id: "vectors",
        title: "Vectors",
        order: 1,
        prerequisites: [],
        lessonPath: "",
        lessonMarkdown: "",
        lab: "math-vector-demo",
        visual: "vector-similarity",
        checkpoint: { question: "q", answer: "a" },
        glossary: ["vector"],
        status: "available"
      },
      {
        id: "dot-products",
        title: "Dot Products",
        order: 2,
        prerequisites: ["vectors"],
        lessonPath: "",
        lessonMarkdown: "",
        lab: "math-vector-demo",
        visual: "vector-similarity",
        checkpoint: { question: "q", answer: "a" },
        glossary: ["dot-product"],
        status: "available"
      }
    ]
  }
];

describe("ConceptMap", () => {
  it("renders concepts and prerequisites", () => {
    render(<ConceptMap tracks={tracks} selectedConceptId="vectors" missedConceptIds={new Set(["dot-products"])} onSelectConcept={() => undefined} />);

    expect(screen.getByRole("button", { name: "Vectors" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dot Products revisit needed" })).toBeInTheDocument();
    expect(screen.getByText("Vectors -> Dot Products")).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Write failing Dashboard and Glossary tests**

Create `apps/web/src/__tests__/Dashboard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "../components/Dashboard";
import type { LabRunArtifact, MissedTopic, Track } from "../types";

const tracks: Track[] = [
  { id: "math", title: "Math", summary: "Math track", order: 1, concepts: [] }
];
const missedTopics: MissedTopic[] = [{ conceptId: "vectors", reason: "low-confidence" }];
const artifacts: LabRunArtifact[] = [{ labId: "math-vector-demo", conceptId: "vectors", artifactPath: "artifacts/labs/math-vector-demo.json", status: "passed", error: "" }];

describe("Dashboard", () => {
  it("shows missed topics and recent artifacts", () => {
    render(
      <Dashboard
        tracks={tracks}
        selectedConceptId={null}
        missedTopics={missedTopics}
        recentArtifacts={artifacts}
        onSelectConcept={() => undefined}
      />
    );

    expect(screen.getByText("Missed Topics")).toBeInTheDocument();
    expect(screen.getByText("vectors - low-confidence")).toBeInTheDocument();
    expect(screen.getByText("math-vector-demo")).toBeInTheDocument();
  });
});
```

Create `apps/web/src/__tests__/GlossaryPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlossaryPanel } from "../components/GlossaryPanel";

describe("GlossaryPanel", () => {
  it("shows terms related to the selected concept", () => {
    render(
      <GlossaryPanel
        conceptGlossaryIds={["vector"]}
        entries={[
          {
            id: "vector",
            term: "Vector",
            shortDefinition: "An ordered list of numbers.",
            explanation: "Used for embeddings.",
            relatedConcepts: ["vectors"]
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Glossary" })).toBeInTheDocument();
    expect(screen.getByText("Vector")).toBeInTheDocument();
    expect(screen.getByText("An ordered list of numbers.")).toBeInTheDocument();
  });
});
```

- [x] **Step 3: Run component tests to verify failure**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/ConceptMap.test.tsx src/__tests__/Dashboard.test.tsx src/__tests__/GlossaryPanel.test.tsx
```

Expected: fails because `ConceptMap` and `GlossaryPanel` do not exist and `Dashboard` props are not extended.

- [x] **Step 4: Implement ConceptMap**

Create `apps/web/src/components/ConceptMap.tsx`:

```tsx
import type { Concept, Track } from "../types";

interface ConceptMapProps {
  tracks: Track[];
  selectedConceptId: string | null;
  missedConceptIds: Set<string>;
  onSelectConcept: (concept: Concept) => void;
}

export function ConceptMap({ tracks, selectedConceptId, missedConceptIds, onSelectConcept }: ConceptMapProps) {
  const concepts = tracks.flatMap((track) => track.concepts.map((concept) => ({ ...concept, trackTitle: track.title })));
  const titleById = new Map(concepts.map((concept) => [concept.id, concept.title]));

  return (
    <section className="concept-map" aria-label="Concept map">
      <h2>Concept Map</h2>
      <div className="concept-map-grid">
        {concepts.map((concept) => {
          const missed = missedConceptIds.has(concept.id);
          return (
            <button
              key={concept.id}
              type="button"
              className={concept.id === selectedConceptId ? "concept-node selected" : "concept-node"}
              aria-label={missed ? `${concept.title} revisit needed` : concept.title}
              data-missed={missed}
              onClick={() => onSelectConcept(concept)}
            >
              <span>{concept.title}</span>
              <small>{concept.trackTitle}</small>
            </button>
          );
        })}
      </div>
      <div className="prerequisite-list" aria-label="Prerequisite edges">
        {concepts.flatMap((concept) =>
          concept.prerequisites.map((prerequisite) => (
            <p key={`${prerequisite}-${concept.id}`}>
              {titleById.get(prerequisite) ?? prerequisite} -&gt; {concept.title}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
```

- [x] **Step 5: Extend Dashboard**

Modify `apps/web/src/components/Dashboard.tsx` props:

```tsx
import type { Concept, LabRunArtifact, MissedTopic, Track } from "../types";

interface DashboardProps {
  tracks: Track[];
  selectedConceptId: string | null;
  missedTopics: MissedTopic[];
  recentArtifacts: LabRunArtifact[];
  onSelectConcept: (concept: Concept) => void;
}
```

Add sections below the track list:

```tsx
<section>
  <h3>Missed Topics</h3>
  {missedTopics.length === 0 ? <p>No revisit items yet.</p> : null}
  {missedTopics.map((topic) => (
    <p key={`${topic.conceptId}-${topic.reason}`}>{topic.conceptId} - {topic.reason}</p>
  ))}
</section>
<section>
  <h3>Recent Artifacts</h3>
  {recentArtifacts.length === 0 ? <p>No lab artifacts yet.</p> : null}
  {recentArtifacts.map((artifact) => (
    <p key={`${artifact.labId}-${artifact.artifactPath}`}>{artifact.labId}</p>
  ))}
</section>
```

- [x] **Step 6: Implement GlossaryPanel**

Create `apps/web/src/components/GlossaryPanel.tsx`:

```tsx
import type { GlossaryEntry } from "../types";

interface GlossaryPanelProps {
  conceptGlossaryIds: string[];
  entries: GlossaryEntry[];
}

export function GlossaryPanel({ conceptGlossaryIds, entries }: GlossaryPanelProps) {
  const allowed = new Set(conceptGlossaryIds);
  const visibleEntries = entries.filter((entry) => allowed.has(entry.id));

  return (
    <aside className="glossary-panel" aria-label="Glossary">
      <h3>Glossary</h3>
      {visibleEntries.length === 0 ? <p>No glossary terms for this concept yet.</p> : null}
      {visibleEntries.map((entry) => (
        <article key={entry.id}>
          <h4>{entry.term}</h4>
          <p>{entry.shortDefinition}</p>
        </article>
      ))}
    </aside>
  );
}
```

- [x] **Step 7: Add CSS for map and panels**

Modify `apps/web/src/styles.css`:

```css
.concept-map,
.glossary-panel {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(28 40 54 / 10%);
  padding: 20px;
}

.concept-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.concept-node {
  display: grid;
  gap: 4px;
  min-height: 64px;
  background: #e9f2ef;
  color: #18212f;
  text-align: left;
}

.concept-node[data-missed="true"] {
  box-shadow: inset 4px 0 0 #cc7a4b;
}

.prerequisite-list {
  margin-top: 16px;
  color: #4b5a65;
  font-size: 14px;
}
```

- [x] **Step 8: Run component tests**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/ConceptMap.test.tsx src/__tests__/Dashboard.test.tsx src/__tests__/GlossaryPanel.test.tsx
```

Expected: component tests pass.

- [x] **Step 9: Commit**

```bash
git add apps/web/src/components/ConceptMap.tsx apps/web/src/components/Dashboard.tsx apps/web/src/components/GlossaryPanel.tsx apps/web/src/__tests__/ConceptMap.test.tsx apps/web/src/__tests__/Dashboard.test.tsx apps/web/src/__tests__/GlossaryPanel.test.tsx apps/web/src/styles.css
git commit -m "web: add concept map and recovery dashboard"
```

---

## Task 9: Add Workspace Tabs, Checkpoint Panel, And Lab Panel

**Files:**
- Create: `apps/web/src/components/CheckpointPanel.tsx`
- Create: `apps/web/src/components/LabPanel.tsx`
- Create: `apps/web/src/components/VisualExperiment.tsx`
- Create: `apps/web/src/__tests__/CheckpointPanel.test.tsx`
- Create: `apps/web/src/__tests__/LabPanel.test.tsx`
- Modify: `apps/web/src/components/ConceptWorkspace.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing CheckpointPanel test**

Create `apps/web/src/__tests__/CheckpointPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckpointPanel } from "../components/CheckpointPanel";

describe("CheckpointPanel", () => {
  it("submits answer and shows feedback", async () => {
    const onSubmit = vi.fn(async () => ({
      conceptId: "vectors",
      submittedAnswer: "numbers",
      correct: false,
      feedback: "Mention ordered numbers.",
      confidence: 2
    }));

    render(<CheckpointPanel question="What is a vector?" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Checkpoint answer"), "numbers");
    await userEvent.selectOptions(screen.getByLabelText("Confidence"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Submit checkpoint" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Mention ordered numbers.");
  });
});
```

- [x] **Step 2: Write failing LabPanel test**

Create `apps/web/src/__tests__/LabPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LabPanel } from "../components/LabPanel";

describe("LabPanel", () => {
  it("runs a lab and shows artifact path", async () => {
    const onRun = vi.fn(async () => ({
      labId: "math-vector-demo",
      conceptId: "vectors",
      artifactPath: "artifacts/labs/math-vector-demo.json",
      status: "passed",
      error: ""
    }));

    render(<LabPanel labId="math-vector-demo" onRun={onRun} />);

    await userEvent.click(screen.getByRole("button", { name: "Run lab" }));

    expect(await screen.findByRole("status")).toHaveTextContent("artifacts/labs/math-vector-demo.json");
  });
});
```

- [x] **Step 3: Run panel tests to verify failure**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/CheckpointPanel.test.tsx src/__tests__/LabPanel.test.tsx
```

Expected: fails because panel components do not exist.

- [x] **Step 4: Implement CheckpointPanel**

Create `apps/web/src/components/CheckpointPanel.tsx`:

```tsx
import { useState } from "react";
import type { CheckpointAttempt } from "../types";

interface CheckpointPanelProps {
  question: string;
  onSubmit: (input: { submittedAnswer: string; confidence: number }) => Promise<CheckpointAttempt>;
}

export function CheckpointPanel({ question, onSubmit }: CheckpointPanelProps) {
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit() {
    const result = await onSubmit({ submittedAnswer, confidence });
    setFeedback(result.feedback);
  }

  return (
    <section className="checkpoint-panel">
      <h3>Checkpoint</h3>
      <p>{question}</p>
      <label>
        Checkpoint answer
        <textarea value={submittedAnswer} onChange={(event) => setSubmittedAnswer(event.target.value)} />
      </label>
      <label>
        Confidence
        <select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={handleSubmit}>Submit checkpoint</button>
      {feedback ? <p role="status">{feedback}</p> : null}
    </section>
  );
}
```

- [x] **Step 5: Implement LabPanel**

Create `apps/web/src/components/LabPanel.tsx`:

```tsx
import { useState } from "react";
import type { LabRunArtifact } from "../types";

interface LabPanelProps {
  labId: string | null;
  onRun: (labId: string) => Promise<LabRunArtifact>;
}

export function LabPanel({ labId, onRun }: LabPanelProps) {
  const [artifact, setArtifact] = useState<LabRunArtifact | null>(null);

  async function handleRun() {
    if (!labId) return;
    setArtifact(await onRun(labId));
  }

  if (!labId) {
    return <p>No lab for this concept yet.</p>;
  }

  return (
    <section className="lab-panel">
      <h3>Lab</h3>
      <p>{labId}</p>
      <button type="button" onClick={handleRun}>Run lab</button>
      {artifact ? <p role="status">{artifact.artifactPath}</p> : null}
    </section>
  );
}
```

- [x] **Step 6: Implement VisualExperiment**

Create `apps/web/src/components/VisualExperiment.tsx`:

```tsx
import { TokenFlowSvg } from "./TokenFlowSvg";

interface VisualExperimentProps {
  visualId: string | null;
}

export function VisualExperiment({ visualId }: VisualExperimentProps) {
  if (visualId === "token-flow-svg") {
    return <TokenFlowSvg />;
  }
  if (visualId === "vector-similarity") {
    return <div className="visual-frame" role="img" aria-label="Vector similarity visual">vector dot product -&gt; score</div>;
  }
  if (visualId === "softmax-bars") {
    return <div className="visual-frame" role="img" aria-label="Softmax probabilities visual">logits -&gt; probabilities</div>;
  }
  if (visualId === "gradient-step" || visualId === "linear-loss-step") {
    return <div className="visual-frame" role="img" aria-label="Gradient step visual">loss goes down after update</div>;
  }
  return <p>No visual for this concept yet.</p>;
}
```

- [x] **Step 7: Replace workspace sections with tabs**

Modify `ConceptWorkspace` props:

```tsx
interface ConceptWorkspaceProps {
  concept: Concept;
  glossaryEntries: GlossaryEntry[];
  onSubmitCheckpoint: (conceptId: string, input: CheckpointAttemptInput) => Promise<CheckpointAttempt>;
  onRunLab: (labId: string) => Promise<LabRunArtifact>;
}
```

Use tab state:

```tsx
const tabs = ["Lesson", "Visual", "Lab", "Checkpoint", "Notes"] as const;
const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Lesson");
```

Render tab buttons:

```tsx
<div className="workspace-tabs" role="tablist" aria-label="Concept workspace tabs">
  {tabs.map((tab) => (
    <button
      key={tab}
      type="button"
      role="tab"
      aria-selected={activeTab === tab}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>
```

Render panels:

```tsx
{activeTab === "Lesson" ? (
  <section className="lesson">
    <article className="lesson-content">
      <ReactMarkdown
        components={{
          h1: () => null,
          h2: ({ children }) => <h3>{children}</h3>
        }}
      >
        {concept.lessonMarkdown}
      </ReactMarkdown>
    </article>
    <GlossaryPanel conceptGlossaryIds={concept.glossary} entries={glossaryEntries} />
  </section>
) : null}
{activeTab === "Visual" ? <section className="visual-panel"><VisualExperiment visualId={concept.visual} /></section> : null}
{activeTab === "Lab" ? <LabPanel labId={concept.lab} onRun={onRunLab} /> : null}
{activeTab === "Checkpoint" ? (
  <CheckpointPanel
    question={concept.checkpoint.question}
    onSubmit={(input) => onSubmitCheckpoint(concept.id, input)}
  />
) : null}
{activeTab === "Notes" ? <ProgressPanel conceptId={concept.id} /> : null}
```

- [x] **Step 8: Add tab CSS**

Modify `apps/web/src/styles.css`:

```css
.workspace-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.workspace-tabs button[aria-selected="true"] {
  background: #1f5f6f;
  color: #ffffff;
}

.checkpoint-panel,
.lab-panel,
.visual-frame {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(28 40 54 / 10%);
  padding: 20px;
}

.checkpoint-panel textarea {
  display: block;
  min-height: 88px;
  width: 100%;
}
```

- [x] **Step 9: Run panel tests**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/CheckpointPanel.test.tsx src/__tests__/LabPanel.test.tsx
```

Expected: panel tests pass.

- [x] **Step 10: Commit**

```bash
git add apps/web/src/components apps/web/src/__tests__/CheckpointPanel.test.tsx apps/web/src/__tests__/LabPanel.test.tsx apps/web/src/styles.css
git commit -m "web: add learning workspace panels"
```

---

## Task 10: Wire App State Across Dashboard, Map, Workspace, And API

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/__tests__/App.test.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing App integration test**

Modify `apps/web/src/__tests__/App.test.tsx` so the mocked data includes a Math concept with glossary, a missed topic, and a lab artifact. Add assertions:

```tsx
expect(await screen.findByRole("heading", { name: "Concept Map" })).toBeInTheDocument();
expect(screen.getByText("Missed Topics")).toBeInTheDocument();
expect(screen.getByText("vectors - low-confidence")).toBeInTheDocument();
expect(screen.getByText("math-vector-demo")).toBeInTheDocument();

await userEvent.click(screen.getByRole("button", { name: "Vectors revisit needed" }));
await userEvent.click(screen.getByRole("tab", { name: "Lab" }));
await userEvent.click(screen.getByRole("button", { name: "Run lab" }));
expect(await screen.findByText("artifacts/labs/math-vector-demo.json")).toBeInTheDocument();

await userEvent.click(screen.getByRole("tab", { name: "Checkpoint" }));
await userEvent.type(screen.getByLabelText("Checkpoint answer"), "numbers");
await userEvent.selectOptions(screen.getByLabelText("Confidence"), "2");
await userEvent.click(screen.getByRole("button", { name: "Submit checkpoint" }));
expect(await screen.findByText("Mention ordered numbers.")).toBeInTheDocument();
```

- [x] **Step 2: Run App test to verify failure**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/App.test.tsx
```

Expected: fails because `App` does not load glossary, missed topics, recent artifacts, or wire new handlers.

- [x] **Step 3: Wire App data loading**

Modify imports:

```tsx
import {
  fetchGlossary,
  fetchMissedTopics,
  fetchRecentArtifacts,
  fetchTracks,
  runLab,
  submitCheckpoint
} from "./api";
import { ConceptMap } from "./components/ConceptMap";
import type { Concept, GlossaryEntry, LabRunArtifact, MissedTopic, Track } from "./types";
```

Add state:

```tsx
const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);
const [recentArtifacts, setRecentArtifacts] = useState<LabRunArtifact[]>([]);
```

Load all startup data:

```tsx
useEffect(() => {
  Promise.all([fetchTracks(), fetchGlossary(), fetchMissedTopics(), fetchRecentArtifacts()])
    .then(([loadedTracks, loadedGlossary, loadedMissedTopics, loadedArtifacts]) => {
      setTracks(loadedTracks);
      setGlossaryEntries(loadedGlossary);
      setMissedTopics(loadedMissedTopics);
      setRecentArtifacts(loadedArtifacts);
      setSelectedConcept(loadedTracks[0]?.concepts[0] ?? null);
    })
    .catch((unknownError: unknown) => {
      setError(unknownError instanceof Error ? unknownError.message : "Unknown error");
    });
}, []);
```

Add handlers:

```tsx
async function handleRunLab(labId: string) {
  const artifact = await runLab(labId);
  setRecentArtifacts((current) => [artifact, ...current.filter((item) => item.artifactPath !== artifact.artifactPath)]);
  return artifact;
}

async function handleSubmitCheckpoint(conceptId: string, input: { submittedAnswer: string; confidence: number }) {
  const attempt = await submitCheckpoint(conceptId, input);
  setMissedTopics(await fetchMissedTopics());
  return attempt;
}
```

Render:

```tsx
<Dashboard
  tracks={tracks}
  selectedConceptId={selectedConcept?.id ?? null}
  missedTopics={missedTopics}
  recentArtifacts={recentArtifacts}
  onSelectConcept={setSelectedConcept}
/>
<ConceptMap
  tracks={tracks}
  selectedConceptId={selectedConcept?.id ?? null}
  missedConceptIds={new Set(missedTopics.map((topic) => topic.conceptId))}
  onSelectConcept={setSelectedConcept}
/>
{selectedConcept ? (
  <ConceptWorkspace
    concept={selectedConcept}
    glossaryEntries={glossaryEntries}
    onSubmitCheckpoint={handleSubmitCheckpoint}
    onRunLab={handleRunLab}
  />
) : (
  <p>Loading curriculum...</p>
)}
```

- [x] **Step 4: Update layout CSS**

Modify `.main-layout` to support dashboard, map, and workspace:

```css
.main-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
}

.learning-column {
  display: grid;
  gap: 16px;
}
```

Wrap the map and workspace in `<div className="learning-column">`.

- [x] **Step 5: Run App test**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/App.test.tsx
```

Expected: App test passes.

- [x] **Step 6: Run all web tests**

Run:

```bash
npm run web:test
```

Expected: all Vitest tests pass.

- [x] **Step 7: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/__tests__/App.test.tsx apps/web/src/styles.css
git commit -m "web: wire learning core app state"
```

---

## Task 11: Add Phase 2 End-To-End Flow

**Files:**
- Create: `tests/e2e/phase2-learning-core.spec.ts`

- [x] **Step 1: Write failing e2e test**

Create `tests/e2e/phase2-learning-core.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("learner runs a math lab and sends low-confidence checkpoint to missed topics", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Learn LLM The Hard Way" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Concept Map" })).toBeVisible();

  await page.getByRole("button", { name: "Vectors" }).click();
  await expect(page.getByRole("heading", { name: "Vectors" })).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  await expect(page.getByRole("status")).toContainText("artifacts/labs/math-vector-demo.json");

  await page.getByRole("tab", { name: "Checkpoint" }).click();
  await page.getByLabel("Checkpoint answer").fill("numbers");
  await page.getByLabel("Confidence").selectOption("2");
  await page.getByRole("button", { name: "Submit checkpoint" }).click();
  await expect(page.getByText("Mention ordered numbers.")).toBeVisible();

  await expect(page.getByText("vectors - low-confidence")).toBeVisible();
});
```

- [x] **Step 2: Run e2e to verify failure**

Run:

```bash
source .venv/bin/activate
npm run e2e
```

Expected: Phase 2 e2e fails before the web/API wiring from prior tasks is complete. If prior tasks are complete, this may pass immediately; in that case, confirm it was failing before implementation in the task log.

- [x] **Step 3: Fix any accessibility labels found by Playwright**

If the test cannot locate elements by role or label, change the UI so these labels exist:

```tsx
<select aria-label="Confidence" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}>
```

and:

```tsx
<div className="workspace-tabs" role="tablist" aria-label="Concept workspace tabs">
```

- [x] **Step 4: Run e2e to verify pass**

Run:

```bash
source .venv/bin/activate
npm run e2e
```

Expected: both Phase 1 and Phase 2 e2e tests pass.

- [x] **Step 5: Commit**

```bash
git add tests/e2e/phase2-learning-core.spec.ts apps/web/src
git commit -m "test: add phase two learning core e2e"
```

---

## Task 12: Full Verification And Finish Branch

**Files:**
- Modify only files needed to fix verification failures.

- [x] **Step 1: Run Python lab tests**

Run:

```bash
source .venv/bin/activate
npm run labs:test
```

Expected: all Python lab tests pass.

- [x] **Step 2: Run API tests**

Run:

```bash
source .venv/bin/activate
npm run api:test
```

Expected: all API tests pass.

- [x] **Step 3: Run web tests**

Run:

```bash
npm run web:test
```

Expected: all Vitest tests pass.

- [x] **Step 4: Run web build**

Run:

```bash
npm --prefix apps/web run build
```

Expected: TypeScript and Vite build pass.

- [x] **Step 5: Run e2e tests**

Run:

```bash
source .venv/bin/activate
npm run e2e
```

Expected: all Playwright tests pass.

- [x] **Step 6: Browser visual check**

Start the API server in one terminal:

```bash
source .venv/bin/activate
npm run api:dev
```

Start the web server in a second terminal:

```bash
npm run web:dev
```

Open `http://127.0.0.1:5173` and verify:

- Dashboard shows missed-topic and recent-artifact sections.
- Concept map shows Data and Tokens, Math for Models, and Early Neural Nets.
- Vectors concept opens.
- Lab tab runs a demo and shows an artifact path.
- Checkpoint tab accepts a low-confidence answer.
- Missed-topic queue updates.

- [x] **Step 7: Check git status**

Run:

```bash
git status --short
```

Expected: clean working tree.

- [ ] **Step 8: Finish branch**

Use the finishing workflow:

```text
I'm using the finishing-a-development-branch skill to complete this work.
```

Then follow `finishing-a-development-branch` exactly.
