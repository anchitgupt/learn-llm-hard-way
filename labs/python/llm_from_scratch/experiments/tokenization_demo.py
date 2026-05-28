from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from llm_from_scratch.tokenizers.bpe import train_merges
from llm_from_scratch.tokenizers.character import CharacterTokenizer


def build_character_tokenizer_artifact(text: str = "llm lab") -> dict[str, Any]:
    """Artifact for the character-tokenizer lab.

    Trains a character tokenizer on ``text`` and traces the encode → decode
    round-trip. ``tokens`` carries the per-character pieces so the
    token-flow viz can render the real sequence on the Experiment tab.
    """
    tokenizer = CharacterTokenizer.train(text)
    ids = tokenizer.encode(text)
    tokens = list(text)
    return {
        "labId": "character-tokenizer",
        "conceptId": "character-tokenization",
        "input": text,
        "tokens": tokens,
        "tokenIds": ids,
        "vocabulary": tokenizer.char_to_id,
        "vocabularySize": tokenizer.vocab_size,
        "decoded": tokenizer.decode(ids),
        "tradeoff": {
            "sequenceLength": len(tokens),
            "explanation": (
                "Character tokenization keeps a tiny vocabulary "
                f"({tokenizer.vocab_size}) but stretches the sequence to "
                f"{len(tokens)} tokens for {len(text)} characters of input."
            ),
        },
    }


def write_character_tokenizer_artifact(root: Path) -> Path:
    artifact = build_character_tokenizer_artifact()
    output_path = root / "artifacts" / "labs" / "character-tokenizer.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path


def build_bpe_tokenizer_artifact(text: str = "low lower lowest", merge_count: int = 4) -> dict[str, Any]:
    """Artifact for the bpe-tokenizer lab.

    Runs ``merge_count`` BPE merges on ``text``, capturing each step's
    pair, the new token, and the token list before and after. ``tokens``
    carries the final tokens so the token-flow viz renders the post-BPE
    sequence on the Experiment tab.
    """
    result = train_merges(text, merge_count=merge_count)
    return {
        "labId": "bpe-tokenizer",
        "conceptId": "byte-pair-encoding",
        "input": text,
        "settings": {"mergeCount": merge_count},
        "initialTokens": list(result.initial_tokens),
        "merges": [
            {
                "step": index + 1,
                "pair": list(step.pair),
                "newToken": step.new_token,
                "before": list(step.before),
                "after": list(step.after),
            }
            for index, step in enumerate(result.merges)
        ],
        "tokens": list(result.final_tokens),
        "tradeoff": {
            "initialLength": len(result.initial_tokens),
            "finalLength": len(result.final_tokens),
            "explanation": (
                "Each merge replaces a frequent adjacent pair with a new token, "
                f"trimming the sequence from {len(result.initial_tokens)} to "
                f"{len(result.final_tokens)} tokens after {len(result.merges)} merges."
            ),
        },
    }


def write_bpe_tokenizer_artifact(root: Path) -> Path:
    artifact = build_bpe_tokenizer_artifact()
    output_path = root / "artifacts" / "labs" / "bpe-tokenizer.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path


def build_demo_artifact(text: str) -> dict[str, object]:
    character_tokenizer = CharacterTokenizer.train(text)
    character_ids = character_tokenizer.encode(text)
    bpe_result = train_merges(text, merge_count=1)

    return {
        "input": text,
        "character": {
            "vocabulary": character_tokenizer.char_to_id,
            "ids": character_ids,
            "decoded": character_tokenizer.decode(character_ids),
        },
        "bpe": {
            "initial_tokens": list(bpe_result.initial_tokens),
            "merges": [
                {
                    "pair": list(step.pair),
                    "new_token": step.new_token,
                    "before": list(step.before),
                    "after": list(step.after),
                }
                for step in bpe_result.merges
            ],
            "final_tokens": list(bpe_result.final_tokens),
        },
    }


def main() -> None:
    artifact = build_demo_artifact("banana")
    output_path = Path("artifacts/tokenization_demo.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
