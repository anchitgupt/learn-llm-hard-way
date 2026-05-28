# Lab: `sampling-generation-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`./mini-training-demo.md`](./mini-training-demo.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `sampling-generation-demo`                                             |
| Concept | `sampling-generation`                                                  |
| Writer  | Shared mini-training writer (param `lab_id="sampling-generation-demo"`). |
| Viz key | `sampling-plot`                                                        |

## Aspect highlighted

- The relevant subtree is `artifact.generation = { prompt, settings,
  decisionTrace, generatedText }`.
- `decisionTrace` is one row per sampled step; each shows the context, the
  top-k candidates, and the chosen token. This is what the lesson refers
  to when it talks about "what the sampler did".

## Experiment-tab rules

- `realProps("sampling-plot", ...)` falls back to synthetic data for this
  artifact today. To wire it up: map `generation.decisionTrace[0].candidates`
  → `[{ token, probability }]` and `generation.decisionTrace[0].chosen` →
  `selectedToken`.

## Display tips

- The `settings` block (`temperature`, `topK`) must be rendered next to
  the decision trace; users have to be able to map the knob to the
  behaviour.
