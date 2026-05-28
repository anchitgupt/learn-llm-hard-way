# Lab: `nn-tiny-linear-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                                |
|---------|----------------------------------------------------------------------|
| Lab id  | `nn-tiny-linear-demo`                                                |
| Concept | `tiny-linear-model`                                                  |
| Writer  | `labs/python/llm_from_scratch/experiments/nn_demo.py:write_nn_demo_artifact` |
| Viz key | none on this concept                                                 |

## Artifact shape

Identical to [nn-gradient-demo](./nn-gradient-demo.md). The same writer
returns the same keys; the two lab ids exist so concept pages can each
label their Run-lab CTA after the right concept.

## Differences from `nn-gradient-demo`

- This lab is bound to a different concept in the content tree, so the
  Run-lab button on `/concepts/tiny-linear-model?tab=lab` triggers it.
- The artifact bytes that hit disk and the post-run UI are identical
  between the two labs. **Don't** add a synthetic "tiny linear" branch in
  the writer to differentiate them; if differentiation matters someday,
  add a second writer.

## A11y

- Same as `nn-gradient-demo`.
