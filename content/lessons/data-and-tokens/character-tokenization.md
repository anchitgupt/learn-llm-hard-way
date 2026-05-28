# Character Tokenization

A character tokenizer is the simplest device that turns text into ids the model can consume. It assigns a unique integer to every distinct character that appears in the training text, and that's the whole vocabulary. There is no learning, no statistics, no language-specific heuristics — just a lookup table. It is the wrong choice for production LLMs and the right choice for understanding what tokenization fundamentally *is*.

## How It Works

Training a character tokenizer takes one pass over a corpus:

1. Collect the set of distinct characters in the text.
2. Sort them (alphabetical works) and assign each a sequential id starting at zero.
3. Save the mapping in both directions: `char → id` and `id → char`.

Encoding a string `s` is then a per-character lookup: `[vocab[c] for c in s]`. Decoding a list of ids reverses it: `"".join(inv_vocab[i] for i in ids)`. Both operations are O(length of input).

```python
text = "llm lab"
vocab = {ch: i for i, ch in enumerate(sorted(set(text)))}
ids = [vocab[ch] for ch in text]
# vocab = {' ': 0, 'a': 1, 'b': 2, 'l': 3, 'm': 4}
# ids   = [3, 3, 4, 0, 3, 1, 2]
```

The vocabulary size is exactly the number of distinct characters — five for ASCII English without uppercase, more like 80 once you add capital letters, digits, and punctuation, and many thousands once Chinese or Japanese appears.

## What Goes Wrong

Two things bite immediately.

**Sequence length explodes.** A 100-word English sentence is around 500 characters but only 20–25 BPE tokens. Self-attention is quadratic in sequence length, so a character model spends 400× more compute on the same passage than a subword model.

**The model has to relearn what a word is.** "Cat" and "cats" share no high-level token; the model has to assemble the meaning of "cats" from scratch every time. Common prefixes, suffixes, and word stems get no special treatment.

> [!NOTE]
> Character models are not useless — they shine when the alphabet is small and the structure is genuinely sub-word (transliteration, DNA sequences, code with tight identifiers). They're a poor default for natural language because the *useful unit of meaning* is rarely a single character.

## What To Notice in the Experiment

- The vocabulary size matches the number of unique characters in the input.
- The encode → decode round trip is lossless.
- The sequence is much longer than what BPE would produce on the same string.
- Two structurally similar inputs (`cat`, `cats`) share no high-level token.

> [!TRY-THIS]
> Run the character-tokenizer lab on `llm lab`, then mentally encode `large language model`. Compare the sequence length to the input length in each case — that 1:1 ratio is the whole problem. The next lesson, Byte Pair Encoding, fixes it.
