# Message Formatting

A chat product is a stream of structured turns: system instructions, user messages, assistant replies, tool calls, tool results. The model only sees a flat token sequence. The bridge between these two worlds is **message formatting** — the specific token patterns that wrap each role's content so the model can tell them apart. Get this wrong and the assistant misbehaves in subtle, hard-to-debug ways.

## What the Model Actually Sees

Every chat UI you've used eventually serialises the conversation into a single string before tokenisation. For OpenAI's ChatML format:

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is the capital of France?<|im_end|>
<|im_start|>assistant
Paris.<|im_end|>
```

Special tokens `<|im_start|>` and `<|im_end|>` mark turn boundaries. The role name (`system`, `user`, `assistant`) appears as plain text — the model learns during fine-tuning to associate each role with a behaviour.

For Llama 3:

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>

What is the capital of France?<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Paris.<|eot_id|>
```

Different tokens, same structure. Every model family has its own format, and getting it exactly right (down to the whitespace) matters.

## How the Model Learns Roles

During supervised fine-tuning, the model sees thousands of conversations in this exact format. The loss is only computed on the *assistant* tokens — never the user's, never the system's, never the role markers themselves. This teaches the model:

- After `<|im_start|>assistant\n`, produce assistant-style tokens.
- After `<|im_start|>user\n`, do *not* produce assistant tokens — wait for the next `<|im_start|>assistant\n`.
- Honour the system message's instructions throughout.

The role tags are not magic. They're just rare token patterns that the training data consistently associates with role boundaries.

## Why the Exact Format Matters

Common ways formatting goes wrong:

**Missing or wrong markers.** If you send `User: Hi\nAssistant:` to a ChatML-trained model, it might still produce a reply, but its behaviour is drawn from base-model patterns of "text continuing after `Assistant:`" rather than from the assistant-fine-tuning distribution. Subtly worse responses.

**Stray special tokens in user input.** If the user types `<|im_end|>` into their message, an unfiltered passthrough lets them terminate the assistant's turn early or inject their own assistant tokens. This is a prompt-injection vector. Strip or escape these tokens at the boundary.

**Leftover assistant prefix.** Some formats expect the prompt to end with `<|im_start|>assistant\n` so the model continues *as the assistant*. Forget the prefix and the model might continue with a *user* turn instead — predicting what the user would say next, not what the assistant should reply.

> [!WARNING]
> Different model providers use incompatible formats. A chat template that works for GPT will silently degrade Llama. Always check the model's documentation for its expected format — and test the assistant's behaviour after any change.

## Modern Templates and Jinja

Modern model files include a chat template — usually a Jinja string — that knows how to serialise a list of messages into the model's expected format. The Hugging Face `apply_chat_template` function reads this metadata and produces the right tokens automatically. Use it. Hand-rolling templates is a source of bugs.

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"}
]
text = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
```

## What To Notice in the Experiment

- The exact tokens for each role tag are different across models.
- The system message goes first; subsequent turns alternate user/assistant.
- A trailing `add_generation_prompt=True` adds the assistant's opening marker so the model knows it's the assistant's turn.

> [!TRY-THIS]
> In the chat-mechanics demo, look at the formatted prompt produced for a chat trace. Notice how the system, user, and assistant content are wrapped. Now imagine sending the same content as one big string with no markers — the model would still try to answer, but it would be doing it as a *base* model, not an assistant.
