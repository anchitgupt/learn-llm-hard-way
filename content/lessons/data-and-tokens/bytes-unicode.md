# Bytes and Unicode

LLMs do not see text the way people do. A model ultimately receives numbers. Before numbers reach the model, visible text is represented as bytes through an encoding such as UTF-8.

The important first idea is that a character is not the same thing as a byte. Some characters fit in one byte. Others require multiple bytes. This matters because tokenizers must turn messy human text into stable model inputs.

## What To Notice

- Text has a visible form and an encoded byte form.
- Unicode gives characters stable identities.
- UTF-8 turns those identities into byte sequences.
- Tokenizers build on top of this representation.
