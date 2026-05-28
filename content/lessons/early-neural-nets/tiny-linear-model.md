# Tiny Linear Model

A linear model has two parameters: a weight `w` and a bias `b`. The output is `y_pred = w * x + b`. It is the smallest model that's still *learnable* — and walking through one training run end to end is the cleanest way to see how every larger model trains.

## The Setup

We'll teach the model the rule `y = 2x + 1` from data alone. The data is a handful of `(x, y)` pairs:

```
(0, 1), (1, 3), (2, 5), (3, 7)
```

We start with random parameters: `w = 0.1`, `b = 0.0`. The model has no idea that `2` and `1` are the answers; it only sees the loss after each prediction.

The loss is mean squared error:

```
L = mean((y_pred - y_true)²)
```

It's a smooth, always-positive measure of how far off the predictions are. The squaring penalises big errors more than small ones, which keeps training stable.

## One Step in Detail

Forward at `(x=2, y=5)` with current `w=0.1, b=0.0`:

```
y_pred = 0.1 * 2 + 0 = 0.2
error  = y_pred - y_true = 0.2 - 5 = -4.8
loss   = (-4.8)² = 23.04
```

The gradient of the loss with respect to each parameter (chain rule applied):

```
dL/dw = 2 * error * x = 2 * (-4.8) * 2 = -19.2
dL/db = 2 * error     = 2 * (-4.8)     = -9.6
```

Both are negative, meaning *increasing* `w` and `b` will reduce the loss. With learning rate `0.01`:

```
w_new = 0.1 - 0.01 * (-19.2) = 0.1 + 0.192 = 0.292
b_new = 0.0 - 0.01 * (-9.6)  = 0.0 + 0.096 = 0.096
```

Tiny step, in the right direction. Repeat for every data point, repeat the whole dataset many times (each pass is an **epoch**), and `w` will drift toward `2` while `b` drifts toward `1`. The loss curve will fall quickly at first, then flatten as the model approaches the right answer.

## Why This Generalises

A real neural network is just many of these tiny models stacked together with nonlinear functions (ReLU, GELU) between them. Each layer computes `output = activation(W * input + b)` — exactly the same structure as our toy, just with `W` and `input` being vectors and matrices. The gradient flows backwards through every layer using the chain rule, exactly as it does here. **There is no new idea in larger models — only more dimensions of the same idea.**

> [!NOTE]
> The loss for a linear model is *convex* — it has a single minimum, and gradient descent always finds it. Deep networks have non-convex losses, with many local minima and saddle points. The math is the same; the landscape is wilder.

## What To Notice in the Experiment

- The loss decreases monotonically (with a small enough learning rate).
- `w` and `b` move *together* toward their targets — `w` faster because its gradient is multiplied by `x`.
- Doubling the learning rate halves the epochs needed, until it doesn't.

> [!TRY-THIS]
> Run the tiny-linear-model lab and watch the loss history. Plot the final `w` and `b` — they should be very close to `2` and `1`. Then change the data to `y = -x + 4` and retrain. Same algorithm, different parameters discovered. That's all training is: a search by gradient.
