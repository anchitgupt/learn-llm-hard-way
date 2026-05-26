from __future__ import annotations

import json

from llm_from_scratch.experiments.mini_training_demo import (
    build_mini_training_demo_artifact,
    write_mini_training_demo_artifact,
)
from llm_from_scratch.experiments.transformer_demo import (
    build_transformer_demo_artifact,
    write_transformer_demo_artifact,
)


def test_transformer_demo_artifact_contains_attention_mask_positions_and_block(tmp_path) -> None:
    artifact = build_transformer_demo_artifact("attention-demo")

    assert artifact["labId"] == "attention-demo"
    assert artifact["conceptId"] == "attention-scores"
    assert artifact["attention"]["tokens"] == ["the", "tiny", "model"]
    assert artifact["attention"]["weights"][0] == [1.0, 0.0, 0.0]
    assert artifact["mask"]["table"][0] == [1, 0, 0]
    assert artifact["positions"]["vectors"][0] == [0.0, 1.0]
    assert "output" in artifact["block"]

    path = write_transformer_demo_artifact(tmp_path, "attention-demo")
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["labId"] == "attention-demo"


def test_mini_training_demo_artifact_contains_loss_generation_and_failures(tmp_path) -> None:
    artifact = build_mini_training_demo_artifact("mini-training-demo")

    assert artifact["labId"] == "mini-training-demo"
    assert artifact["conceptId"] == "next-token-training"
    assert artifact["training"]["lossHistory"][-1] < artifact["training"]["lossHistory"][0]
    assert artifact["generation"]["generatedText"]
    assert artifact["generation"]["decisionTrace"][0]["token"]
    assert artifact["comparison"]["baseCompletion"]
    assert artifact["comparison"]["assistantFormatted"]
    assert artifact["failure"]["expectedFact"]
    assert artifact["failure"]["explanation"]

    path = write_mini_training_demo_artifact(tmp_path, "mini-training-demo")
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["training"]["lossHistory"][-1] < written["training"]["lossHistory"][0]
