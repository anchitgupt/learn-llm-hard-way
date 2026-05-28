# Lab: `transformer-block-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                                 |
|---------|-----------------------------------------------------------------------|
| Lab id  | `transformer-block-demo`                                              |
| Concept | `transformer-block`                                                   |
| Writer  | Shared transformer writer (param `lab_id="transformer-block-demo"`).  |
| Viz key | none on this concept                                                  |

## Artifact shape

Same as `attention-demo`. The relevant subtree:

```
artifact.block = object   // per-token output vectors from the full block
```

## Lab-tab notes

- The block output shows the residual-stream effect end-to-end. The lesson
  argues the output's L2 norm stays bounded across blocks — surface the
  norm alongside the raw vectors when displaying.

## A11y

- Multiple parallel vectors (one per token) need clear row labels.
