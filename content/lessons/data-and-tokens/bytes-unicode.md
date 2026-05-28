# Bytes and Unicode

Before a language model sees a single token, the text has already gone through two translations: human writing becomes Unicode code points, and Unicode code points become bytes. If either step blurs in your head, the rest of the pipeline will too. This lesson is the foundation under everything that follows.

## What Text Actually Is on Disk

A file is a sequence of bytes. A byte is an 8-bit number between 0 and 255. There is no "letter A" stored anywhere — what's stored is the byte `0x41`, which an editor agrees to *display* as `A`.

The agreement is called a **character encoding**. ASCII covers the first 128 byte values and assigns each one a Latin letter, digit, or control code. That's enough for English text typed on a 1968 teletype, but it cannot represent é, 中, or 🦊.

**Unicode** is the modern agreement. It assigns every glyph a number called a **code point**, written like `U+0041` (for `A`) or `U+1F98A` (for 🦊). Unicode itself doesn't say how to store these numbers as bytes — that's the encoding's job.

## UTF-8: Variable-Width Encoding

UTF-8 is the encoding the web standardised on. It stores each code point as 1 to 4 bytes:

- ASCII letters fit in one byte. `A` → `0x41`.
- Most European glyphs use two bytes. `é` → `0xC3 0xA9`.
- Most CJK characters use three bytes. `中` → `0xE4 0xB8 0xAD`.
- Emoji and rare scripts use four. 🦊 → `0xF0 0x9F 0xA6 0x8A`.

The leading bits of each byte say how many bytes the code point spans. UTF-8 is "self-synchronising": you can drop into the middle of a UTF-8 stream and find the next character boundary by skipping continuation bytes.

> [!NOTE]
> The same visible character can use different byte sequences. `é` can be one precomposed code point (`U+00E9`) or two — `e` (`U+0065`) plus a combining acute accent (`U+0301`). Normalisation forms (NFC, NFD) decide which form text is stored in.

## Why Models Care

Tokenizers don't operate on glyphs directly. They operate on bytes (or sometimes code points). When you read that a model's vocabulary is "byte-level", the tokenizer's alphabet is literally the 256 possible byte values. Subword tokenizers like BPE then merge frequent adjacent byte pairs into larger tokens.

A consequence: an English word like `attention` is short (9 bytes, often 1–2 tokens), but the same idea in Chinese costs 3 bytes per character. The model pays in tokens for languages it sees less of during training.

## What To Notice in the Experiment

- The byte count for `Hello` is 5; for `Héllo` it's 6; for `H🦊llo` it's 8.
- The encoded ids change with the encoding, not just the visible text.
- Decoding the byte stream back through UTF-8 always recovers the original string when the file is well-formed.

> [!TRY-THIS]
> Switch the Experiment tab between ASCII, common European text, and CJK input. Compare the byte counts and the per-character ids. The cost of "the same sentence in a different language" is right there in the numbers.

This is the layer everything else sits on. The next lesson moves up one floor: how a tokenizer turns those bytes into a sequence the model will actually consume.
