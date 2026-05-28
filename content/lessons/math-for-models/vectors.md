# Vectors

A vector is a list of numbers. That's the whole definition. The reason it deserves a lesson is that this list of numbers is how every layer of a neural network represents *meaning*. A word, a pixel, an audio frame, a chess position — every input the model touches will end up as a vector before any learning happens to it.

## Three Operations You Need

You don't need linear algebra to follow this course. You need three operations.

**Addition.** Two vectors of the same length add component-wise.

```
[1, 2, 3] + [4, 5, 6] = [5, 7, 9]
```

This is how the model "combines" two pieces of information: position with token, context with content, residual with update.

**Scalar multiplication.** A vector times a number scales every component.

```
2 * [1, 2, 3] = [2, 4, 6]
```

This is how the model controls strength. Attention weights, learning rates, and dropout masks all reduce to scalar multiplications.

**Length** (also called norm or magnitude). The L2 norm is the square root of the sum of squared components.

```
||[3, 4]|| = √(9 + 16) = 5
```

Length matters because it tells you "how much" of a direction is present, separately from the direction itself.

## Why Direction Matters More Than Magnitude

When the model represents the word `king` as a vector of 768 numbers, what's meaningful is not those specific numbers but the *direction* they point relative to other words. `king` and `queen` end up pointing in similar directions; `king` and `banana` do not.

Two vectors that point the same way encode "similar things". Two vectors that point in opposite directions encode "opposites". Two vectors that are perpendicular encode "unrelated things". This intuition is the entire reason embeddings work, and the next lesson (Dot Products) is how the model measures it.

> [!NOTE]
> Vectors in deep learning are typically 64 to 4096 dimensions long. Your visual intuition for 2D and 3D vectors mostly holds: directions still mean similarity, addition still means combination, scaling still means magnitude. What changes is that there are vastly more "perpendicular" directions available — and the model uses every one of them to store different concepts.

## What To Notice in the Experiment

- The component-wise add returns a vector the same length as its inputs.
- Scaling preserves direction but changes length.
- The norm of `[3, 4]` is exactly 5 because the math is Pythagoras.

> [!TRY-THIS]
> Try the Experiment tab's vector demo and watch the components add up element by element. Then ask yourself: if `[1, 0]` is the direction of `king`, what should the direction of `queen` look like? (Hint: close to `king`, but not identical.) The next two lessons make that intuition precise.
