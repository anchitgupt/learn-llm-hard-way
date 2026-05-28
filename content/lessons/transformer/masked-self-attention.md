# Masked Self-Attention

Plain attention lets every token see every other token. That works for tasks like classification, where the model reads the entire input first. But for *generation* — predicting the next token one at a time — every token must only see tokens to its left, never the ones it's trying to predict. Masked self-attention is the surgical change that makes generation possible.

## The Problem with Bidirectional Attention

Imagine you're training a model on the sentence `the cat sat on the mat`. The model's job is "given the first three tokens, predict the fourth". If attention is bidirectional, token `3` (`sat`) can look at token `5` (`mat`) and cheat — the answer is right there. The model would memorise the future rather than learn to predict it.

For training a generative model, we need every position to predict the *next* token while only seeing tokens at *previous* positions. That requires a constraint baked into attention itself.

## The Causal Mask

Before the row-wise softmax, we set every score for a "future" position to `-∞`:

```
raw scores (before mask):              after applying causal mask:
[[1.0, 0.5, 0.8],                       [[1.0, -∞,  -∞ ],
 [0.4, 1.2, 0.9],         →             [0.4, 1.2, -∞ ],
 [0.7, 0.3, 1.1]]                        [0.7, 0.3, 1.1]]
```

`-∞` becomes `0` after `exp(·)`, so the softmax effectively assigns zero attention to those positions. Each token's output is a weighted sum of *only* the value vectors of itself and earlier tokens.

The result: row 0 attends only to token 0. Row 1 attends to tokens 0 and 1. Row 2 attends to tokens 0, 1, and 2. The triangle of allowed attentions is *lower-triangular*.

## Why This Lets Us Train on All Positions at Once

Without the mask, you'd train a generative model one token at a time: forward pass through the first token, predict the second, gradient step; forward through tokens 1 and 2, predict 3, step; and so on. Slow.

With the causal mask, you do *one* forward pass through the whole sequence and predict every next-token target in parallel. Position `i`'s output predicts token `i+1`, and the mask guarantees position `i` didn't peek at token `i+1` (or anything beyond) while producing that prediction. **Training is now O(1) forward passes per sequence instead of O(n).**

> [!NOTE]
> The mask is a property of the attention pattern, not of the loss or the architecture. You can train the same model on the same data with bidirectional masking (BERT-style) for understanding tasks and causal masking (GPT-style) for generation — same parameters, different mask, different abilities.

## A Subtle Failure Mode

What happens to the *first* token? Its row in the masked scores matrix has only one non-`-∞` entry: its own. Softmax of a single entry is 1. So the first token's output is *exactly* its own value vector — no mixing with anything. The model has no choice but to predict the second token using only what's encoded in the first token's representation. This is why pretraining loss is hardest on early positions.

## What To Notice in the Experiment

- The mask table is lower-triangular with `1`s allowed and `0`s blocked (or `-∞` in the raw scores).
- The softmax-normalised attention weights still sum to 1 row-by-row — they just sum over a shorter span.
- Token 0's output equals `V[0]` exactly.

> [!TRY-THIS]
> Open the masked-attention lab and pick the last token. Its row should have non-zero attention to *every* prior token but zero to the diagonal entries above it. Now imagine training without the mask — find the bug in your head before reading the next paragraph. (The bug: it would cheat. Every token would attend to its target token, drive the loss to ~0 in one step, and learn nothing useful.)
