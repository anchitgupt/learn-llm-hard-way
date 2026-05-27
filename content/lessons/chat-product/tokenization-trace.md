# Tokenization Trace

After formatting, the prompt becomes tokens and token IDs. The tokenization trace shows the exact model-facing sequence.

This matters because chat failures can come from token boundaries. A task that looks character-based to a user may not be character-based inside the model.

## What To Inspect

- Formatted prompt.
- Display tokens.
- Token IDs.
- Vocabulary used by the local demo.

## Checkpoint

Explain how a token trace helps debug a surprising chat response.
