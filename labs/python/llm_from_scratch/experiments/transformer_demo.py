from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from llm_from_scratch.transformer.attention import causal_mask, dot_product_attention
from llm_from_scratch.transformer.block import transformer_block
from llm_from_scratch.transformer.positional import sinusoidal_positions


LAB_CONCEPTS = {
    "attention-demo": "attention-scores",
    "masked-attention-demo": "masked-self-attention",
    "positional-encoding-demo": "positional-encoding",
    "transformer-block-demo": "transformer-block",
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, float) and math.isinf(value):
        return "-inf" if value < 0 else "inf"
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    return value


def build_transformer_demo_artifact(lab_id: str = "attention-demo") -> dict[str, Any]:
    if lab_id not in LAB_CONCEPTS:
        raise KeyError(f"Unknown transformer demo lab: {lab_id}")

    tokens = ["the", "tiny", "model"]
    token_vectors = [
        [1.0, 0.0],
        [0.5, 0.5],
        [0.0, 1.0],
    ]
    attention = dot_product_attention(
        queries=token_vectors,
        keys=token_vectors,
        values=token_vectors,
        causal=True,
    )
    positions = sinusoidal_positions(length=len(tokens), dimensions=2)
    block = transformer_block(token_vectors)

    return {
        "labId": lab_id,
        "conceptId": LAB_CONCEPTS[lab_id],
        "tokens": tokens,
        "attention": {
            "tokens": tokens,
            "scores": _json_safe(attention["scores"]),
            "weights": attention["weights"],
            "context": attention["context"],
        },
        "mask": {
            "table": causal_mask(len(tokens)),
            "blockedValue": "-inf",
        },
        "positions": {
            "vectors": positions,
        },
        "block": _json_safe(block),
    }


def write_transformer_demo_artifact(root: Path, lab_id: str = "attention-demo") -> Path:
    artifact = build_transformer_demo_artifact(lab_id)
    output_path = root / "artifacts" / "labs" / f"{lab_id}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
