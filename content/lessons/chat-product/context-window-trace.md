# Context Window Trace

The context window is the model's working memory for one request. It contains the tokens the model can currently condition on.

If the formatted prompt is longer than the context window, older tokens are dropped. The trace must show both kept and dropped tokens so the learner sees what information is available.

## What To Inspect

- Context size.
- Dropped tokens.
- Kept tokens.
- Whether saved memory was inserted.

## Checkpoint

Explain why a model cannot use a fact that was dropped from the active context window.
