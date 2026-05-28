# Lab: `mini-training-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `mini-training-demo`                                                   |
| Concept | `next-token-training`                                                  |
| Writer  | `labs/python/llm_from_scratch/experiments/mini_training_demo.py:write_mini_training_demo_artifact` |
| Viz key | `loss-curve`                                                           |
| Input   | The string `"llm lab"` with character vocab; 5 single-token training steps. |

## Artifact shape

| Key           | Type                              | Use                                       |
|---------------|-----------------------------------|-------------------------------------------|
| `dataset`     | `{ text, vocabulary, encoded, examples }` | The packed training data         |
| `training`    | `{ targetToken, lossHistory, finalLogits, finalProbabilities }` | Loss curve + post-train distribution |
| `generation`  | `{ prompt, settings, decisionTrace, generatedText }` | Sampling trace          |
| `comparison`  | `{ basePrompt, baseCompletion, assistantPrompt, assistantFormatted }` | Base vs assistant snippets |
| `failure`     | `{ prompt, modelOutput, expectedFact, explanation }` | Hallucination demo       |

## Experiment-tab rules

- `realProps("loss-curve", ...)` derives `{ series: [{ label: "train",
  values: training.lossHistory }], showRollingMean: true }`.
- The loss curve must show a monotone decrease; if it doesn't, the
  artifact is broken or the training script regressed.

## Lab-tab notes

- The four sibling labs (`mini-training-demo`, `sampling-generation-demo`,
  `base-vs-assistant-demo`, `factuality-failure-demo`) all share this
  writer and produce the same artifact. The lab id only selects which
  *aspect* to teach with.
