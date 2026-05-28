# Lab: `character-tokenizer`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`../concept-workspace.md`](../concept-workspace.md). Overrides below.

| Field      | Value                                                          |
|------------|----------------------------------------------------------------|
| Lab id     | `character-tokenizer`                                          |
| Concept    | `character-tokenization`                                       |
| Writer     | `labs/python/llm_from_scratch/experiments/tokenization_demo.py:write_character_tokenizer_artifact` |
| Viz key    | `token-flow`                                                   |
| Input      | The deterministic string `"llm lab"` (7 characters).           |

## Artifact shape (top-level keys)

| Key               | Type                  | Use                                           |
|-------------------|-----------------------|-----------------------------------------------|
| `labId`           | string                | Always `"character-tokenizer"`                |
| `conceptId`       | string                | Always `"character-tokenization"`             |
| `input`           | string                | The tokenized text                            |
| `tokens`          | string[]              | One char per element; feeds `<TokenFlow>`     |
| `tokenIds`        | number[]              | Parallel to `tokens`                          |
| `vocabulary`      | Record<string, number>| char → id mapping                             |
| `vocabularySize`  | number                | Distinct character count                      |
| `decoded`         | string                | Round-trip result; must equal `input`         |
| `tradeoff`        | { sequenceLength, explanation } | Explainer card content              |

## Experiment-tab rules

- `tryDeriveRealProps("token-flow", concept, recentArtifacts)` returns
  `{ tokens: [{ id, text }] }` from this artifact when present.
- Don't add a second viz on the Experiment tab — `TokenFlow` carries the
  entire teaching for this concept.

## Lab-tab copy

- Lab card title is just `character-tokenizer` (mono).
- Body: "Runs the lab on a small deterministic input and writes the artifact
  to `artifacts/labs/`." — keep this copy uniform across labs.

## A11y

- Vocabulary table (when rendered) needs `<caption>` and column headers.
- The decoded string and input string should be aria-grouped so screen
  readers announce them as a round-trip pair.
