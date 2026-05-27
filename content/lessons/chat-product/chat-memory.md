# Chat Memory

Current context and saved memory are different.

Current context is the active token sequence for one request. Saved local memory is persistent state stored outside the model and inserted into future prompts when enabled.

## What To Inspect

- Context-only mode.
- Saved-memory mode.
- Memory inserted into the prompt.
- Memory stored in SQLite.

## Checkpoint

Explain why saved memory is not the same thing as knowledge inside model weights.
