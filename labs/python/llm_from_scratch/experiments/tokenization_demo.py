from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.tokenizers.bpe import train_merges
from llm_from_scratch.tokenizers.character import CharacterTokenizer


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
