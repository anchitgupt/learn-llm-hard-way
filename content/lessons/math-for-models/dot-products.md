# Dot Products

A dot product takes two vectors of the same length and produces a single number. Everything about transformer attention — the Q · K of "queries times keys" — is one giant tower of dot products. Learn what they measure and the rest of the architecture stops being magic.

## Mechanically: Multiply, Then Sum

```
[1, 2, 3] · [4, 5, 6] = 1*4 + 2*5 + 3*6 = 32
```

That's it. Two vectors, the same length, you multiply component by component and add the results. The output is a scalar.

If the vectors live in code as Python lists, the dot product is one line:

```python
def dot(a, b):
    return sum(x * y for x, y in zip(a, b))
```

This trivial operation, repeated billions of times, is the throughput bottleneck of modern AI hardware. GPUs and TPUs exist because dot products are so embarrassingly parallel.

## Geometrically: Similarity

The dot product has a second meaning that matters more than the formula:

```
a · b = ||a|| * ||b|| * cos(angle between a and b)
```

The factor that depends on the angle is what we care about.

- Two vectors pointing the **same direction** → `cos(0) = 1` → maximally positive dot product.
- Two vectors at right angles → `cos(90°) = 0` → dot product is zero.
- Two vectors pointing **opposite directions** → `cos(180°) = -1` → maximally negative dot product.

In short: the dot product is large and positive when two vectors are *similar in direction*, near zero when they're *unrelated*, and negative when they *disagree*. This is exactly what we want from a similarity score.

## Cosine Similarity: Strip the Magnitudes

When you want pure direction-based similarity — independent of how "long" each vector happens to be — divide the dot product by both norms:

```
cosine(a, b) = (a · b) / (||a|| * ||b||)
```

That formula collapses to the cosine of the angle. The result lives in `[-1, 1]`, and it's the metric everyone uses for "are these embeddings near each other?"

> [!TIP]
> When transformer attention computes `Q · K`, those vectors are usually scaled to similar magnitudes anyway (that's what layer normalisation does upstream). So the raw dot product behaves a lot like cosine similarity in practice, while being a single multiply-add per pair — cheap on every accelerator.

## What To Notice in the Experiment

- Two parallel vectors of equal length produce a dot product equal to their length squared.
- Two perpendicular vectors produce zero, no matter how long they are.
- Cosine similarity reports `1` for parallel, `0` for perpendicular, and `-1` for anti-parallel — independent of vector magnitudes.

> [!TRY-THIS]
> Compute the dot product and cosine similarity of `[1, 0]` with `[1, 0]`, `[0, 1]`, and `[-1, 0]`. The numbers should tell a story: "identical", "unrelated", "opposite". That story is exactly what attention will use to decide which tokens look at which.
