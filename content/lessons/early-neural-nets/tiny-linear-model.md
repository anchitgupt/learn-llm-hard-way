# Tiny Linear Model

A tiny linear model predicts with one simple rule: multiply an input by a weight, then add a
bias. Even this small model has the core training loop: predict, measure loss, compute
gradients, and update parameters.

The point is not that a linear model is an LLM. The point is that the same training rhythm
appears again when the model has millions or billions of parameters.

## What To Notice

- Parameters control the prediction.
- Loss measures how far the prediction is from the target.
- One gradient step can move the next prediction closer to the target.
