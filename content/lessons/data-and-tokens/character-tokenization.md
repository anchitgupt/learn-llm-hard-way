# Character Tokenization

A character tokenizer is the simplest tokenizer worth building. It maps each character to an integer id and maps each id back to a character.

This is not how modern production LLMs usually tokenize text, but it is the cleanest first step. You can see the full path from text to ids without hiding anything.

## What To Notice

- A vocabulary is a mapping between symbols and ids.
- Encoding turns text into ids.
- Decoding turns ids back into text.
- Character tokenization creates long sequences for normal language.

## Lab

Run the character tokenizer lab from the terminal:

```bash
python -m llm_from_scratch.experiments.tokenization_demo
```
