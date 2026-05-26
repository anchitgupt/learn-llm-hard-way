# Dataset Packing

Language-model training turns text into many next-token examples.

For a short token sequence, each training row contains a fixed window of input tokens and the shifted target tokens. The target at each position is the token that comes next in the original sequence.

Packing matters because context length controls what the model can see. A tiny local lab can show exactly which token IDs become input and target rows.

## What To Inspect

- Vocabulary.
- Encoded token IDs.
- Fixed-length input windows.
- Shifted target windows.

## Checkpoint

Explain why targets are shifted by one position for next-token prediction.
