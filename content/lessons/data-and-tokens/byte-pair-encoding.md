# Byte Pair Encoding

Byte Pair Encoding (BPE) is the tokenizer behind GPT-2, GPT-3, and most production LLMs you've used. It earns its place by being *data-driven*: the vocabulary isn't designed by a linguist, it's discovered by counting which adjacent symbols co-occur most often and gluing them together. The result is a vocabulary where common chunks of language — `the`, `ing`, `tion`, ` Mr.` — get short token ids, and rare chunks fall back to character-level pieces.

## The Algorithm

Start with a vocabulary of single characters (or single bytes — the byte-level variant). Then repeat:

1. Count every adjacent pair of tokens in the corpus.
2. Find the most frequent pair.
3. Replace every occurrence of that pair with a new merged token, added to the vocabulary.

Stop after a fixed number of merges. Each merge step compresses the corpus a little; each step also locks in a new entry in the vocab.

```
corpus: low lower lowest
initial tokens: l o w _ l o w e r _ l o w e s t

most frequent pair: ('l', 'o') → merge into 'lo'
after merge: lo w _ lo w e r _ lo w e s t

most frequent pair: ('lo', 'w') → merge into 'low'
after merge: low _ low e r _ low e s t

... etc.
```

The trained tokenizer stores the **merge list** in order. Encoding new text replays the merges greedily: start with characters, apply the first applicable merge, then the next, until no more apply.

## Why It Works

BPE balances two competing pressures.

- **Short sequences** — every merge replaces two tokens with one, so frequent text compresses well. The model spends fewer tokens (and less attention compute) on common phrases.
- **Open vocabulary** — anything outside the trained vocab still encodes, because the fallback is single characters (or bytes). The model can read words it has never seen.

This is why BPE handles "supercalifragilisticexpialidocious" gracefully: a few common chunks (`super`, `cal`, `if`) plus character-level remainders. The model doesn't need a fixed dictionary.

> [!TIP]
> The merge count is a hyperparameter. More merges → larger vocab, shorter sequences, more memory in the embedding table. GPT-2 used 50,257 tokens; GPT-4 uses around 100k. The right number depends on your compute budget and the breadth of your training data.

## Limitations Worth Knowing

BPE is greedy. Once a merge is in the list, encoding always applies it, even when a smarter split would have served the model better. This produces some well-known oddities:

- Leading whitespace changes the token — `cat` and ` cat` are different ids.
- Numbers fragment unpredictably — `1234` might be one token or three depending on the corpus.
- Languages underrepresented during merge training stay character-level and cost more tokens to express the same idea.

Newer schemes (Unigram, SentencePiece) address the greediness; the broad picture stays the same.

## What To Notice in the Experiment

- The `merges` list records each step's pair and the new token it produced.
- The number of tokens drops monotonically as merges accumulate.
- The final tokens for `low lower lowest` include reused chunks like ` low`.

> [!TRY-THIS]
> Run the bpe-tokenizer lab and watch the merge trace step by step. Notice how the same input (`low lower lowest`) compresses differently depending on the merge count. Then think about what would happen if you trained on Hindi or Tamil instead — the merges are *learned*, and a different corpus produces a different vocabulary.
