# Message Formatting

A chat UI collects messages, but a model receives text tokens. Message formatting is the bridge between those two surfaces.

The formatter adds roles such as system, user, assistant, and memory. Those roles tell the model which text is instruction, which text is the user's request, and where the assistant reply should begin.

## What To Inspect

- Raw message list.
- Base-completion prompt.
- Assistant-chat prompt.
- Role delimiters.

## Checkpoint

Explain why role formatting changes model-facing text even when the visible user message is the same.
