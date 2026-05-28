# Lab: `math-softmax-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                              |
|---------|--------------------------------------------------------------------|
| Lab id  | `math-softmax-demo`                                                |
| Concept | `logits-softmax`                                                   |
| Writer  | `labs/python/llm_from_scratch/experiments/math_demo.py:write_math_demo_artifact` |
| Viz key | `sampling-plot` (when the concept's `visual` is set; otherwise text-only) |

## Artifact shape

Same writer as `math-vector-demo` — see that page for the full key list.
The relevant subtree for this lab is:

```
artifact.softmax = {
  logits: number[],          // [1.0, 2.0, 3.0]
  probabilities: number[]    // summed to 1.0
}
```

## Experiment-tab rules

- `realProps` doesn't currently emit a sampling-plot derivation for this
  artifact shape — the synthetic three-candidate demo is shown instead. If
  you wire it up, map `softmax.logits` → candidate tokens labelled "0", "1",
  "2" and `softmax.probabilities` → their probability values.

## Lab-tab notes

- Lab card body text and Run button are identical to every other lab. The
  uniform Run UX is intentional — don't add lab-specific copy here.

## A11y

- When tabular probability values are rendered, use `tabular-nums` and
  right-align the numeric column.
