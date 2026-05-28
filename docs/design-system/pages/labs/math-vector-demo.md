# Lab: `math-vector-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                              |
|---------|--------------------------------------------------------------------|
| Lab id  | `math-vector-demo`                                                 |
| Concept | `vectors` (also covers `dot-products` and `logits-softmax`)        |
| Writer  | `labs/python/llm_from_scratch/experiments/math_demo.py:write_math_demo_artifact` |
| Viz key | none (no `visual` field on the linked concept; Experiment tab empty) |

## Artifact shape

| Key                 | Type      | Use                                |
|---------------------|-----------|------------------------------------|
| `leftVector`        | number[]  | `[1, 2, 3]`                        |
| `rightVector`       | number[]  | `[4, 5, 6]`                        |
| `dotProduct`        | number    | Result of `leftVector · rightVector` |
| `cosineSimilarity`  | number    | Bounded `[-1, 1]`                  |
| `softmax`           | `{ logits, probabilities }` | One distribution to show softmax mechanics |
| `conceptIds`        | string[]  | Multi-concept attribution          |

## Lab-tab notes

- This is one of two labs (with `math-softmax-demo`) that share the same
  writer — the artifact pulled by `runLab("math-vector-demo")` is identical
  to `runLab("math-softmax-demo")`. The lab ids are aliases.
- The Lab tab's "See the latest output in Artifacts" link is the only
  navigation off this surface — keep it.

## A11y

- Number arrays should be rendered as `tabular-nums` so column widths stay
  aligned across rows.
- Probability bars (if a viz is added in future) must include a text label
  per bar — colour alone never carries the value.
