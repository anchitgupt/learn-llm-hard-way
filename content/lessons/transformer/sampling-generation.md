# Sampling And Generation

Generation repeats next-token prediction. The model produces logits, sampling chooses a token, the token is appended to the context, and the loop runs again.

Greedy decoding always picks the highest logit. Temperature changes how sharp or spread out the distribution is. Top-k restricts choices to the most likely candidates before sampling.

These controls are part of why the same model can feel deterministic, varied, focused, or unstable.

## What To Inspect

- Logits.
- Probabilities after temperature.
- Candidate tokens after top-k.
- The selected token at each generation step.

## Checkpoint

Explain the difference between greedy decoding and sampling with temperature.
