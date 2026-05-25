from __future__ import annotations

import json

from llm_from_scratch.experiments.math_demo import build_math_demo_artifact, write_math_demo_artifact
from llm_from_scratch.experiments.nn_demo import build_nn_demo_artifact, write_nn_demo_artifact


def test_math_demo_artifact_contains_vector_and_softmax_outputs(tmp_path) -> None:
    artifact = build_math_demo_artifact()

    assert artifact["labId"] == "math-vector-demo"
    assert artifact["dotProduct"] == 32
    assert round(sum(artifact["softmax"]["probabilities"]), 6) == 1.0

    path = write_math_demo_artifact(tmp_path)
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["labId"] == "math-vector-demo"


def test_nn_demo_artifact_contains_loss_reduction(tmp_path) -> None:
    artifact = build_nn_demo_artifact()

    assert artifact["labId"] == "nn-tiny-linear-demo"
    assert artifact["afterLoss"] < artifact["beforeLoss"]

    path = write_nn_demo_artifact(tmp_path)
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["afterLoss"] < written["beforeLoss"]
