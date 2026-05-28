# Base vs Assistant in Chat

The pretrained model and the chat-tuned model use the same architecture, the same parameters mostly, and the same forward pass. They behave entirely differently. From the chat product's point of view, knowing which mode you're in (and why a particular reply looked the way it did) is part of debugging. This lesson focuses on the chat-side consequences of the base/assistant distinction.

## Base Model in a Chat Frame

What happens if you take a *base* model (no SFT, no RLHF) and put it in a chat UI? You can wrap user input in `<|im_start|>user\n...\n<|im_end|>\n<|im_start|>assistant\n` and ask it to continue.

It will. But:

- The "assistant" output is whatever the base model thinks would naturally follow that token pattern. It may continue with another user turn rather than producing a reply.
- The response style is unconstrained. The model might write a paragraph, a list, a poem, a code block — whichever feels statistically likely.
- The model has no learned preference for being helpful. It may decline, ramble, get stuck on tangents.
- Refusals don't exist. If you ask for something the public internet contains examples of, the base model produces it.

Base models are powerful raw material. They are not products.

## Assistant Model in the Same Frame

The assistant model has been further trained — SFT + RLHF — on examples of conversations where the assistant produced helpful, well-formatted, on-topic responses to user requests. The same chat frame produces:

- Direct answers rather than continuations.
- A stable persona across turns.
- Calibrated refusals on harmful or off-policy requests.
- Format consistency (paragraphs, bullets, code fences) tuned to the request type.

This is what users mean when they say "the model".

## Where the Distinction Matters in Practice

**Debugging weird replies.** If the assistant suddenly outputs something base-model-flavoured (continues the user's message, ignores the system prompt, refuses sensibly-formatted requests for no reason), the suspicion list starts with: bad chat template, missing role markers, a system message overriding the assistant fine-tune.

**Eval comparisons.** Pretrained and fine-tuned variants of the same model often have different sizes, names, and licences. Knowing which one you're talking to matters when benchmarking.

**Few-shot prompting on assistants.** Some prompting techniques (showing N examples of the desired behaviour) work *worse* on assistant models than on base models — the assistant's fine-tuning fights the few-shot pattern. If a prompt that worked on a base model degrades on the assistant, this is often why.

**Cost arbitrage.** Base models are cheaper per token (no expensive RLHF). For tasks where the chat persona doesn't matter — summarisation, classification, extraction — using the base model can save 30-50% on inference cost.

> [!NOTE]
> Some open-source models publish multiple variants: base, instruct (SFT only), chat (full RLHF). Picking the right one for your use case is a deployment decision, not just a research curiosity.

## What's Inside the Same Model

Both modes use the same weights for the bulk of the network — the embeddings, the attention layers, the feed-forward networks. RLHF only updates a small fraction of the parameters meaningfully (rank-low updates dominate). The fine-tuning is a thin behavioural shell over a vast pretrained substrate.

This is why "jailbreaks" sometimes work: a clever prompt can re-elicit the base-model behaviour the RLHF was supposed to suppress. The capability is still there.

## What To Notice in the Experiment

- The base mode's response is freer-form, sometimes wrong-format.
- The assistant mode's response is directly addressed to the request.
- The same prompt in both modes shows how much of "feeling polished" is fine-tuning.

> [!TRY-THIS]
> In the chat playground, run the same prompt in `base` and `assistant` modes. Note how the *content* of the response shifts even when the prompt is identical. The architecture didn't change. The conditioning did.
