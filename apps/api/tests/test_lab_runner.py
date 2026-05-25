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


def test_run_lab_rejects_unknown_lab(tmp_path) -> None:
    with pytest.raises(KeyError, match="Unknown lab"):
        run_lab("rm-rf-demo", tmp_path)
