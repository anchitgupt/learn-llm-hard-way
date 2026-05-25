from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.math.probability import softmax
from llm_from_scratch.math.vectors import cosine_similarity, dot_product


def build_math_demo_artifact() -> dict[str, object]:
    left = [1, 2, 3]
    right = [4, 5, 6]
    logits = [1.0, 2.0, 3.0]
    return {
        "labId": "math-vector-demo",
        "conceptIds": ["vectors", "dot-products", "logits-softmax"],
        "leftVector": left,
        "rightVector": right,
        "dotProduct": dot_product(left, right),
        "cosineSimilarity": cosine_similarity(left, right),
        "softmax": {
            "logits": logits,
            "probabilities": softmax(logits),
        },
    }


def write_math_demo_artifact(root: Path) -> Path:
    artifact = build_math_demo_artifact()
    output_path = root / "artifacts" / "labs" / "math-vector-demo.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
