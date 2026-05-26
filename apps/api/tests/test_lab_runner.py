from __future__ import annotations

import json

import pytest

from learn_llm_api.lab_runner import run_lab


def test_run_lab_writes_allowlisted_math_artifact(tmp_path) -> None:
    result = run_lab("math-vector-demo", tmp_path)

    artifact_path = tmp_path / result["artifactPath"]
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert result["labId"] == "math-vector-demo"
    assert result["status"] == "passed"
    assert artifact["dotProduct"] == 32


def test_run_lab_writes_allowlisted_attention_artifact(tmp_path) -> None:
    result = run_lab("attention-demo", tmp_path)

    artifact_path = tmp_path / result["artifactPath"]
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert result["labId"] == "attention-demo"
    assert result["conceptId"] == "attention-scores"
    assert result["status"] == "passed"
    assert artifact["attention"]["tokens"] == ["the", "tiny", "model"]
    assert artifact["mask"]["table"][0] == [1, 0, 0]


def test_run_lab_writes_allowlisted_mini_training_artifact(tmp_path) -> None:
    result = run_lab("mini-training-demo", tmp_path)

    artifact_path = tmp_path / result["artifactPath"]
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert result["labId"] == "mini-training-demo"
    assert result["conceptId"] == "next-token-training"
    assert result["status"] == "passed"
    assert artifact["training"]["lossHistory"][-1] < artifact["training"]["lossHistory"][0]
    assert artifact["generation"]["generatedText"]


def test_run_lab_rejects_unknown_lab(tmp_path) -> None:
    with pytest.raises(KeyError, match="Unknown lab"):
        run_lab("rm-rf-demo", tmp_path)
