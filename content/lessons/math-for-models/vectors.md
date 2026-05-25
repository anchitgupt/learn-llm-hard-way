# Vectors

An LLM cannot directly train on words as human-visible objects. It needs numbers.
A vector is the smallest useful idea here: an ordered list of numbers.

In future transformer lessons, vectors will represent token embeddings, hidden activations,
queries, keys, values, and logits. For now, treat a vector as a position or direction made
from numbers.

## What To Notice

- The order of values matters.
- Two vectors can be compared only when their dimensions line up.
- Vector operations produce the scores used by attention and token probabilities.
