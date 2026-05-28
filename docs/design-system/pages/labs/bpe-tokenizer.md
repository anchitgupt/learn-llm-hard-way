# Lab: `bpe-tokenizer`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`../concept-workspace.md`](../concept-workspace.md). Overrides below.

| Field   | Value                                                            |
|---------|------------------------------------------------------------------|
| Lab id  | `bpe-tokenizer`                                                  |
| Concept | `byte-pair-encoding`                                             |
| Writer  | `labs/python/llm_from_scratch/experiments/tokenization_demo.py:write_bpe_tokenizer_artifact` |
| Viz key | `token-flow`                                                     |
| Input   | `"low lower lowest"` with 4 BPE merges (deterministic).          |

## Artifact shape

| Key             | Type             | Use                                              |
|-----------------|------------------|--------------------------------------------------|
| `labId`         | string           | `"bpe-tokenizer"`                                |
| `conceptId`     | string           | `"byte-pair-encoding"`                           |
| `input`         | string           | Source text                                      |
| `settings`      | { mergeCount }   | Hyperparameter trace                             |
| `initialTokens` | string[]         | Char-level start of BPE                          |
| `merges`        | MergeStep[]      | One row per merge: `{ step, pair, newToken, before, after }` |
| `tokens`        | string[]         | Final tokens; feeds `<TokenFlow>`                |
| `tradeoff`      | { initialLength, finalLength, explanation } | Sequence-length stat |

## Experiment-tab rules

- `realProps` returns `{ tokens: [{ id, text }] }` over the **final** tokens
  — not the intermediate merge steps. Don't change without updating tests.
- The merge trace is a separate teaching surface — render in a dedicated
  table on the Lab tab's artifact view, not on the Experiment tab.

## Specific copy

- The `tradeoff.explanation` is shipped from Python; do not paraphrase in
  the UI. Render verbatim.

## A11y

- Each merge step should be a `<li>` inside an ordered `<ol>` so screen
  readers can navigate them in order.
- Use `<kbd>`-styled spans for the pair and new-token mono text; the
  contrast must meet the AA chrome floor (3:1).
