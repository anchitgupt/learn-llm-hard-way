# Tokenization Trace

Every time you send a message to a chat model, your text travels through the tokenizer first. The tokenizer's output — a list of integers — is what the model actually sees. When the model behaves weirdly, the tokenization step is one of the first places to look. This lesson walks through the trace and the surprises it contains.

## The Path of a Single Message

A user types `Hi, what's up?`. Here's what happens:

1. **Normalisation.** The raw string is unchanged (most modern models skip normalisation; older ones lowercased, stripped punctuation, etc.).
2. **Pre-tokenisation.** The tokenizer's pre-rules split the string into rough chunks. For GPT-style tokenizers, this is typically a regex that splits on whitespace while keeping it attached to the next word: `["Hi", ",", " what", "'s", " up", "?"]`.
3. **Token encoding.** Each chunk is encoded by the BPE merge list into one or more tokens, looked up in the vocabulary, and converted to an integer id.

The output: a flat list like `[17250, 11, 644, 338, 510, 30]`.

## Surprises Worth Knowing

Tokenisation isn't word-level. Some surprises in real-world tokenizers:

**Leading whitespace is sticky.** ` cat` (space-cat) is a different token from `cat`. The leading space is part of the token. This matters when measuring "did the model output the right word" — strip leading spaces before comparing.

**Capitalisation is sticky.** `Cat` and `cat` are different tokens — same root meaning, different ids.

**Numbers fragment unpredictably.** `2023` might be one token; `1024` might be two; `1023` might be three. The model has to assemble the meaning of a number from these splits, which is part of why arithmetic is hard for it.

**Multi-character punctuation merges.** `...` is often one token, but `..` and `....` are usually multiple. Tokenizers reflect what the corpus had.

**Special tokens are reserved.** `<|im_start|>`, `<|eot_id|>`, `<|endoftext|>`, `[INST]` — these are dedicated single tokens. If they appear in user input, they have to be sanitised.

> [!NOTE]
> The tokenizer is *trained*, not designed. The set of tokens you see is whatever the training corpus made statistically frequent. A tokenizer trained mostly on English will be efficient on English and inefficient on, say, Tamil — sentences in the second language will need more tokens to express the same meaning.

## Why This Matters for Quality

The model can only learn patterns at the *token* granularity. If a key concept always fragments differently, the model has to learn each fragmentation separately. Tasks where tokenisation hurts the most:

- **Character-level reasoning.** "How many `r`s are in 'strawberry'?" — the model never sees individual characters of "strawberry" if the word is one token.
- **Spelling.** Generating misspelt or invented words is awkward when the vocabulary doesn't have the right fragments.
- **Arithmetic.** Multi-digit numbers fragment unevenly, so the model can't directly map digit positions to operations.

These are the *tokenizer's* failures, not the model's. Tool use is the standard workaround (covered in the tool-verification lesson).

## What To Notice in the Experiment

- The trace shows each chunk, its token id, and its position.
- Whitespace tokens are visible and meaningful.
- The same user message produces a different trace under a different tokenizer.

> [!TRY-THIS]
> In the chat tokenisation trace, try typing `Hello world`, `hello world`, ` hello world` (leading space), and `HELLO WORLD`. Watch the token counts and ids change. Then think about your own production system: are you doing any normalisation before the tokenizer? Whatever you're doing or not doing is now part of the model's input.
