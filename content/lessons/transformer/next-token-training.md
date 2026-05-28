# Next-Token Training

The training objective behind every GPT-style LLM is one sentence: *given the tokens so far, predict the next token*. That's it. There's no labelled corpus, no human annotation, no "category" or "intent" — just a stream of text and the model trying to guess what comes next. This is **self-supervised learning**: the supervision comes for free from the data itself.

## The Setup

You have a long sequence of tokens `t_0, t_1, t_2, ..., t_n`. For every position `i` from 0 to `n-1`, you want the model to predict `t_{i+1}` given everything before it.

With a causal mask (see the previous lesson), this is one forward pass:

1. Embed every token into a vector.
2. Run through the transformer stack — each position's output `h_i` is computed using attention over positions `0..i`.
3. Project each `h_i` through the language-modelling head: `logits_i = h_i · W_LM`, producing one logit per vocabulary entry.
4. Softmax those logits, and the prediction at position `i` is the distribution over what should come at position `i+1`.

The loss is **cross-entropy** between each predicted distribution and the actual next token (a one-hot target):

```
loss_i = -log(p_i[t_{i+1}])
loss   = mean(loss_i for i in 0..n-1)
```

The model is rewarded for putting probability mass on the *actual* next token. The closer the predicted distribution is to "all the mass on the right answer", the lower the loss.

## A Worked Example

Sequence: `the cat sat`. After embedding and the transformer, suppose the predictions look like:

```
position 0 ("the"):   p(cat) = 0.6, p(dog) = 0.2, p(?) = 0.2
position 1 ("the cat"): p(sat) = 0.3, p(ran) = 0.4, p(?) = 0.3
```

Cross-entropy at each position:

```
loss_0 = -log(0.6) ≈ 0.51
loss_1 = -log(0.3) ≈ 1.20
total ≈ 0.86
```

Gradient descent now pushes the model's parameters in whatever direction makes those true-next-token probabilities (`0.6`, `0.3`) higher next time. The model has no idea that "the cat sat" is a grammatical sentence. It only knows that the loss got smaller when it predicted `sat` more strongly after `the cat`.

## Why This Simple Objective Produces Useful Behaviour

It seems weird that "predict the next word" — a task as old as Markov chains from the 1950s — produces models that can write code, follow instructions, and explain physics. The answer is *capacity plus data*. To predict the next token in:

```
"In the proof of Fermat's Last Theorem, the key step is to..."
```

the model has to *understand* something about Fermat's Last Theorem. Otherwise it can't put high probability on the right tokens. As the model gets bigger and the dataset gets broader, the only way to keep reducing the loss is to internalise more knowledge and reasoning.

> [!NOTE]
> The loss curves in pretraining are remarkably predictable. There are *scaling laws* — empirical formulas relating model size, dataset size, and training compute to expected loss. A 70B model trained on 1T tokens hits a loss the formulas can predict within a few percent.

## What To Notice in the Experiment

- The loss decreases monotonically over training steps, then plateaus.
- The final per-token probability for the target token climbs from 1/vocab (random) toward something much higher.
- Common tokens (`the`, `a`, `of`) are predicted with high confidence; rare tokens stay uncertain.

> [!TRY-THIS]
> Run the mini-training-demo lab and watch the loss history shrink as the model learns to predict the target token. Then think: every emergent capability in modern LLMs — coding, reasoning, summarising — comes from this single objective applied to enough data. The lesson on Sampling and Generation will show what to do with a trained model.
