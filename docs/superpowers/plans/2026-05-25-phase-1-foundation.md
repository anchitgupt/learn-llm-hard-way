# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable local foundation for Learn LLM The Hard Way: monorepo tooling, Python tokenizer labs, FastAPI content/progress API, React learning shell, and one end-to-end tokenization learning path.

**Architecture:** Use the approved monorepo layout with `apps/web` for Vite + React + TypeScript, `apps/api` for FastAPI, `labs/python` for the Python learning package, and `content` for versioned curriculum data. Phase 1 keeps lab execution terminal-first while the API and web app read deterministic content and progress state.

**Tech Stack:** Python 3.11+, FastAPI, pytest, SQLite, Vite, React, TypeScript, Vitest, React Testing Library, Playwright, Motion for React, D3, React Flow.

---

## Scope Boundary

This plan implements only Phase 1 from the design spec. It deliberately does not implement the full concept map graph UI, app-triggered lab execution, neural net labs, transformer labs, chat playground, failure museum, tool use, or RLHF simulations. Those belong to later rollout plans.

Phase 1 must end with:

- A clean repo structure.
- Python tests passing for the first tokenizer labs.
- FastAPI tests passing for content loading and progress storage.
- React tests passing for the first learning UI.
- A local run path for API and web app.
- A browser-verified path: dashboard -> token lesson -> save note -> mark revisit.

## File Structure

Create or modify these files:

```text
.
  README.md
  package.json
  pyproject.toml
  playwright.config.ts
  docs/
    run.md
    superpowers/
      plans/
        2026-05-25-phase-1-foundation.md
      specs/
        2026-05-25-learn-llm-hard-way-design.md
  content/
    concepts/
      data-and-tokens.json
    lessons/
      data-and-tokens/
        bytes-unicode.md
        character-tokenization.md
        byte-pair-encoding.md
  labs/
    python/
      llm_from_scratch/
        __init__.py
        tokenizers/
          __init__.py
          character.py
          bpe.py
        experiments/
          __init__.py
          tokenization_demo.py
      tests/
        test_character_tokenizer.py
        test_bpe.py
        test_tokenization_demo.py
  apps/
    api/
      learn_llm_api/
        __init__.py
        app.py
        content_loader.py
        progress_store.py
      tests/
        test_content_loader.py
        test_progress_store.py
        test_app.py
    web/
      index.html
      package.json
      tsconfig.json
      tsconfig.node.json
      vite.config.ts
      vitest.setup.ts
      src/
        main.tsx
        App.tsx
        api.ts
        types.ts
        components/
          Dashboard.tsx
          ConceptWorkspace.tsx
          ProgressPanel.tsx
          TokenFlowSvg.tsx
        styles.css
        __tests__/
          App.test.tsx
          api.test.ts
          TokenFlowSvg.test.tsx
  tests/
    e2e/
      phase1-learning-path.spec.ts
```

## Task 1: Root Tooling And Run Docs

**Files:**
- Create: `README.md`
- Create: `docs/run.md`
- Create: `package.json`
- Create: `pyproject.toml`
- Create: `playwright.config.ts`
- Create: `labs/python/llm_from_scratch/__init__.py`
- Create: `apps/api/learn_llm_api/__init__.py`

- [ ] **Step 1: Create root package scripts**

Create `package.json`:

```json
{
  "name": "learn-llm-hard-way",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "api:dev": "python -m uvicorn learn_llm_api.app:create_app --factory --reload --port 8000",
    "api:test": "pytest apps/api/tests -q",
    "labs:test": "pytest labs/python/tests -q",
    "web:dev": "npm --prefix apps/web run dev -- --host 127.0.0.1 --port 5173",
    "web:test": "npm --prefix apps/web test",
    "e2e": "playwright test",
    "test": "npm run labs:test && npm run api:test && npm run web:test"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0"
  }
}
```

- [ ] **Step 2: Create Python project config**

Create `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=69", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "learn-llm-hard-way"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic>=2.7"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2",
  "httpx>=0.27"
]

[tool.setuptools.packages.find]
where = ["labs/python", "apps/api"]

[tool.pytest.ini_options]
pythonpath = ["labs/python", "apps/api"]
testpaths = ["labs/python/tests", "apps/api/tests"]
```

- [ ] **Step 3: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "npm run api:dev",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: true,
      timeout: 20_000
    },
    {
      command: "npm run web:dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 20_000
    }
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ]
});
```

- [ ] **Step 4: Create initial package markers**

Create `labs/python/llm_from_scratch/__init__.py`:

```python
"""Learning implementations for Learn LLM The Hard Way."""
```

Create `apps/api/learn_llm_api/__init__.py`:

```python
"""Local API for Learn LLM The Hard Way."""
```

- [ ] **Step 5: Create README**

Create `README.md`:

```md
# Learn LLM The Hard Way

A local-first hybrid project for learning how LLMs work from bytes and tokens through the user-facing chat experience.

Phase 1 builds the foundation:

- Python tokenizer labs.
- FastAPI local content/progress API.
- React learning app shell.
- Versioned curriculum content.
- Local progress and revisit state.

## Run

See [docs/run.md](docs/run.md).

## Design

See [docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md](docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md).
```

- [ ] **Step 6: Create run document**

Create `docs/run.md`:

````md
# Run Learn LLM The Hard Way

## First Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
npm install
npm --prefix apps/web install
npx playwright install chromium
```

## Run Tests

```bash
npm run labs:test
npm run api:test
npm run web:test
source .venv/bin/activate
npm run e2e
```

## Start Locally

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
````

- [ ] **Step 7: Run root verification**

Run:

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

Expected:

- `node_modules` is created.
- `.venv` is created.
- Python package installs without errors.

- [ ] **Step 8: Commit**

```bash
git add README.md docs/run.md package.json package-lock.json pyproject.toml playwright.config.ts labs/python/llm_from_scratch/__init__.py apps/api/learn_llm_api/__init__.py
git commit -m "chore: add foundation tooling"
```

## Task 2: Versioned Curriculum Content

**Files:**
- Create: `content/concepts/data-and-tokens.json`
- Create: `content/lessons/data-and-tokens/bytes-unicode.md`
- Create: `content/lessons/data-and-tokens/character-tokenization.md`
- Create: `content/lessons/data-and-tokens/byte-pair-encoding.md`

- [ ] **Step 1: Create concept metadata**

Create `content/concepts/data-and-tokens.json`:

```json
{
  "track": {
    "id": "data-and-tokens",
    "title": "Data and Tokens",
    "summary": "Start from bytes, Unicode, characters, and tokenization before any model training happens.",
    "order": 1
  },
  "concepts": [
    {
      "id": "bytes-unicode",
      "title": "Bytes and Unicode",
      "order": 1,
      "prerequisites": [],
      "lessonPath": "content/lessons/data-and-tokens/bytes-unicode.md",
      "lab": null,
      "visual": "token-flow-svg",
      "checkpoint": {
        "question": "Why can the same visible character use different byte sequences?",
        "answer": "Because text is encoded into bytes using a character encoding such as UTF-8, and visible characters can map to one or more code points and byte sequences."
      },
      "glossary": ["byte", "unicode", "utf-8"],
      "status": "available"
    },
    {
      "id": "character-tokenization",
      "title": "Character Tokenization",
      "order": 2,
      "prerequisites": ["bytes-unicode"],
      "lessonPath": "content/lessons/data-and-tokens/character-tokenization.md",
      "lab": "character-tokenizer",
      "visual": "token-flow-svg",
      "checkpoint": {
        "question": "What does a character tokenizer lose compared with a learned subword tokenizer?",
        "answer": "It creates long sequences and does not learn frequent reusable chunks such as common words, prefixes, or suffixes."
      },
      "glossary": ["token", "vocabulary", "sequence-length"],
      "status": "available"
    },
    {
      "id": "byte-pair-encoding",
      "title": "Byte Pair Encoding",
      "order": 3,
      "prerequisites": ["character-tokenization"],
      "lessonPath": "content/lessons/data-and-tokens/byte-pair-encoding.md",
      "lab": "bpe-tokenizer",
      "visual": "token-flow-svg",
      "checkpoint": {
        "question": "What does one BPE merge do?",
        "answer": "It finds a frequent adjacent token pair and replaces that pair with a new token, shortening sequences while expanding the vocabulary."
      },
      "glossary": ["bpe", "merge", "subword"],
      "status": "available"
    }
  ]
}
```

- [ ] **Step 2: Create bytes lesson**

Create `content/lessons/data-and-tokens/bytes-unicode.md`:

```md
# Bytes and Unicode

LLMs do not see text the way people do. A model ultimately receives numbers. Before numbers reach the model, visible text is represented as bytes through an encoding such as UTF-8.

The important first idea is that a character is not the same thing as a byte. Some characters fit in one byte. Others require multiple bytes. This matters because tokenizers must turn messy human text into stable model inputs.

## What To Notice

- Text has a visible form and an encoded byte form.
- Unicode gives characters stable identities.
- UTF-8 turns those identities into byte sequences.
- Tokenizers build on top of this representation.
```

- [ ] **Step 3: Create character-tokenization lesson**

Create `content/lessons/data-and-tokens/character-tokenization.md`:

````md
# Character Tokenization

A character tokenizer is the simplest tokenizer worth building. It maps each character to an integer id and maps each id back to a character.

This is not how modern production LLMs usually tokenize text, but it is the cleanest first step. You can see the full path from text to ids without hiding anything.

## What To Notice

- A vocabulary is a mapping between symbols and ids.
- Encoding turns text into ids.
- Decoding turns ids back into text.
- Character tokenization creates long sequences for normal language.

## Lab

Run the character tokenizer lab from the terminal:

```bash
python -m llm_from_scratch.experiments.tokenization_demo
```
````

- [ ] **Step 4: Create BPE lesson**

Create `content/lessons/data-and-tokens/byte-pair-encoding.md`:

```md
# Byte Pair Encoding

Byte Pair Encoding starts with small tokens and repeatedly merges frequent adjacent pairs. Each merge adds a new token to the vocabulary and can shorten future sequences.

The key learning move is to watch a single merge happen. Once one merge is clear, the full tokenizer is just repeated counting and replacement.

## What To Notice

- BPE is data-driven.
- Frequent adjacent pairs become new tokens.
- Vocabulary grows while sequence length can shrink.
- Token boundaries affect what the model can easily count, spell, or copy.
```

- [ ] **Step 5: Commit**

```bash
git add content/concepts/data-and-tokens.json content/lessons/data-and-tokens
git commit -m "content: add first data and tokens lessons"
```

## Task 3: Python Character Tokenizer Lab

**Files:**
- Create: `labs/python/llm_from_scratch/tokenizers/__init__.py`
- Create: `labs/python/llm_from_scratch/tokenizers/character.py`
- Create: `labs/python/tests/test_character_tokenizer.py`

- [ ] **Step 1: Write failing tests**

Create `labs/python/tests/test_character_tokenizer.py`:

```python
from llm_from_scratch.tokenizers.character import CharacterTokenizer


def test_character_tokenizer_round_trips_text():
    tokenizer = CharacterTokenizer.train("banana")

    ids = tokenizer.encode("banana")

    assert ids == [1, 0, 2, 0, 2, 0]
    assert tokenizer.decode(ids) == "banana"
    assert tokenizer.vocab_size == 3


def test_character_tokenizer_rejects_unknown_character():
    tokenizer = CharacterTokenizer.train("abc")

    try:
        tokenizer.encode("z")
    except KeyError as exc:
        assert "Unknown character: z" in str(exc)
    else:
        raise AssertionError("Expected KeyError for unknown character")
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_character_tokenizer.py -q
```

Expected: FAIL because `llm_from_scratch.tokenizers.character` does not exist.

- [ ] **Step 3: Add tokenizer package marker**

Create `labs/python/llm_from_scratch/tokenizers/__init__.py`:

```python
"""Tokenizer labs."""
```

- [ ] **Step 4: Implement minimal tokenizer**

Create `labs/python/llm_from_scratch/tokenizers/character.py`:

```python
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CharacterTokenizer:
    char_to_id: dict[str, int]
    id_to_char: dict[int, str]

    @classmethod
    def train(cls, text: str) -> "CharacterTokenizer":
        chars = sorted(set(text))
        char_to_id = {char: index for index, char in enumerate(chars)}
        id_to_char = {index: char for char, index in char_to_id.items()}
        return cls(char_to_id=char_to_id, id_to_char=id_to_char)

    @property
    def vocab_size(self) -> int:
        return len(self.char_to_id)

    def encode(self, text: str) -> list[int]:
        ids: list[int] = []
        for char in text:
            if char not in self.char_to_id:
                raise KeyError(f"Unknown character: {char}")
            ids.append(self.char_to_id[char])
        return ids

    def decode(self, ids: list[int]) -> str:
        return "".join(self.id_to_char[token_id] for token_id in ids)
```

- [ ] **Step 5: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_character_tokenizer.py -q
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add labs/python/llm_from_scratch labs/python/tests/test_character_tokenizer.py
git commit -m "labs: add character tokenizer"
```

## Task 4: Python BPE Merge Lab

**Files:**
- Create: `labs/python/llm_from_scratch/tokenizers/bpe.py`
- Create: `labs/python/tests/test_bpe.py`

- [ ] **Step 1: Write failing tests**

Create `labs/python/tests/test_bpe.py`:

```python
from llm_from_scratch.tokenizers.bpe import count_pairs, merge_pair, train_merges


def test_count_pairs_counts_adjacent_pairs():
    tokens = tuple("banana")

    counts = count_pairs(tokens)

    assert counts[("a", "n")] == 2
    assert counts[("n", "a")] == 2
    assert counts[("b", "a")] == 1


def test_merge_pair_replaces_non_overlapping_pairs():
    tokens = tuple("banana")

    merged = merge_pair(tokens, ("a", "n"), "an")

    assert merged == ("b", "an", "an", "a")


def test_train_merges_applies_most_frequent_pair():
    result = train_merges("banana", merge_count=1)

    assert result.initial_tokens == ("b", "a", "n", "a", "n", "a")
    assert result.merges[0].pair == ("a", "n")
    assert result.merges[0].new_token == "an"
    assert result.final_tokens == ("b", "an", "an", "a")
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_bpe.py -q
```

Expected: FAIL because `llm_from_scratch.tokenizers.bpe` does not exist.

- [ ] **Step 3: Implement BPE helpers**

Create `labs/python/llm_from_scratch/tokenizers/bpe.py`:

```python
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Iterable


Token = str
Pair = tuple[Token, Token]


@dataclass(frozen=True)
class MergeStep:
    pair: Pair
    new_token: Token
    before: tuple[Token, ...]
    after: tuple[Token, ...]


@dataclass(frozen=True)
class BpeTrainingResult:
    initial_tokens: tuple[Token, ...]
    merges: tuple[MergeStep, ...]
    final_tokens: tuple[Token, ...]


def count_pairs(tokens: Iterable[Token]) -> Counter[Pair]:
    sequence = tuple(tokens)
    return Counter(zip(sequence, sequence[1:]))


def merge_pair(tokens: Iterable[Token], pair: Pair, new_token: Token) -> tuple[Token, ...]:
    sequence = tuple(tokens)
    output: list[Token] = []
    index = 0
    while index < len(sequence):
        if index < len(sequence) - 1 and (sequence[index], sequence[index + 1]) == pair:
            output.append(new_token)
            index += 2
        else:
            output.append(sequence[index])
            index += 1
    return tuple(output)


def train_merges(text: str, merge_count: int) -> BpeTrainingResult:
    tokens = tuple(text)
    initial_tokens = tokens
    merges: list[MergeStep] = []

    for _ in range(merge_count):
        pair_counts = count_pairs(tokens)
        if not pair_counts:
            break
        pair, _count = pair_counts.most_common(1)[0]
        new_token = "".join(pair)
        next_tokens = merge_pair(tokens, pair, new_token)
        merges.append(MergeStep(pair=pair, new_token=new_token, before=tokens, after=next_tokens))
        tokens = next_tokens

    return BpeTrainingResult(
        initial_tokens=initial_tokens,
        merges=tuple(merges),
        final_tokens=tokens,
    )
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_bpe.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add labs/python/llm_from_scratch/tokenizers/bpe.py labs/python/tests/test_bpe.py
git commit -m "labs: add byte pair encoding merge lab"
```

## Task 5: Tokenization Demo Artifact

**Files:**
- Create: `labs/python/llm_from_scratch/experiments/__init__.py`
- Create: `labs/python/llm_from_scratch/experiments/tokenization_demo.py`
- Create: `labs/python/tests/test_tokenization_demo.py`

- [ ] **Step 1: Write failing tests**

Create `labs/python/tests/test_tokenization_demo.py`:

```python
import json

from llm_from_scratch.experiments.tokenization_demo import build_demo_artifact


def test_build_demo_artifact_contains_character_and_bpe_outputs():
    artifact = build_demo_artifact("banana")

    assert artifact["input"] == "banana"
    assert artifact["character"]["ids"] == [1, 0, 2, 0, 2, 0]
    assert artifact["character"]["decoded"] == "banana"
    assert artifact["bpe"]["final_tokens"] == ["b", "an", "an", "a"]


def test_build_demo_artifact_is_json_serializable():
    artifact = build_demo_artifact("banana")

    encoded = json.dumps(artifact)

    assert "banana" in encoded
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_tokenization_demo.py -q
```

Expected: FAIL because `llm_from_scratch.experiments.tokenization_demo` does not exist.

- [ ] **Step 3: Implement demo artifact**

Create `labs/python/llm_from_scratch/experiments/__init__.py`:

```python
"""Terminal-first experiment entrypoints."""
```

Create `labs/python/llm_from_scratch/experiments/tokenization_demo.py`:

```python
from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.tokenizers.bpe import train_merges
from llm_from_scratch.tokenizers.character import CharacterTokenizer


def build_demo_artifact(text: str) -> dict[str, object]:
    character_tokenizer = CharacterTokenizer.train(text)
    character_ids = character_tokenizer.encode(text)
    bpe_result = train_merges(text, merge_count=1)

    return {
        "input": text,
        "character": {
            "vocabulary": character_tokenizer.char_to_id,
            "ids": character_ids,
            "decoded": character_tokenizer.decode(character_ids),
        },
        "bpe": {
            "initial_tokens": list(bpe_result.initial_tokens),
            "merges": [
                {
                    "pair": list(step.pair),
                    "new_token": step.new_token,
                    "before": list(step.before),
                    "after": list(step.after),
                }
                for step in bpe_result.merges
            ],
            "final_tokens": list(bpe_result.final_tokens),
        },
    }


def main() -> None:
    artifact = build_demo_artifact("banana")
    output_path = Path("artifacts/tokenization_demo.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest labs/python/tests/test_tokenization_demo.py -q
```

Expected: PASS.

- [ ] **Step 5: Generate artifact**

Run:

```bash
source .venv/bin/activate
python -m llm_from_scratch.experiments.tokenization_demo
```

Expected:

```text
Wrote artifacts/tokenization_demo.json
```

Do not commit `artifacts/tokenization_demo.json`; `artifacts/` is ignored.

- [ ] **Step 6: Commit**

```bash
git add labs/python/llm_from_scratch/experiments labs/python/tests/test_tokenization_demo.py
git commit -m "labs: add tokenization demo artifact"
```

## Task 6: FastAPI Content Loader

**Files:**
- Create: `apps/api/learn_llm_api/content_loader.py`
- Create: `apps/api/tests/test_content_loader.py`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/test_content_loader.py`:

```python
from pathlib import Path

from learn_llm_api.content_loader import load_tracks


def test_load_tracks_reads_concepts_and_lessons():
    tracks = load_tracks(Path("."))

    assert len(tracks) == 1
    track = tracks[0]
    assert track["id"] == "data-and-tokens"
    assert track["title"] == "Data and Tokens"
    assert [concept["id"] for concept in track["concepts"]] == [
        "bytes-unicode",
        "character-tokenization",
        "byte-pair-encoding",
    ]
    assert track["concepts"][0]["lessonMarkdown"].startswith("# Bytes and Unicode")


def test_load_tracks_rejects_missing_prerequisite(tmp_path):
    concepts_dir = tmp_path / "content" / "concepts"
    lessons_dir = tmp_path / "content" / "lessons" / "x"
    concepts_dir.mkdir(parents=True)
    lessons_dir.mkdir(parents=True)
    (lessons_dir / "a.md").write_text("# A\n", encoding="utf-8")
    (concepts_dir / "x.json").write_text(
        """
        {
          "track": {"id": "x", "title": "X", "summary": "X", "order": 1},
          "concepts": [
            {
              "id": "a",
              "title": "A",
              "order": 1,
              "prerequisites": ["missing"],
              "lessonPath": "content/lessons/x/a.md",
              "lab": null,
              "visual": null,
              "checkpoint": {"question": "Q", "answer": "A"},
              "glossary": [],
              "status": "available"
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    try:
        load_tracks(tmp_path)
    except ValueError as exc:
        assert "Unknown prerequisite missing" in str(exc)
    else:
        raise AssertionError("Expected ValueError for missing prerequisite")
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py -q
```

Expected: FAIL because `learn_llm_api.content_loader` does not exist.

- [ ] **Step 3: Implement content loader**

Create `apps/api/learn_llm_api/content_loader.py`:

```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_tracks(repo_root: Path) -> list[dict[str, Any]]:
    content_dir = repo_root / "content" / "concepts"
    tracks: list[dict[str, Any]] = []

    for metadata_path in sorted(content_dir.glob("*.json")):
        raw = json.loads(metadata_path.read_text(encoding="utf-8"))
        track = dict(raw["track"])
        concepts = sorted(raw["concepts"], key=lambda concept: concept["order"])
        concept_ids = {concept["id"] for concept in concepts}

        hydrated_concepts: list[dict[str, Any]] = []
        for concept in concepts:
            for prerequisite in concept["prerequisites"]:
                if prerequisite not in concept_ids:
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
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_content_loader.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/learn_llm_api apps/api/tests/test_content_loader.py
git commit -m "api: add curriculum content loader"
```

## Task 7: SQLite Progress Store

**Files:**
- Create: `apps/api/learn_llm_api/progress_store.py`
- Create: `apps/api/tests/test_progress_store.py`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/test_progress_store.py`:

```python
from learn_llm_api.progress_store import ProgressStore


def test_progress_store_saves_note_and_confidence(tmp_path):
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    store.save_progress(
        concept_id="character-tokenization",
        status="in-progress",
        confidence=2,
        note="Need to revisit vocab ordering.",
        revisit=False,
    )

    progress = store.get_progress("character-tokenization")
    assert progress == {
        "conceptId": "character-tokenization",
        "status": "in-progress",
        "confidence": 2,
        "note": "Need to revisit vocab ordering.",
        "revisit": False,
    }


def test_progress_store_returns_revisit_queue(tmp_path):
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.save_progress("bytes-unicode", "done", 4, "", False)
    store.save_progress("byte-pair-encoding", "confusing", 1, "Pair merges", True)

    revisit = store.list_revisit()

    assert revisit == [
        {
            "conceptId": "byte-pair-encoding",
            "status": "confusing",
            "confidence": 1,
            "note": "Pair merges",
            "revisit": True,
        }
    ]
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py -q
```

Expected: FAIL because `learn_llm_api.progress_store` does not exist.

- [ ] **Step 3: Implement progress store**

Create `apps/api/learn_llm_api/progress_store.py`:

```python
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


class ProgressStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.database_path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS concept_progress (
                  concept_id TEXT PRIMARY KEY,
                  status TEXT NOT NULL,
                  confidence INTEGER NOT NULL,
                  note TEXT NOT NULL,
                  revisit INTEGER NOT NULL CHECK (revisit IN (0, 1)),
                  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def save_progress(
        self,
        concept_id: str,
        status: str,
        confidence: int,
        note: str,
        revisit: bool,
    ) -> None:
        with sqlite3.connect(self.database_path) as connection:
            connection.execute(
                """
                INSERT INTO concept_progress (concept_id, status, confidence, note, revisit)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(concept_id) DO UPDATE SET
                  status = excluded.status,
                  confidence = excluded.confidence,
                  note = excluded.note,
                  revisit = excluded.revisit,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (concept_id, status, confidence, note, int(revisit)),
            )

    def get_progress(self, concept_id: str) -> dict[str, Any] | None:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute(
                """
                SELECT concept_id, status, confidence, note, revisit
                FROM concept_progress
                WHERE concept_id = ?
                """,
                (concept_id,),
            ).fetchone()
        return self._row_to_progress(row) if row else None

    def list_revisit(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT concept_id, status, confidence, note, revisit
                FROM concept_progress
                WHERE revisit = 1
                ORDER BY updated_at DESC, concept_id ASC
                """
            ).fetchall()
        return [self._row_to_progress(row) for row in rows]

    @staticmethod
    def _row_to_progress(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "conceptId": row["concept_id"],
            "status": row["status"],
            "confidence": row["confidence"],
            "note": row["note"],
            "revisit": bool(row["revisit"]),
        }
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_progress_store.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/learn_llm_api/progress_store.py apps/api/tests/test_progress_store.py
git commit -m "api: add local progress store"
```

## Task 8: FastAPI App Endpoints

**Files:**
- Create: `apps/api/learn_llm_api/app.py`
- Create: `apps/api/tests/test_app.py`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/test_app.py`:

```python
from fastapi.testclient import TestClient

from learn_llm_api.app import create_app


def test_health_endpoint():
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_tracks_endpoint_returns_curriculum():
    client = TestClient(create_app())

    response = client.get("/api/tracks")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["id"] == "data-and-tokens"
    assert body[0]["concepts"][0]["id"] == "bytes-unicode"


def test_progress_round_trip(tmp_path):
    app = create_app(database_path=tmp_path / "progress.sqlite")
    client = TestClient(app)

    response = client.put(
        "/api/progress/character-tokenization",
        json={
            "status": "in-progress",
            "confidence": 2,
            "note": "I need to revisit ids.",
            "revisit": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["conceptId"] == "character-tokenization"
    revisit = client.get("/api/revisit").json()
    assert revisit[0]["conceptId"] == "character-tokenization"
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_app.py -q
```

Expected: FAIL because `learn_llm_api.app` does not exist.

- [ ] **Step 3: Implement FastAPI app**

Create `apps/api/learn_llm_api/app.py`:

```python
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from learn_llm_api.content_loader import load_tracks
from learn_llm_api.progress_store import ProgressStore


class ProgressInput(BaseModel):
    status: str = Field(min_length=1)
    confidence: int = Field(ge=1, le=5)
    note: str = ""
    revisit: bool = False


def create_app(
    repo_root: Path | None = None,
    database_path: Path | None = None,
) -> FastAPI:
    root = repo_root or Path.cwd()
    store = ProgressStore(database_path or root / ".learn-llm" / "progress.sqlite")
    store.initialize()

    app = FastAPI(title="Learn LLM The Hard Way API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/tracks")
    def tracks() -> list[dict[str, Any]]:
        return load_tracks(root)

    @app.put("/api/progress/{concept_id}")
    def save_progress(concept_id: str, payload: ProgressInput) -> dict[str, Any]:
        store.save_progress(
            concept_id=concept_id,
            status=payload.status,
            confidence=payload.confidence,
            note=payload.note,
            revisit=payload.revisit,
        )
        progress = store.get_progress(concept_id)
        assert progress is not None
        return progress

    @app.get("/api/revisit")
    def revisit() -> list[dict[str, Any]]:
        return store.list_revisit()

    return app
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
source .venv/bin/activate
pytest apps/api/tests/test_app.py -q
```

Expected: PASS.

- [ ] **Step 5: Run all API tests**

Run:

```bash
source .venv/bin/activate
npm run api:test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/learn_llm_api/app.py apps/api/tests/test_app.py
git commit -m "api: expose curriculum and progress endpoints"
```

## Task 9: React App Shell And Tests

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/src/types.ts`
- Create: `apps/web/src/api.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/Dashboard.tsx`
- Create: `apps/web/src/components/ConceptWorkspace.tsx`
- Create: `apps/web/src/components/ProgressPanel.tsx`
- Create: `apps/web/src/components/TokenFlowSvg.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/src/__tests__/api.test.ts`
- Create: `apps/web/src/__tests__/App.test.tsx`
- Create: `apps/web/src/__tests__/TokenFlowSvg.test.tsx`

- [ ] **Step 1: Create web package**

Create `apps/web/package.json`:

```json
{
  "name": "@learn-llm-hard-way/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "@xyflow/react": "^12.6.4",
    "d3": "^7.9.0",
    "motion": "^12.10.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/d3": "^7.4.3",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.3",
    "jsdom": "^25.0.1",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 2: Create Vite config files**

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learn LLM The Hard Way</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `apps/web/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `apps/web/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write failing API test**

Create `apps/web/src/__tests__/api.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { fetchTracks, saveProgress } from "../api";

describe("api client", () => {
  it("fetches tracks from the local API", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ id: "data-and-tokens" }]))) );

    await expect(fetchTracks()).resolves.toEqual([{ id: "data-and-tokens" }]);
  });

  it("saves progress for a concept", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ conceptId: "bytes-unicode" })));
    vi.stubGlobal("fetch", fetchMock);

    await saveProgress("bytes-unicode", {
      status: "done",
      confidence: 4,
      note: "Clear",
      revisit: false
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/progress/bytes-unicode",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
```

- [ ] **Step 4: Run API test to verify failure**

Run:

```bash
npm --prefix apps/web install
npm --prefix apps/web test -- src/__tests__/api.test.ts
```

Expected: FAIL because `../api` does not exist.

- [ ] **Step 5: Implement API client and types**

Create `apps/web/src/types.ts`:

```ts
export interface Checkpoint {
  question: string;
  answer: string;
}

export interface Concept {
  id: string;
  title: string;
  order: number;
  prerequisites: string[];
  lessonPath: string;
  lessonMarkdown: string;
  lab: string | null;
  visual: string | null;
  checkpoint: Checkpoint;
  glossary: string[];
  status: string;
}

export interface Track {
  id: string;
  title: string;
  summary: string;
  order: number;
  concepts: Concept[];
}

export interface ProgressInput {
  status: string;
  confidence: number;
  note: string;
  revisit: boolean;
}
```

Create `apps/web/src/api.ts`:

```ts
import type { ProgressInput, Track } from "./types";

const API_BASE = "http://127.0.0.1:8000";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTracks(): Promise<Track[]> {
  return readJson<Track[]>(await fetch(`${API_BASE}/api/tracks`));
}

export async function saveProgress(conceptId: string, input: ProgressInput): Promise<unknown> {
  return readJson(
    await fetch(`${API_BASE}/api/progress/${conceptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}
```

- [ ] **Step 6: Run API test to verify pass**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/api.test.ts
```

Expected: PASS.

- [ ] **Step 7: Write failing component tests**

Create `apps/web/src/__tests__/TokenFlowSvg.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenFlowSvg } from "../components/TokenFlowSvg";

describe("TokenFlowSvg", () => {
  it("renders accessible token flow visual", () => {
    render(<TokenFlowSvg />);

    expect(screen.getByRole("img", { name: "Token flow from text to ids" })).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("tokens")).toBeInTheDocument();
    expect(screen.getByText("ids")).toBeInTheDocument();
  });
});
```

Create `apps/web/src/__tests__/App.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

const tracks = [
  {
    id: "data-and-tokens",
    title: "Data and Tokens",
    summary: "Start from bytes.",
    order: 1,
    concepts: [
      {
        id: "bytes-unicode",
        title: "Bytes and Unicode",
        order: 1,
        prerequisites: [],
        lessonPath: "content/lessons/data-and-tokens/bytes-unicode.md",
        lessonMarkdown: "# Bytes and Unicode\n\nLLMs do not see text the way people do.",
        lab: null,
        visual: "token-flow-svg",
        checkpoint: { question: "Why bytes?", answer: "Encoding." },
        glossary: ["byte"],
        status: "available"
      }
    ]
  }
];

describe("App", () => {
  it("loads curriculum and saves revisit note", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/tracks")) {
        return new Response(JSON.stringify(tracks));
      }
      if (url.includes("/api/progress/")) {
        return new Response(JSON.stringify({ conceptId: "bytes-unicode", ...(JSON.parse(String(init?.body)) as object) }));
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Learn LLM The Hard Way" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bytes and Unicode" }));
    await userEvent.type(screen.getByLabelText("Learning note"), "Need more practice");
    await userEvent.click(screen.getByLabelText("Add to revisit queue"));
    await userEvent.click(screen.getByRole("button", { name: "Save progress" }));

    await waitFor(() => {
      expect(screen.getByText("Progress saved")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 8: Run component tests to verify failure**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/TokenFlowSvg.test.tsx src/__tests__/App.test.tsx
```

Expected: FAIL because app components do not exist.

- [ ] **Step 9: Implement React components**

Create `apps/web/src/components/TokenFlowSvg.tsx`:

```tsx
export function TokenFlowSvg() {
  return (
    <svg className="token-flow" viewBox="0 0 640 180" role="img" aria-labelledby="token-flow-title token-flow-desc">
      <title id="token-flow-title">Token flow from text to ids</title>
      <desc id="token-flow-desc">Text becomes tokens, and tokens become integer ids before reaching a model.</desc>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="flow-node" transform="translate(48 54)">
        <rect width="120" height="72" rx="8" />
        <text x="60" y="42">text</text>
      </g>
      <path className="flow-arrow" d="M190 90 H275" markerEnd="url(#arrow)" />
      <g className="flow-node" transform="translate(294 54)">
        <rect width="120" height="72" rx="8" />
        <text x="60" y="42">tokens</text>
      </g>
      <path className="flow-arrow" d="M436 90 H521" markerEnd="url(#arrow)" />
      <g className="flow-node" transform="translate(540 54)">
        <rect width="72" height="72" rx="8" />
        <text x="36" y="42">ids</text>
      </g>
    </svg>
  );
}
```

Create `apps/web/src/components/Dashboard.tsx`:

```tsx
import type { Concept, Track } from "../types";

interface DashboardProps {
  tracks: Track[];
  selectedConceptId: string | null;
  onSelectConcept: (concept: Concept) => void;
}

export function Dashboard({ tracks, selectedConceptId, onSelectConcept }: DashboardProps) {
  return (
    <aside className="dashboard" aria-label="Learning tracks">
      <h2>Mission Path</h2>
      {tracks.map((track) => (
        <section key={track.id}>
          <h3>{track.title}</h3>
          <p>{track.summary}</p>
          <div className="concept-list">
            {track.concepts.map((concept) => (
              <button
                key={concept.id}
                className={concept.id === selectedConceptId ? "selected" : ""}
                type="button"
                onClick={() => onSelectConcept(concept)}
              >
                {concept.title}
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
```

Create `apps/web/src/components/ProgressPanel.tsx`:

```tsx
import { useState } from "react";
import { saveProgress } from "../api";

interface ProgressPanelProps {
  conceptId: string;
}

export function ProgressPanel({ conceptId }: ProgressPanelProps) {
  const [note, setNote] = useState("");
  const [revisit, setRevisit] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await saveProgress(conceptId, {
      status: revisit ? "confusing" : "in-progress",
      confidence: revisit ? 2 : 3,
      note,
      revisit
    });
    setSaved(true);
  }

  return (
    <section className="progress-panel" aria-label="Learning state">
      <label>
        Learning note
        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <label className="checkbox-row">
        <input checked={revisit} type="checkbox" onChange={(event) => setRevisit(event.target.checked)} />
        Add to revisit queue
      </label>
      <button type="button" onClick={handleSave}>Save progress</button>
      {saved ? <p role="status">Progress saved</p> : null}
    </section>
  );
}
```

Create `apps/web/src/components/ConceptWorkspace.tsx`:

```tsx
import type { Concept } from "../types";
import { ProgressPanel } from "./ProgressPanel";
import { TokenFlowSvg } from "./TokenFlowSvg";

interface ConceptWorkspaceProps {
  concept: Concept;
}

export function ConceptWorkspace({ concept }: ConceptWorkspaceProps) {
  return (
    <main className="workspace">
      <section className="lesson">
        <p className="eyebrow">Concept Workspace</p>
        <h2>{concept.title}</h2>
        <article>{concept.lessonMarkdown}</article>
      </section>
      <section className="visual-panel">
        <h3>Visual</h3>
        {concept.visual === "token-flow-svg" ? <TokenFlowSvg /> : <p>No visual for this concept yet.</p>}
      </section>
      <section className="checkpoint">
        <h3>Checkpoint</h3>
        <p>{concept.checkpoint.question}</p>
      </section>
      <ProgressPanel conceptId={concept.id} />
    </main>
  );
}
```

Create `apps/web/src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { fetchTracks } from "./api";
import { ConceptWorkspace } from "./components/ConceptWorkspace";
import { Dashboard } from "./components/Dashboard";
import type { Concept, Track } from "./types";

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks()
      .then((loadedTracks) => {
        setTracks(loadedTracks);
        setSelectedConcept(loadedTracks[0]?.concepts[0] ?? null);
      })
      .catch((unknownError: unknown) => {
        setError(unknownError instanceof Error ? unknownError.message : "Unknown error");
      });
  }, []);

  const conceptCount = useMemo(
    () => tracks.reduce((total, track) => total + track.concepts.length, 0),
    [tracks]
  );

  return (
    <div className="app-shell">
      <header>
        <p className="eyebrow">Local-first LLM curriculum</p>
        <h1>Learn LLM The Hard Way</h1>
        <p>{conceptCount} foundation concepts loaded.</p>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <div className="main-layout">
        <Dashboard
          tracks={tracks}
          selectedConceptId={selectedConcept?.id ?? null}
          onSelectConcept={setSelectedConcept}
        />
        {selectedConcept ? <ConceptWorkspace concept={selectedConcept} /> : <p>Loading curriculum...</p>}
      </div>
    </div>
  );
}
```

Create `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `apps/web/src/styles.css`:

```css
:root {
  color: #18212f;
  background: #f6f3ec;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
}

button,
textarea {
  font: inherit;
}

button {
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  background: #1f5f6f;
  color: white;
  cursor: pointer;
  transition-property: transform, background;
  transition-duration: 160ms;
}

button:active {
  transform: scale(0.96);
}

.app-shell {
  min-height: 100vh;
}

header {
  padding: 32px;
  background: #10272f;
  color: #f8fbfb;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1,
h2 {
  text-wrap: balance;
}

.eyebrow {
  margin-bottom: 8px;
  color: #cc7a4b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  padding: 24px;
}

.dashboard,
.workspace > section {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(28 40 54 / 10%);
  padding: 20px;
}

.concept-list {
  display: grid;
  gap: 8px;
}

.concept-list button {
  background: #dbe8e6;
  color: #18212f;
  text-align: left;
}

.concept-list button.selected {
  background: #1f5f6f;
  color: white;
}

.workspace {
  display: grid;
  gap: 16px;
}

.lesson article {
  white-space: pre-wrap;
  text-wrap: pretty;
}

.progress-panel {
  display: grid;
  gap: 12px;
}

.progress-panel textarea {
  display: block;
  min-height: 96px;
  width: 100%;
  margin-top: 8px;
  border: 1px solid #cbd5d8;
  border-radius: 8px;
  padding: 10px;
}

.checkbox-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.token-flow {
  width: 100%;
  max-width: 640px;
  color: #1f5f6f;
}

.flow-node rect {
  fill: #e9f2ef;
  stroke: #1f5f6f;
  stroke-width: 2;
}

.flow-node text {
  fill: #18212f;
  font-size: 20px;
  font-weight: 700;
  text-anchor: middle;
}

.flow-arrow {
  stroke: currentColor;
  stroke-width: 3;
  fill: none;
  stroke-dasharray: 8 8;
  animation: dash 1.8s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -32;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}

@media (max-width: 820px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 10: Run component tests to verify pass**

Run:

```bash
npm --prefix apps/web test -- src/__tests__/TokenFlowSvg.test.tsx src/__tests__/App.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Build web app**

Run:

```bash
npm --prefix apps/web run build
```

Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add apps/web
git commit -m "web: add phase one learning shell"
```

## Task 10: End-To-End Phase 1 Learning Path

**Files:**
- Create: `tests/e2e/phase1-learning-path.spec.ts`

- [ ] **Step 1: Write e2e acceptance test**

Create `tests/e2e/phase1-learning-path.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("learner can open first concept and mark it for revisit", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Learn LLM The Hard Way" })).toBeVisible();
  await page.getByRole("button", { name: "Bytes and Unicode" }).click();
  await expect(page.getByRole("heading", { name: "Bytes and Unicode" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Token flow from text to ids" })).toBeVisible();

  await page.getByLabel("Learning note").fill("I want to revisit Unicode byte sequences.");
  await page.getByLabel("Add to revisit queue").check();
  await page.getByRole("button", { name: "Save progress" }).click();

  await expect(page.getByText("Progress saved")).toBeVisible();
});
```

- [ ] **Step 2: Run e2e test after app/API implementation**

Run:

```bash
npx playwright install chromium
source .venv/bin/activate
npm run e2e
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/phase1-learning-path.spec.ts
git commit -m "test: add phase one learning path e2e"
```

## Task 11: Full Phase 1 Verification

**Files:**
- Modify only if verification reveals a defect in files created by earlier tasks.

- [ ] **Step 1: Run Python lab tests**

Run:

```bash
source .venv/bin/activate
npm run labs:test
```

Expected: PASS.

- [ ] **Step 2: Run API tests**

Run:

```bash
source .venv/bin/activate
npm run api:test
```

Expected: PASS.

- [ ] **Step 3: Run frontend tests**

Run:

```bash
npm run web:test
```

Expected: PASS.

- [ ] **Step 4: Run web build**

Run:

```bash
npm --prefix apps/web run build
```

Expected: PASS.

- [ ] **Step 5: Run e2e test**

Run:

```bash
source .venv/bin/activate
npm run e2e
```

Expected: PASS.

- [ ] **Step 6: Run repository status check**

Run:

```bash
git status --short
```

Expected: no unstaged or uncommitted source changes. Ignored local runtime folders such as `.venv`, `.learn-llm`, `node_modules`, `apps/web/node_modules`, `apps/web/dist`, and `artifacts` may exist but should not appear.

- [ ] **Step 7: Commit verification fixes if needed**

If any verification step required code changes:

```bash
git add <changed-files>
git commit -m "fix: stabilize phase one foundation"
```

If no changes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Monorepo layout: Task 1.
- Python tokenizer labs and tests: Tasks 3, 4, and 5.
- FastAPI local API layer: Tasks 6 and 8.
- SQLite progress model: Task 7.
- Versioned JSON/Markdown curriculum content: Task 2.
- React/TypeScript app shell: Task 9.
- Educational SVG visualization and reduced-motion handling: Task 9.
- Terminal-first lab execution and deterministic artifact: Task 5.
- End-to-end learning path: Task 10.
- Full verification: Task 11.

Intentional gaps for later plans:

- App-triggered lab execution.
- Full concept graph with React Flow.
- D3 charts beyond the first SVG visual.
- Neural network, transformer, chat, hallucination, tool-use, and RLHF modules.
- Gemini-generated production SVG assets.

Every code-producing step names exact files and includes concrete content.
