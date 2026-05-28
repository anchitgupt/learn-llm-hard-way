# Transformer Block

A transformer is just a stack of identical blocks. Knowing what's in one block tells you what a 24-layer or 96-layer model is doing — the depth just repeats the same pattern. Each block has two sub-layers (attention, then a feed-forward network), wrapped in residual connections and layer normalisation. This lesson walks through one block top to bottom.

## The Anatomy

A modern transformer block does this:

```
x' = x + Attention(LayerNorm(x))
y  = x' + FFN(LayerNorm(x'))
```

Two sub-layers. Each is wrapped in:

1. **LayerNorm** before — normalises features so the sub-layer sees a well-scaled input.
2. **Residual connection** around — adds the sub-layer's output back to its input.

That's it. Every modern decoder-only transformer (GPT, LLaMA, Mistral, Claude) is some variant of this block stacked 24, 32, 80 times.

## Why LayerNorm Comes Before

Older designs ("post-norm") put LayerNorm *after* each sub-layer. The "pre-norm" variant above (LayerNorm first, then sub-layer, then residual) is more stable to train. It keeps the residual stream's scale bounded while letting each sub-layer specialise.

Layer normalisation rescales a vector so its mean is 0 and its variance is 1, then applies a learned scale and shift:

```
LayerNorm(x) = γ * ((x - mean(x)) / std(x)) + β
```

The learned `γ` and `β` are per-feature, so the network can recover any scaling it wants — the normalisation is a *floor*, not a ceiling.

## The Feed-Forward Network

The "FFN" is a two-layer MLP applied independently to each token's vector:

```
FFN(x) = W2 · activation(W1 · x + b1) + b2
```

- `W1` projects up: hidden size `d` → `4d` (a typical ratio).
- An elementwise activation (GELU, SwiGLU) introduces nonlinearity.
- `W2` projects back down: `4d` → `d`.

The intuition: the attention layer mixes information *across* tokens; the FFN computes nonlinear transformations *within* each token. Attention is "who do I listen to"; FFN is "now what do I do with that".

Almost all of the model's parameters live in the FFNs — they're 8× the attention parameters in most modern designs.

## Residual Connections: The Information Highway

Adding `x` back after each sub-layer (the `+ x` in the equations) is what makes deep models trainable. Without residuals, gradients have to flow back through dozens of layers of nonlinear transformations, and they shrink to zero (vanishing gradients) before they reach early layers. With residuals, every layer has a direct "highway" backwards to the loss; gradients flow easily.

Equally important conceptually: each block doesn't have to *replace* its input with a new representation. It just has to add a useful *delta* — a small refinement. Block 1 might add positional information; block 10 might add syntactic structure; block 30 might refine semantics. The residual stream is the running sum of all these contributions.

> [!NOTE]
> The same block, repeated many times, is enough. There is no architectural recipe like "shallow layers handle syntax, deep layers handle semantics" baked into the design — the model learns to differentiate the layers' roles during training.

## What To Notice in the Experiment

- The output shape of a block equals the input shape — every block has the same I/O signature, which is what lets you stack them.
- The residual stream's L2 norm stays roughly constant across blocks, thanks to LayerNorm.
- Replacing the FFN with the identity (skip it) gradually degrades the model; replacing attention is much worse.

> [!TRY-THIS]
> In the transformer-block lab, look at the output norm before and after the FFN. The residual addition keeps it small. Now imagine removing the residual: gradients during backprop would have to thread through 24 LayerNorms and 24 activations. They wouldn't.
