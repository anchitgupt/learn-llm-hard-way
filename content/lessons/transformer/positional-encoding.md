# Positional Encoding

Attention compares vectors, but comparison alone does not say where a token appears. Without positional information, the sequence can look too much like a set of token vectors.

Positional encodings add a position-specific pattern to each token vector. Tiny demos can use fixed sinusoidal values so the learner can inspect the numbers directly.

## What To Inspect

- Token vectors before position is added.
- Position vectors.
- Token-plus-position vectors.
- How different positions receive different numeric patterns.

## Checkpoint

Explain why the same token should have a different representation at different sequence positions.
