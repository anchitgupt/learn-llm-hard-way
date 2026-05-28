# Scalar Gradients

Before you can train a transformer you need to know how training works at all, and the cleanest place to see it is with one scalar variable, one scalar output, and one loss. Strip the matrices away and the whole story of gradient descent is: *which way should I nudge this number to make the loss smaller, and by how much?*

## The Loop in Plain English

Every gradient-descent step is the same three operations:

1. **Forward pass.** Plug the current parameter into the model. Compute the output. Compute the loss.
2. **Backward pass.** Compute how the loss changes when the parameter changes — that's the gradient.
3. **Update.** Subtract `learning_rate * gradient` from the parameter. The loss goes down.

The forward pass is just normal arithmetic. The backward pass is what calculus gives us: a recipe for "if I wiggle x by ε, what happens to y".

## A Worked Example

Take the loss `L(w) = (w - 3)²`. The optimal `w` is obviously 3; let's see how gradient descent finds it from a guess of `w = 0`.

Forward at `w = 0`: `L = (0 - 3)² = 9`. The model is wrong by a lot.

The gradient of `L` with respect to `w` is `dL/dw = 2(w - 3)`. At `w = 0`, that's `2 * (-3) = -6`. The sign tells us *which direction* moves the loss down (negative gradient → increase `w`); the magnitude tells us *how steep* the descent is right here.

Update with learning rate `0.1`:

```
w_new = w_old - 0.1 * (-6) = 0 + 0.6 = 0.6
```

Next forward pass at `w = 0.6`: `L = (0.6 - 3)² = 5.76`. Lower. Gradient now: `2 * (0.6 - 3) = -4.8`. Update: `w_new = 0.6 + 0.48 = 1.08`. And so on. The loss shrinks each step until `w ≈ 3`.

## Why the Learning Rate Matters

The learning rate is the only knob in this loop that isn't determined by the math.

- Too small: each step barely moves; convergence is glacial.
- Too large: each step overshoots and the loss oscillates or explodes.
- "Right": the loss decreases smoothly each step.

Modern optimisers (Adam, AdamW) auto-tune effective learning rates per parameter using running estimates of the gradient's variance. The plain vanilla version in this lesson is what they all started from.

> [!TIP]
> The gradient's *sign* tells you direction; its *magnitude* tells you slope. If the gradient is large at a step, the loss surface is steep there and a smaller learning rate is safer. If the gradient shrinks, you're near a minimum.

## Where the Chain Rule Comes In

A real network is many functions composed: `loss(output(hidden(input, params)))`. The chain rule says you can get the total gradient by multiplying the local gradients of each step. Backpropagation is exactly this: compute the gradient at the output, then propagate it backwards through every operation, multiplying as you go. The next lesson does it for a one-neuron model so you can see the chain in action.

## What To Notice in the Experiment

- The loss strictly decreases as long as the learning rate is "small enough".
- The gradient's magnitude shrinks near the minimum.
- Doubling the learning rate halves the number of steps — until it overshoots.

> [!TRY-THIS]
> In the gradient demo, change the starting `w` to 6 instead of 0 and watch the gradient flip sign. Then try a learning rate of 2 — the loss will oscillate or grow. The two failure modes (too slow, too fast) are the two ways every training run fails in production.
