# Phase 3: Mini LLM

Phase 3 connects the earlier foundations to the core of a tiny language model.

## Goal

Build a concrete mental model for:

- Dot-product attention.
- Masked self-attention.
- Positional encoding.
- Transformer blocks.
- Dataset packing for next-token prediction.
- Tiny local training loops.
- Sampling and generation.
- Base model behavior versus assistant-style behavior.
- Factuality failures and hallucination limits.

## Concepts

| Concept | Focus |
| --- | --- |
| [Transformer Track](../../content/concepts/transformer.json) | The ordered Phase 3 concept graph. |

## Lessons

| Lesson | Focus |
| --- | --- |
| [Attention Scores](../../content/lessons/transformer/attention-scores.md) | Query-key scores, softmax weights, and value mixing. |
| [Masked Self-Attention](../../content/lessons/transformer/masked-self-attention.md) | Why decoder models cannot look at future tokens. |
| [Positional Encoding](../../content/lessons/transformer/positional-encoding.md) | How order enters attention-based models. |
| [Transformer Block](../../content/lessons/transformer/transformer-block.md) | Attention plus feed-forward transformation. |
| [Dataset Packing](../../content/lessons/transformer/dataset-packing.md) | Turning token streams into input-target rows. |
| [Next-Token Training](../../content/lessons/transformer/next-token-training.md) | Predict, measure loss, update, inspect. |
| [Sampling And Generation](../../content/lessons/transformer/sampling-generation.md) | Greedy, temperature, and top-k generation controls. |
| [Base Model Versus Assistant](../../content/lessons/transformer/base-vs-assistant.md) | Completion behavior versus role-shaped assistant behavior. |
| [Factuality Failures](../../content/lessons/transformer/factuality-failures.md) | Why fluent text can still be unsupported or false. |

## Labs

Phase 3 labs are designed to produce small local JSON artifacts:

- Attention tables.
- Causal masks.
- Position vectors.
- Transformer-block traces.
- Packed input-target examples.
- Loss histories.
- Generated samples.
- Base-versus-assistant comparisons.
- Factuality failure examples.

The app only runs allowlisted deterministic demos. Larger Colab/GPU experiments remain optional extension work.

## App Flow

Use the learning cockpit to:

1. Open the Transformer track.
2. Start with Attention Scores.
3. Run the matching lab.
4. Inspect the generated artifact.
5. Answer the checkpoint.
6. Save low-confidence topics to the missed-topic queue.

## Verification

Phase 3 is implemented incrementally. Use [../run.md](../run.md) for the project verification commands.
