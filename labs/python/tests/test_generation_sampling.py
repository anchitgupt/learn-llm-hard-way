from __future__ import annotations

import pytest

from llm_from_scratch.generation.sampling import (
    greedy_sample,
    logits_to_probabilities,
    sample_from_logits,
)


def test_greedy_sample_returns_highest_logit_token() -> None:
    logits = {"a": 0.0, "b": 2.0, "c": 1.0}

    assert greedy_sample(logits) == "b"


def test_logits_to_probabilities_applies_temperature_and_top_k() -> None:
    logits = {"a": 0.0, "b": 2.0, "c": 1.0}

    probabilities = logits_to_probabilities(logits, temperature=0.5, top_k=2)

    assert set(probabilities) == {"b", "c"}
    assert sum(probabilities.values()) == pytest.approx(1.0)
    assert probabilities["b"] > probabilities["c"]


def test_sample_from_logits_returns_decision_trace() -> None:
    logits = {"a": 0.0, "b": 2.0, "c": 1.0}

    decision = sample_from_logits(logits, temperature=1.0, top_k=2, seed=7)

    assert decision["token"] in {"b", "c"}
    assert decision["candidates"] == ["b", "c"]
    assert decision["probabilities"]["b"] > decision["probabilities"]["c"]
    assert 0.0 <= decision["randomValue"] < 1.0
