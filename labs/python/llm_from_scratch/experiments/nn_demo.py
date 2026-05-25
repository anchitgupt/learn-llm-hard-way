from __future__ import annotations

import json
from pathlib import Path

from llm_from_scratch.nn.tiny_linear import LinearModel, one_step_update


def build_nn_demo_artifact() -> dict[str, object]:
    model = LinearModel(weight=0.0, bias=0.0)
    result = one_step_update(model, x=2.0, target=4.0, learning_rate=0.1)
    return {
        "labId": "nn-tiny-linear-demo",
        "conceptIds": ["scalar-gradients", "tiny-linear-model"],
        "input": 2.0,
        "target": 4.0,
        "beforeLoss": result.before_loss,
        "afterLoss": result.after_loss,
        "weightGradient": result.weight_gradient,
        "biasGradient": result.bias_gradient,
        "updatedWeight": result.updated_model.weight,
        "updatedBias": result.updated_model.bias,
    }


def write_nn_demo_artifact(root: Path) -> Path:
    artifact = build_nn_demo_artifact()
    output_path = root / "artifacts" / "labs" / "nn-tiny-linear-demo.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
