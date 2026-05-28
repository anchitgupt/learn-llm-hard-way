# Dataset Packing

Once you can tokenize text and you have a transformer that processes a fixed-length sequence of tokens, you have a question to answer: *how do you build the training batches?* Naïve answers waste compute spectacularly. Dataset packing is the trick production models use to stay efficient.

## The Naïve Approach Wastes Compute

Imagine your model's context length is 1024 tokens and your training corpus is a pile of documents of various lengths. The obvious approach: pad each document up to 1024 tokens with a special `<pad>` token, then feed the padded sequence to the model.

The problem: if your average document is 200 tokens, you're spending 80% of every forward pass on padding tokens that contribute nothing to the loss (they're masked out). On a model that costs $1M to train, that's $800,000 of GPU time spent on padding.

## The Packing Solution

Don't pad. *Pack.* Concatenate documents end-to-end into one giant token stream, with a separator token (often `<|endoftext|>` or `</s>`) between documents. Then slice the stream into context-length chunks.

```
Documents: [tokens_A], [tokens_B], [tokens_C], [tokens_D], ...

Concatenated:
tokens_A <eos> tokens_B <eos> tokens_C <eos> tokens_D <eos> ...

Chunked into 1024-token examples:
chunk 1: [first 1024 tokens]
chunk 2: [next  1024 tokens]
chunk 3: ...
```

No padding. Every position in every chunk is a real next-token prediction. GPU utilisation goes from 20% to 99%.

## The Document-Boundary Question

A subtle issue: within a packed chunk, attention can flow across document boundaries. Token 500 (from doc A) might attend to token 700 (from doc B). Is that a problem?

Two schools:

- **Don't fix it.** Treat document boundaries as just another rare token. The model learns to ignore the irrelevant context across the separator. This is what GPT-2/3/4 do.
- **Reset attention.** Use a more elaborate masking scheme that prevents attention across `<eos>` boundaries. Marginally better quality, much more complex to implement. Some modern training runs do this.

For most practical training, the first option works fine. The model is robust to occasional irrelevant context — it's seeing a lot of data.

## Practical Mechanics

A typical pipeline:

1. **Stream documents** from a sharded archive (the corpus is too large to fit in RAM).
2. **Tokenize on the fly** with the trained tokenizer.
3. **Concatenate** into a long token buffer.
4. **Slice** into context-length chunks.
5. **Shuffle** the chunks (with a buffer of, say, 10k chunks in memory) so the model doesn't see all of `doc_A` before all of `doc_B`.

This pipeline runs in parallel across many CPU workers and keeps the GPUs fed without ever waiting.

> [!TIP]
> Packing efficiency is measured by *padding ratio*: padding tokens / total tokens. Modern pipelines target <1%. If you measure 20%, your data loader is the bottleneck, not your GPU.

## A Subtler Effect: Position Distribution

In a packed dataset, every position from 0 to `context_length - 1` is roughly equally represented. If you instead pad short documents, the model sees lots of early positions and few late ones. Pad-heavy training under-trains the model's ability to handle long contexts. Packing fixes this for free.

## What To Notice in the Experiment

- The packed examples are uniform length (the context length).
- No padding tokens appear in any example.
- The same document can be split across two adjacent chunks if it doesn't fit cleanly.

> [!TRY-THIS]
> In the dataset-packing demo, count the wasted tokens (padding) versus the useful tokens. The ratio in the unpacked baseline is often 5:1; packed it's 0:1 (or close). That's the entire reason your training run finishes in a week instead of a month.
