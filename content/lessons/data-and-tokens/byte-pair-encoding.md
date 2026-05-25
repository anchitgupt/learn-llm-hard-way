# Byte Pair Encoding

Byte Pair Encoding starts with small tokens and repeatedly merges frequent adjacent pairs. Each merge adds a new token to the vocabulary and can shorten future sequences.

The key learning move is to watch a single merge happen. Once one merge is clear, the full tokenizer is just repeated counting and replacement.

## What To Notice

- BPE is data-driven.
- Frequent adjacent pairs become new tokens.
- Vocabulary grows while sequence length can shrink.
- Token boundaries affect what the model can easily count, spell, or copy.
