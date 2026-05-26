# Phase 1: Foundation

Phase 1 explains what text becomes before it reaches a model.

## Goal

Build a concrete mental model for:

- Bytes and Unicode.
- Characters versus tokens.
- Token IDs.
- Simple character tokenization.
- Byte pair encoding.
- How tokenization affects the model input a chat product eventually sends.

## Lessons

| Lesson | Focus |
| --- | --- |
| [Bytes And Unicode](../../content/lessons/data-and-tokens/bytes-unicode.md) | How text becomes bytes and code points. |
| [Character Tokenization](../../content/lessons/data-and-tokens/character-tokenization.md) | How a small tokenizer maps text to IDs and back. |
| [Byte Pair Encoding](../../content/lessons/data-and-tokens/byte-pair-encoding.md) | How repeated byte or character pairs can become larger tokens. |

## Labs

The foundation labs are in `labs/python` and produce local artifacts for the app to display.

What to check while learning:

- Can you explain why the model sees token IDs instead of raw words?
- Can you predict how a small tokenizer will split a short sentence?
- Can you explain why token boundaries can surprise users in spelling, counting, or formatting tasks?

## App Flow

Use the web app to:

1. Open the Data and Tokens concept.
2. Read each lesson.
3. Run tokenization demos.
4. Save notes.
5. Mark revisit state for anything unclear.

## Verification

Phase 1 is covered by labs, API, web tests, and a browser flow. Use [../run.md](../run.md) for the exact commands.
