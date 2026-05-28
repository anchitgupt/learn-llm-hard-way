# Sampling and Generation

A trained language model produces a probability distribution over the next token, every step. **Sampling** is the act of turning that distribution into an actual chosen token — and then doing it again for the next position, and the next, and the next, building up a generated sequence one token at a time. The choices you make here are the difference between flat, repetitive text and the responsive, varied output you expect from a real LLM.

## The Loop

Generation is a tight loop. Starting from a prompt of tokens:

1. Run the prompt through the model.
2. Look at the last position's logits.
3. Convert to a probability distribution (softmax with optional temperature).
4. Sample a token from that distribution.
5. Append the sampled token to the sequence.
6. Repeat until you hit a stop token or a max length.

Each step is one full forward pass through the transformer. KV caches make this much cheaper than re-running the prompt from scratch each time, but the asymptotic complexity is still O(n) passes per generated sequence of length `n`.

## Decoding Strategies

How you sample from the distribution dramatically affects the output. Common options:

**Greedy (argmax).** Always pick the highest-probability token. Deterministic, fast, and often boring — it produces the model's "safest" continuation and tends to repeat or stall.

**Pure random sampling.** Sample directly from the softmax distribution. High diversity but often incoherent — the long tail of low-probability tokens occasionally fires and derails the sequence.

**Temperature.** Divide logits by `T` before softmax. `T < 1` sharpens (more deterministic), `T > 1` flattens (more random). The default 1.0 is "trust the model's calibration as-is".

**Top-k.** Restrict to the `k` most likely tokens (say k=40), zero out the rest, renormalise, sample. Prevents the long tail from misbehaving.

**Top-p (nucleus).** Restrict to the smallest set of tokens whose cumulative probability exceeds `p` (say p=0.9). Adapts to the distribution shape: tight cluster of confident tokens → small set, broad uncertainty → larger set.

In practice, modern UIs combine these. A typical default: `temperature=1.0, top_p=0.95`. For code generation: `temperature=0.2` (more deterministic). For brainstorming: `temperature=1.2` or higher.

## Why Beam Search Doesn't Help LLMs

Beam search (which keeps the top-N sequences at every step and prunes from the back) is the standard for translation models. It hurts LLMs.

The reason: LLMs trained with cross-entropy learn distributions where the *most likely* sequence is often the *least interesting* one. Picking the highest-probability path produces "the average of all valid continuations" — bland, repetitive, mode-collapsed. Sampling-based methods preserve diversity in a way beam search doesn't.

> [!NOTE]
> The "temperature creativity slider" in every chat UI is literally this `T` parameter applied to the logits before softmax. There's nothing more magical underneath it.

## Stopping

You also have to decide when to stop. Options:

- An explicit **stop token** (`<|endoftext|>`, `</s>`) — the model emits it when it thinks the response is done. This is the principled way.
- A **max length** — a hard cap, useful as a safety net.
- A **stop string** — for chat formats, "stop at the next `<|im_start|>user|>`". Decoder-side filtering.

## What To Notice in the Experiment

- The generated sequence changes when you change the seed even at the same temperature.
- Greedy decoding repeats itself quickly on simple prompts.
- Increasing top-k or top-p widens the candidate set the model can sample from.

> [!TRY-THIS]
> In the sampling-generation demo, generate the same prompt at temperatures 0.2, 1.0, and 1.6. The 0.2 output is nearly deterministic; the 1.6 output starts to look unhinged. Somewhere in the middle is your model's sweet spot for your use case — and finding it is a tuning task, not a math problem.
