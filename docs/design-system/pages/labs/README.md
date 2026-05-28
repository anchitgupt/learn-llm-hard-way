# Lab Pages

> Inherits from [`../../MASTER.md`](../../MASTER.md). One page per lab
> registered in `apps/api/learn_llm_api/lab_runner.py:LABS`.

Each page is a focused design contract for that lab's Run-lab affordance,
artifact shape, and Experiment-tab viz wiring. Read the page **before**
modifying the lab's writer, the API registry entry, or the Experiment
tab's `realProps` mapping for the corresponding viz key.

## Tokenization

- [character-tokenizer](./character-tokenizer.md) — `character-tokenization`
- [bpe-tokenizer](./bpe-tokenizer.md) — `byte-pair-encoding`

## Math for Models

- [math-vector-demo](./math-vector-demo.md) — `vectors`
- [math-softmax-demo](./math-softmax-demo.md) — `logits-softmax`

## Neural Nets

- [nn-gradient-demo](./nn-gradient-demo.md) — `scalar-gradients`
- [nn-tiny-linear-demo](./nn-tiny-linear-demo.md) — `tiny-linear-model`

## Transformer

- [attention-demo](./attention-demo.md) — `attention-scores`
- [masked-attention-demo](./masked-attention-demo.md) — `masked-self-attention`
- [positional-encoding-demo](./positional-encoding-demo.md) — `positional-encoding`
- [transformer-block-demo](./transformer-block-demo.md) — `transformer-block`

## Training and Generation

- [mini-training-demo](./mini-training-demo.md) — `next-token-training`
- [sampling-generation-demo](./sampling-generation-demo.md) — `sampling-generation`
- [base-vs-assistant-demo](./base-vs-assistant-demo.md) — `base-vs-assistant`
- [factuality-failure-demo](./factuality-failure-demo.md) — `factuality-failures`

## Chat

- [chat-mechanics-demo](./chat-mechanics-demo.md) — `message-formatting`
