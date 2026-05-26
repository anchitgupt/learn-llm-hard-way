# Transformer Block

A transformer block is a repeated unit that mixes information across tokens and then transforms each token representation.

In a tiny learning implementation, the block can be split into two visible stages:

1. Attention mixes information across positions.
2. A feed-forward transformation changes each token vector.

Large models add normalization, residual connections, many heads, and many layers. Phase 3 keeps the first implementation small so the computation remains inspectable.

## What To Inspect

- Input vectors.
- Attention output.
- Feed-forward output.
- Final block output.

## Checkpoint

Name the two main stages inside the tiny transformer block.
