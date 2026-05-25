# Dot Products

A dot product multiplies matching positions in two vectors, then adds those products.
It turns two same-length vectors into one score.

That score is a small but important bridge from raw numbers to model behavior. Similar
directions produce larger scores, opposite directions can reduce the score, and zero values
contribute nothing.

## What To Notice

- Both vectors must have the same length.
- Each dimension contributes separately before the final sum.
- Attention later uses dot-product scores to decide which tokens should influence each other.
