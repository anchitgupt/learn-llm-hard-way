# Base vs Assistant Models

A pretrained "base" model is a text completer. Give it the start of any document and it continues. It does not know it is in a conversation, that it has a persona, or that you want help. An **assistant** model is what you get after additional training — usually with supervised fine-tuning on human-written dialogues, followed by reinforcement learning from human feedback (RLHF). The architecture is the same; the behaviour is completely different.

## What the Base Model Does

Imagine training only on next-token prediction over a massive corpus of internet text. The result is a model that, given:

```
The capital of France is
```

confidently completes:

```
The capital of France is Paris.
```

Same model, given:

```
Q: Explain quantum mechanics simply.
A:
```

might respond:

```
Q: Explain quantum mechanics simply.
A: I'll do my best!
Q: Thanks!
A: You're welcome.
```

Or it might write a magazine article in third person about how to explain quantum mechanics. Or it might continue with another Q/A pair. The base model has no concept of *staying in role* as the assistant. It's matching the surface pattern of "text that looks like this".

## What Fine-Tuning Does

The first step of "assistantification" is **supervised fine-tuning (SFT)**: collect many `(user message, ideal assistant response)` pairs — written by paid annotators — and continue training the model on these examples, with the loss only on the assistant's tokens.

After enough SFT data, the model learns:

- When tokens look like a user turn, produce tokens that look like an assistant turn.
- When asked a question, answer it directly rather than write a Q/A continuation.
- Maintain a consistent persona across turns.
- Reject obviously harmful requests (if such examples are in the training set).

This is enough to ship a useful assistant. GPT-3.5's first public version (text-davinci-002) was largely SFT.

## What RLHF Adds

Supervised fine-tuning teaches the model to *imitate* good responses. RLHF teaches it to *prefer* responses humans rate higher.

Steps:

1. Sample multiple responses to the same prompt from the SFT model.
2. Have humans rank them.
3. Train a **reward model** that predicts human preference scores from prompts and responses.
4. Use that reward model as the training signal in a reinforcement-learning loop (PPO is the standard algorithm) to nudge the base model's outputs toward higher-reward territory.

Effects:

- Responses get more helpful, more detailed, less hedging.
- Stylistic preferences (clarity, structure, friendliness) get internalised.
- Refusal rates change — too-helpful or too-cautious models get steered toward a calibrated middle.
- Hallucinations can be reduced when the reward model has been trained to penalise them.

> [!NOTE]
> RLHF doesn't add new capabilities — those are baked in during pretraining. It tightens *which* capabilities the model uses in a given context. The same underlying model could write a sales pitch or a research proof, but RLHF makes the chatbot persona more reliably the foreground.

## Chat Formatting Matters

To use an assistant model, you have to wrap user messages in the specific format it was trained on. Common formats:

- ChatML: `<|im_start|>user\n...\n<|im_end|>\n<|im_start|>assistant\n`
- Llama 2/3: `[INST] ... [/INST]`
- Vicuna: `USER: ... ASSISTANT:`

Use the wrong format and the assistant gets confused — it might revert to base-model behaviour, refuse the request, or output the tokens of the wrong role.

## What To Notice in the Experiment

- The base model continues your prompt as if it's any text.
- The same prompt wrapped in the chat format produces an answer rather than a continuation.
- Some completions reveal the underlying base model's preferences (longer, third-person, prone to going off-topic) — that's the model talking, not the assistant.

> [!TRY-THIS]
> In the base-vs-assistant demo, send the same prompt twice — once raw, once wrapped in the chat template. Compare the outputs. The same parameters, the same architecture, the same model produces very different behaviour just from the *framing*. That framing is the assistant.
