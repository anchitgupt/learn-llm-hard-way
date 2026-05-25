# Scalar Gradients

Training begins with asking a direct question: if one value changes a little, what happens to
the loss? A scalar gradient answers that question for one number.

The sign tells the direction. The size tells how sensitive the loss is to that value. Optimizers
use gradients to move parameters toward lower loss.

## What To Notice

- A positive gradient means increasing the value increases the loss.
- A negative gradient means increasing the value decreases the loss.
- Gradient steps connect model mistakes to parameter updates.
