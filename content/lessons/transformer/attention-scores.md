# Attention Scores

Attention is the operation that put the "T" in GPT. Every token in the input gets to *look at* every other token and pull information from it, with the strength of each look learned from data. Strip away the multi-head, multi-layer scaffolding and the core is a small recipe of three matrices and one dot product. This lesson walks through that recipe.

## The Three Roles: Query, Key, Value

For each token's vector, the model produces three new vectors by multiplying it by three learned matrices:

- **Query (Q):** "What am I looking for?"
- **Key (K):** "What do I represent, for someone who's searching?"
- **Value (V):** "What information do I carry?"

If the token is `cat`, its Query might encode "I want to know my subject's verb"; its Key might advertise "I am a noun, mostly used as subject"; its Value might carry the dense meaning the model has built up for `cat`.

The shapes: if the model's hidden size is `d`, and there are `n` tokens in the sequence, then Q, K, V are each `n × d` matrices — one row per token.

## The Score Calculation

Every query gets compared against every key by a dot product. The result is an `n × n` matrix of compatibility scores:

```
scores = Q · K^T          # shape (n, n)
```

Row `i`, column `j` of `scores` is "how well does token `i`'s query match token `j`'s key?" — a large positive number means "very relevant".

Two scaling decisions matter:

1. **Divide by √d** before softmax. Without it, dot products of high-dimensional vectors get large, the softmax sharpens too much, and gradients vanish. The √d keeps scores in a stable range.
2. **Softmax row-wise.** Each row becomes a probability distribution over the sequence: "how much should token `i` attend to each other token, with weights summing to 1".

The output of the attention layer is:

```
output = softmax(Q · K^T / √d) · V          # shape (n, d)
```

Row `i` of `output` is a *weighted sum of value vectors*, weighted by how much token `i` attended to each other token.

## A Tiny Worked Example

Three tokens `[the, tiny, model]`, hidden size 2, identity Q/K/V matrices for clarity:

```
Q = K = V = [[1, 0],
             [0, 1],
             [1, 1]]

scores = Q · K^T = [[1, 0, 1],
                    [0, 1, 1],
                    [1, 1, 2]]

scaled = scores / √2 ≈ [[0.71, 0,    0.71],
                        [0,    0.71, 0.71],
                        [0.71, 0.71, 1.41]]

softmax(row 2) ≈ [0.21, 0.21, 0.58]
output[2]      = 0.21*V[0] + 0.21*V[1] + 0.58*V[2]
               = 0.21*[1,0] + 0.21*[0,1] + 0.58*[1,1]
               = [0.79, 0.79]
```

`model` looked mostly at itself (0.58 weight) and a little at each of `the` and `tiny`. Its new vector is a weighted blend of all three values.

## Multi-Head Attention in One Sentence

Real transformers run attention `H` times in parallel with different Q/K/V matrices, then concatenate the results. Each "head" learns to attend to a different relationship — subject-verb, pronoun-referent, adjective-noun — and the concatenation lets the model combine them.

> [!NOTE]
> Attention is permutation-invariant — shuffling the tokens shuffles the rows the same way, producing the same content. Word order has to come from somewhere else (positional encoding, next lesson).

## What To Notice in the Experiment

- The scores matrix is square — `n × n` for `n` tokens.
- Diagonal entries are usually large: a token's query matches its own key well.
- The softmax-normalised attention weights for any row sum to exactly 1.

> [!TRY-THIS]
> Open the attention-scores lab and inspect the per-row attention weights. Pick a row and ask "which other token did this token mostly look at?" That's the answer the model gives — and it's learned, not designed. Read about Masked Self-Attention next to see how this changes when the model is forbidden from looking at the future.
