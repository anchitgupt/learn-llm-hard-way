# Base Model Versus Assistant

A base model is trained to continue text. If the prompt looks like an article, it continues the article. If the prompt looks like a conversation transcript, it continues the transcript.

A chat assistant is a post-trained behavior layer on top of that next-token skill. It uses conversation formats, roles, delimiters, and examples of helpful responses.

Phase 3 shows this difference with tiny local examples. Phase 4 will turn it into a full chat playground with message formatting traces.

## What To Inspect

- A plain completion prompt.
- A role-formatted prompt.
- The difference between continuing text and answering as an assistant.

## Checkpoint

Explain why post-training changes the user-facing behavior without changing the basic next-token mechanism.
