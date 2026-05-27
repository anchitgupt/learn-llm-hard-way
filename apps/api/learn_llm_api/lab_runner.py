from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

from llm_from_scratch.experiments.chat_demo import write_chat_demo_artifact
from llm_from_scratch.experiments.math_demo import write_math_demo_artifact
from llm_from_scratch.experiments.mini_training_demo import write_mini_training_demo_artifact
from llm_from_scratch.experiments.nn_demo import write_nn_demo_artifact
from llm_from_scratch.experiments.transformer_demo import write_transformer_demo_artifact

LabWriter = Callable[[Path], Path]

LABS: dict[str, tuple[str, LabWriter]] = {
    "math-vector-demo": ("vectors", write_math_demo_artifact),
    "math-softmax-demo": ("logits-softmax", write_math_demo_artifact),
    "nn-gradient-demo": ("scalar-gradients", write_nn_demo_artifact),
    "nn-tiny-linear-demo": ("tiny-linear-model", write_nn_demo_artifact),
    "attention-demo": (
        "attention-scores",
        lambda root: write_transformer_demo_artifact(root, "attention-demo"),
    ),
    "masked-attention-demo": (
        "masked-self-attention",
        lambda root: write_transformer_demo_artifact(root, "masked-attention-demo"),
    ),
    "positional-encoding-demo": (
        "positional-encoding",
        lambda root: write_transformer_demo_artifact(root, "positional-encoding-demo"),
    ),
    "transformer-block-demo": (
        "transformer-block",
        lambda root: write_transformer_demo_artifact(root, "transformer-block-demo"),
    ),
    "mini-training-demo": (
        "next-token-training",
        lambda root: write_mini_training_demo_artifact(root, "mini-training-demo"),
    ),
    "sampling-generation-demo": (
        "sampling-generation",
        lambda root: write_mini_training_demo_artifact(root, "sampling-generation-demo"),
    ),
    "base-vs-assistant-demo": (
        "base-vs-assistant",
        lambda root: write_mini_training_demo_artifact(root, "base-vs-assistant-demo"),
    ),
    "factuality-failure-demo": (
        "factuality-failures",
        lambda root: write_mini_training_demo_artifact(root, "factuality-failure-demo"),
    ),
    "chat-mechanics-demo": ("message-formatting", write_chat_demo_artifact),
}


def run_lab(lab_id: str, repo_root: Path) -> dict[str, Any]:
    if lab_id not in LABS:
        raise KeyError(f"Unknown lab: {lab_id}")
    concept_id, writer = LABS[lab_id]
    artifact_path = writer(repo_root)
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    return {
        "labId": lab_id,
        "conceptId": concept_id,
        "artifactPath": artifact_path.relative_to(repo_root).as_posix(),
        "artifact": artifact,
        "status": "passed",
        "error": "",
    }
