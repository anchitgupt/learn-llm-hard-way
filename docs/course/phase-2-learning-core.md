# Phase 2: Learning Core

Phase 2 builds the math and tiny model mechanics needed before attention and transformers.

## Goal

Understand how model training starts from simple pieces:

- Vectors.
- Dot products.
- Similarity.
- Logits.
- Softmax.
- Scalar gradients.
- Loss.
- One-step optimization.
- Tiny linear models.

## Concepts

| Concept | Focus |
| --- | --- |
| [Math For Models](../../content/concepts/math-for-models.json) | Vectors, dot products, logits, and softmax. |
| [Early Neural Nets](../../content/concepts/early-neural-nets.json) | Gradients, loss, and tiny linear model updates. |

## Lessons

| Lesson | Focus |
| --- | --- |
| [Vectors](../../content/lessons/math-for-models/vectors.md) | Numbers as positions, directions, and features. |
| [Dot Products](../../content/lessons/math-for-models/dot-products.md) | Similarity and score building. |
| [Logits And Softmax](../../content/lessons/math-for-models/logits-softmax.md) | Turning raw scores into probabilities. |
| [Scalar Gradients](../../content/lessons/early-neural-nets/scalar-gradients.md) | How changing a value changes loss. |
| [Tiny Linear Model](../../content/lessons/early-neural-nets/tiny-linear-model.md) | A small model with a real update step. |

## Labs

Available local labs cover:

- Vector operations.
- Dot-product similarity.
- Logits and softmax.
- Scalar gradient behavior.
- Tiny linear model prediction, loss, and one-step optimization.

The app runs only allowlisted deterministic demos. Generated outputs are stored as local lab artifacts.

## App Flow

Use the learning cockpit to:

1. Open Math for Models.
2. Move through the concept map.
3. Run a matching lab.
4. Inspect the recent artifact.
5. Answer a checkpoint.
6. Save low-confidence topics to the missed-topic queue.

## Verification

Phase 2 is covered by Python lab tests, API tests, web component tests, the Vite build, and Playwright e2e. Use [../run.md](../run.md) for the exact commands.
