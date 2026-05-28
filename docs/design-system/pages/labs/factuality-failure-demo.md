# Lab: `factuality-failure-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`./mini-training-demo.md`](./mini-training-demo.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `factuality-failure-demo`                                              |
| Concept | `factuality-failures`                                                  |
| Writer  | Shared mini-training writer (param `lab_id="factuality-failure-demo"`). |
| Viz key | none on this concept                                                   |

## Aspect highlighted

- The relevant subtree is `artifact.failure = { prompt, modelOutput,
  expectedFact, explanation }`. This one row is a worked example of the
  failure mode the lesson teaches.

## Display tips

- Use the same visual pattern as a `<FailureCard>` on `/failures`: prompt
  as title, model output muted, expected fact + explanation revealed.
- Don't add a "Try again" or "Re-run" button on the artifact card — this
  artifact is deterministic; re-running produces identical output.

## Cross-reference

- The `/failures` Failure Museum is the curated catalogue; this lab is the
  in-context single-example version. The two surfaces should never display
  the same failure side by side — link out, don't duplicate.
