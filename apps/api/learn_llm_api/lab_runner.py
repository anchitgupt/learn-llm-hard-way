from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from llm_from_scratch.experiments.math_demo import write_math_demo_artifact
from llm_from_scratch.experiments.nn_demo import write_nn_demo_artifact

LabWriter = Callable[[Path], Path]

LABS: dict[str, tuple[str, LabWriter]] = {
    "math-vector-demo": ("vectors", write_math_demo_artifact),
    "math-softmax-demo": ("logits-softmax", write_math_demo_artifact),
    "nn-gradient-demo": ("scalar-gradients", write_nn_demo_artifact),
    "nn-tiny-linear-demo": ("tiny-linear-model", write_nn_demo_artifact),
}


def run_lab(lab_id: str, repo_root: Path) -> dict[str, Any]:
    if lab_id not in LABS:
        raise KeyError(f"Unknown lab: {lab_id}")
    concept_id, writer = LABS[lab_id]
    artifact_path = writer(repo_root)
    return {
        "labId": lab_id,
        "conceptId": concept_id,
        "artifactPath": artifact_path.relative_to(repo_root).as_posix(),
        "status": "passed",
        "error": "",
    }
