# Factuality Failures

A language model predicts plausible continuations. Plausibility is not the same as truth.

Small models make this easy to see because they have almost no knowledge. Larger models can still fail when the answer is missing from context, when the prompt asks for unstable facts, or when the model imitates confident text instead of verifying.

The right lesson is not "models are useless." The lesson is that factuality needs context, retrieval, tools, uncertainty, and verification depending on the task.

## What To Inspect

- The prompt.
- The model-style output.
- The expected fact.
- The explanation of why the output is unreliable.

## Checkpoint

Explain why a fluent answer can still be false.
