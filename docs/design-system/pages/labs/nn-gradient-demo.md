# Lab: `nn-gradient-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                            |
|---------|------------------------------------------------------------------|
| Lab id  | `nn-gradient-demo`                                               |
| Concept | `scalar-gradients`                                               |
| Writer  | `labs/python/llm_from_scratch/experiments/nn_demo.py:write_nn_demo_artifact` |
| Viz key | none on this concept                                             |

## Artifact shape

| Key              | Type   | Use                                          |
|------------------|--------|----------------------------------------------|
| `input`          | number | Training input `x` (2.0)                     |
| `target`         | number | Training target `y` (4.0)                    |
| `beforeLoss`     | number | Loss before the update                       |
| `afterLoss`      | number | Loss after one step (should be smaller)      |
| `weightGradient` | number | dL/dw                                        |
| `biasGradient`   | number | dL/db                                        |
| `updatedWeight`  | number | Post-step parameter                          |
| `updatedBias`    | number | Post-step parameter                          |

## Lab-tab notes

- The writer is shared with `nn-tiny-linear-demo` — see that page; the
  artifact key set is identical.

## Display tips

- Display the before/after loss side by side with a delta column so users
  see the descent direction. Use `tabular-nums` for the numbers.
- Use a downward-trending status colour (success green) only when
  `afterLoss < beforeLoss`. Use warning yellow when it doesn't (debug hint).

## A11y

- Numeric grids must include row and column headers (a `<table>` with
  proper `<th>` scopes, not a `<div>` grid).
