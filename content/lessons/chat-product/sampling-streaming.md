# Sampling and Streaming

Modern chat UIs feel responsive because they show the assistant's reply token by token, in real time, as the model generates it. That experience requires two distinct mechanisms working together: **sampling** (picking each token) and **streaming** (delivering it to the UI as it appears). Each one matters. Together they're why chat doesn't feel like waiting for a database query.

## Why Streaming Changes the Feel

A 200-token response at typical generation rates takes 4-8 seconds end to end. Sent as one block at the end, that's a long pause where the user wonders if anything is happening. Streamed token by token, it starts displaying within 100ms and the user can begin reading while the model is still generating.

Time-to-first-token (TTFT) is the metric to track: how long from the user's send to the first visible character. Anything under 500ms feels instant. Anything over 2 seconds feels slow.

Streaming also lets the user *interrupt*. If the assistant starts going the wrong direction, the user can stop generation early, saving compute and reducing frustration.

## What Streaming Actually Sends

On the wire, streaming is typically a sequence of **server-sent events (SSE)**:

```
event: token
data: {"text": "The"}

event: token
data: {"text": " capital"}

event: token
data: {"text": " of"}

event: done
data: {}
```

The client appends each chunk's text to the visible response. The chunks are usually one or a few tokens each, depending on what the inference server batches up.

## How Sampling Couples to Streaming

Each chunk requires one full forward pass through the model. With a KV cache, subsequent passes are much cheaper than the prefill (the first pass over the prompt), but they still happen sequentially. You can't stream faster than the model generates.

This is why throughput-focused inference engines (vLLM, TGI, sglang) batch multiple users' requests together. The cost per token is amortised across many simultaneous generations.

## Backpressure and Buffering

In a busy production system, the model can generate tokens faster than the client can render them. The reverse can also happen — a slow network buffers tokens in transit. Two design questions:

- **Client-side smoothing.** Should you render each token as it arrives, or animate them at a consistent rate so the display doesn't jitter? Most polished products do the latter.
- **Server-side stop.** When the client disconnects mid-generation, the server should *stop* generating immediately to free up the GPU. Forgetting this wastes compute on bytes that no one will read.

## Stopping and Continuation

The streaming loop has to handle several stop conditions:

- The model emits a stop token (`<|im_end|>`, `</s>`).
- A configured max length is reached.
- The client disconnects.
- The user clicks "stop".

Each of these needs a clean shutdown path: emit a final "done" event, release the GPU slot, log the partial output if needed.

## What To Notice in the Experiment

- The streamChunks list shows the sequence of pieces the client received.
- The total reply is the concatenation of all chunks (with no extra whitespace).
- The TTFT depends on the prompt length, not the response length.

> [!TRY-THIS]
> In the chat playground, send a long-prompt question that should produce a long response. Watch the stream play out token by token. Then ask: how long was the wait for the *first* token versus the total reply? That ratio — TTFT over total time — is what users experience as "responsive" versus "slow".
