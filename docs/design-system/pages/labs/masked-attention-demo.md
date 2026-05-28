# Lab: `masked-attention-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`./attention-demo.md`](./attention-demo.md). Overrides below.

| Field   | Value                                                                 |
|---------|-----------------------------------------------------------------------|
| Lab id  | `masked-attention-demo`                                               |
| Concept | `masked-self-attention`                                               |
| Writer  | Same as `attention-demo` (parameterised by `lab_id`).                 |
| Viz key | `attention-map`                                                       |

## Differences from `attention-demo`

- The teaching focus is the **causal mask**. Upper-triangle cells in the
  attention heatmap should be visually distinct (use a hashed pattern or
  a separate "masked" colour ramp, not the same value-coloured scale).
- The `mask.blockedValue` is the string `"-inf"`. Render it as-is — don't
  silently substitute `0` for layout convenience.
- The "Lost in the middle" effect is not exercised by this lab — don't
  rationalise it in the copy.

## A11y

- Cells representing masked positions need an aria label like
  `"masked (causal)"`, not just a different colour.
- The heatmap legend must distinguish "weight" from "masked" entries.
