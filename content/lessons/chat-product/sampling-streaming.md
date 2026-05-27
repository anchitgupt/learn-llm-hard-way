# Sampling And Streaming

Chat responses are generated step by step. Sampling chooses candidate next tokens, and streaming sends chunks to the UI as they are produced.

The stream is not a separate intelligence layer. It is the user interface rendering the generation loop incrementally.

## What To Inspect

- Sampling decisions.
- Candidate tokens.
- Stream chunks.
- Final assembled reply.

## Checkpoint

Explain how streamed chunks relate to the final assistant message.
