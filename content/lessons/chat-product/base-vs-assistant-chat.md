# Base Completion Versus Assistant Chat

Base-completion mode continues the provided text. Assistant-chat mode wraps the user request in role formatting and begins an assistant response.

The underlying mechanism is still next-token prediction, but the prompt format strongly changes the behavior the user sees.

## What To Inspect

- Base prompt.
- Assistant prompt.
- Final reply difference.
- Message role trace.

## Checkpoint

Explain why a base model can continue a transcript without behaving like a helpful assistant.
