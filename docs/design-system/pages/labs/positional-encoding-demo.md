# Lab: `positional-encoding-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `positional-encoding-demo`                                             |
| Concept | `positional-encoding`                                                  |
| Writer  | Shared transformer writer (param `lab_id="positional-encoding-demo"`). |
| Viz key | none on this concept (sinusoidal vectors render as a numeric table)    |

## Artifact shape

Same as `attention-demo`. The relevant subtree for this lab is:

```
artifact.positions = {
  vectors: number[][]   // one row per token, 2-dim positional encoding
}
```

## Lab-tab notes

- The 2-dimensional positional vectors are intentionally tiny so the
  numeric table fits without scrolling. If the demo is ever rescaled to
  a higher dimension, swap the table for a heatmap of `[positions × dims]`.

## A11y

- Numeric tables need `<th scope>` headers. The sinusoidal values are
  bounded `[-1, 1]`; format as fixed-3-decimal so widths align.
