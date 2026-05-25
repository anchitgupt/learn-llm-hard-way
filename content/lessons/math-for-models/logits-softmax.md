# Logits and Softmax

A logit is a raw score. A language model produces one score for each candidate next token.
Those raw scores are not probabilities yet.

Softmax converts logits into positive probabilities that add up to one. Higher logits receive
more probability mass, but lower logits can still remain possible depending on the score gap.

## What To Notice

- Logits can be any real numbers.
- Softmax preserves ranking while changing scores into probabilities.
- Sampling uses these probabilities to choose the next token.
