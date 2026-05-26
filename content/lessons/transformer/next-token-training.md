# Next-Token Training

The base model objective is simple: given the context, assign high probability to the real next token.

Training compares predicted probabilities with the actual next token. The loss is high when the model assigns low probability to the correct token. An optimizer update nudges parameters so the correct token becomes more likely next time.

Phase 3 uses a tiny deterministic training loop. It is not powerful, but it exposes the shape of the loop: predict, measure loss, update, and inspect whether loss moved.

## What To Inspect

- Input-target examples.
- Predicted next-token probabilities.
- Loss before and after updates.
- Final top token choices.

## Checkpoint

Explain what the loss number says about the model's next-token prediction.
