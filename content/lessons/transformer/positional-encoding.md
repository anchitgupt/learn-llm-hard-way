# Positional Encoding

Attention has a strange property: it's *permutation-invariant*. Shuffle the input tokens and the attention output shuffles the same way — but the underlying content is identical. The model literally cannot tell `dog bites man` from `man bites dog`. Positional encoding is how we inject word order back into the input so the model can use it.

## The Idea

Before the first attention layer, add a position-dependent vector to each token's embedding. Token `i` gets the position vector for slot `i` added to whatever embedding the tokenizer produced. Now two identical tokens at different positions have different vectors — and the model can learn to use that difference.

```
input[i] = token_embedding[i] + positional_encoding[i]
```

The positional encoding for slot `i` has the same dimensionality `d` as the token embeddings. The choice of *which vectors* depends on the design.

## Sinusoidal Encodings (The Original)

The original transformer paper used a deterministic function — no learned parameters. For position `pos` and dimension `2k`:

```
PE[pos, 2k]   = sin(pos / 10000^(2k/d))
PE[pos, 2k+1] = cos(pos / 10000^(2k/d))
```

That looks ugly but does something clean: each dimension oscillates at a different frequency. Low dimensions vary slowly (one full cycle takes thousands of positions); high dimensions vary fast (one cycle every couple of positions). The combination lets the model recover *both* absolute position (where am I?) and relative offsets (am I two slots after a noun?).

A bonus: sinusoidal encodings extend to sequences longer than what you trained on, because the function is defined for any `pos`. Learned positional embeddings can't — they only know the slots they've seen.

## Learned Positional Embeddings

Modern alternatives:

- **Learned absolute embeddings.** A `max_seq_len × d` table, randomly initialised, learned via backprop. Used by BERT and GPT-2.
- **Rotary Positional Embeddings (RoPE).** Used by LLaMA and most modern models. Instead of adding a position vector, it *rotates* the query and key vectors by an angle proportional to position. The dot product `Q · K` then automatically becomes a function of *relative* offset, with elegant extrapolation properties.
- **ALiBi.** Adds a position-dependent linear bias directly to attention scores, no embedding table.

Each scheme is one design choice — same network, different positional signal — with different tradeoffs for sequence-length generalisation.

## Why Any of This Works

Once positions are encoded as vectors, the model can *learn* to use them. A specific neuron in some attention head might end up learning "attend strongly to the token 5 positions before me" by leveraging the differences in positional vectors. The encoding doesn't tell the model what positions mean; it gives the model a stable signal so it can figure out what to do with positions during training.

> [!TIP]
> If you're picking a positional scheme for your own model: RoPE is the safe modern default. Sinusoidal is fine for didactic clarity. Learned absolute is brittle on long sequences. ALiBi is the simplest to implement.

## What To Notice in the Experiment

- The sinusoidal encoding for position 0 is `[0, 1, 0, 1, ...]` — sin starts at 0, cos at 1.
- Adjacent positions have nearly-identical encodings; positions far apart differ a lot.
- The values stay bounded in `[-1, 1]` regardless of sequence length.

> [!TRY-THIS]
> Plot the first dimension of the sinusoidal encoding across positions 0 to 100. You should see a slow sine wave. Then plot a deeper dimension. Faster wave. The model has multiple "rulers" of different lengths to measure position with — and it can pick whichever it needs for each attention head.
