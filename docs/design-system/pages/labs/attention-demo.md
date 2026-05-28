# Lab: `attention-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                              |
|---------|--------------------------------------------------------------------|
| Lab id  | `attention-demo`                                                   |
| Concept | `attention-scores`                                                 |
| Writer  | `labs/python/llm_from_scratch/experiments/transformer_demo.py:write_transformer_demo_artifact` |
| Viz key | `attention-map`                                                    |
| Input   | Fixed token list `["the", "tiny", "model"]`.                       |

## Artifact shape

| Key         | Type                            | Use                                       |
|-------------|---------------------------------|-------------------------------------------|
| `tokens`    | string[]                        | Row/column labels                         |
| `attention` | `{ tokens, scores, weights, context }` | Heatmap source                     |
| `mask`      | `{ table, blockedValue }`       | Mask visualisation (this lab: unmasked)   |
| `positions` | `{ vectors }`                   | Per-token positional vectors              |
| `block`     | object                          | Transformer-block trace (extra context)   |

## Experiment-tab rules

- `realProps("attention-map", ...)` derives `{ data: { tokens, scores } }`
  from `artifact.attention.{tokens, weights}` (note: maps `weights` →
  `scores` for the `AttentionMatrix` type).
- The heatmap must show the diagonal as the brightest cells (each token's
  query matches its own key); if you see a faded diagonal, the input
  shape is wrong.

## Lab-tab notes

- Lab card copy is the uniform Run-lab text.
- The artifact is shared with three sibling labs (`masked-attention-demo`,
  `positional-encoding-demo`, `transformer-block-demo`) — same writer
  parameterised by `lab_id`. Each lab id picks the relevant lens.

## A11y

- Heatmap requires both colour AND numeric labels in the cell tooltip.
  Don't ship a colour-only heatmap.
- The legend must include the score range numerically.
