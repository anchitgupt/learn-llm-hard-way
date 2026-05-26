# Attention Scores

Attention starts with a simple question: for this token, which earlier token vectors matter most?

A query vector from the current token is compared with key vectors from tokens in the context. The comparison is usually a dot product. The raw dot products are attention scores. Softmax then turns those scores into weights, and the weights mix value vectors into a new context-aware vector.

This is the first bridge from Phase 2 math to a transformer. Dot products become scores, softmax becomes weights, and weighted sums become information flow between tokens.

## What To Inspect

- Query and key vectors.
- Raw dot-product scores.
- Softmax attention weights.
- The final weighted value vector.

## Checkpoint

Explain why attention scores are not probabilities until softmax is applied.
