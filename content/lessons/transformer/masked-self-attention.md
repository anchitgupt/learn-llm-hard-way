# Masked Self-Attention

Self-attention lets every token compare itself with other tokens in the same sequence. A decoder language model must not look at future tokens while learning to predict the next token.

A causal mask blocks future positions before softmax. The current token can attend to itself and earlier tokens, but not to tokens on its right. This keeps training honest: the model learns from available context instead of seeing the answer.

## What To Inspect

- The unmasked score table.
- The causal mask.
- Scores after future positions are blocked.
- Attention weights after masking.

## Checkpoint

Explain what would go wrong if a next-token model could attend to future tokens during training.
