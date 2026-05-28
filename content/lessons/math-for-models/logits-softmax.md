# Logits and Softmax

When a language model finishes processing a sequence, it produces one number for every word in its vocabulary. Those numbers — the **logits** — say how strongly the model wants to predict each word as the next token. A 50,000-token vocab means 50,000 logits per step. But the model doesn't pick a word from logits directly; it converts them into a probability distribution first. That conversion is **softmax**, and it is the most important function in the network's output.

## What Logits Mean (and Don't)

Logits are unnormalised scores. A higher logit means "the model prefers this word more strongly relative to the others". Their absolute size is meaningless; their *differences* are what matter.

These are all the same prediction:

```
[2.0, 1.0, 0.5]
[12.0, 11.0, 10.5]
[-3.0, -4.0, -4.5]
```

The differences between scores are `1.0` and `0.5` in every case. Softmax cares only about differences.

## Softmax: From Scores to a Distribution

Softmax does two things at once: it makes every output positive, and it makes them sum to 1 so the result is a valid probability distribution.

```
softmax(x_i) = exp(x_i) / Σ_j exp(x_j)
```

In words: exponentiate every logit, then divide by the total. Working through `[2.0, 1.0, 0.5]`:

```
exp(2.0) ≈ 7.39
exp(1.0) ≈ 2.72
exp(0.5) ≈ 1.65
sum ≈ 11.76
softmax ≈ [0.628, 0.231, 0.140]
```

The largest logit gets the largest probability; the gap between probabilities depends on the *gaps between logits*, not their absolute values.

## Why Exponentiation, Not Just Normalisation?

You could just divide each logit by the sum, but that doesn't handle negatives and gives a much flatter distribution. The `exp(·)` does two crucial things:

1. **Force everything positive.** `exp(x)` is always positive even when `x` is negative, so the result is always a valid probability.
2. **Amplify gaps.** A logit gap of 2 becomes a probability ratio of `exp(2) ≈ 7.4`. Strong preferences become very strong probabilities — which is what we want from a confident model.

## Temperature: Sharpness Control

Divide every logit by a number `T` before softmax and you change how confident the distribution is.

- `T = 1`: standard softmax.
- `T < 1`: sharper — the top token's probability rises further.
- `T > 1`: flatter — probabilities spread out, increasing randomness.
- `T → 0`: collapses to picking the argmax deterministically.
- `T → ∞`: approaches uniform.

Temperature is the main knob for generation diversity. We'll use it in the sampling lesson.

> [!NOTE]
> Numerically, raw softmax can overflow when logits are large. Implementations subtract `max(logits)` from every logit first — this doesn't change the output (it's a constant shift, and softmax is shift-invariant) but keeps `exp(·)` in a safe range.

## What To Notice in the Experiment

- The three example logits `[2.0, 1.0, 0.5]` produce probabilities that sum to exactly 1.
- Adding 10 to every logit produces the same probabilities.
- Multiplying every logit by 2 (or dividing by 0.5) sharpens the distribution.

> [!TRY-THIS]
> Sweep the temperature from 0.5 to 2.0 in the Experiment tab and watch the probability bars rise and flatten. The same logits can produce a "decisive" or "uncertain" model just by changing one number — that's the knob behind every "creativity" slider in every LLM UI you've used.
