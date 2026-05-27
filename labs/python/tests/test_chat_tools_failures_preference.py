from __future__ import annotations

from llm_from_scratch.chat.failures import failure_cases
from llm_from_scratch.chat.preference import preference_simulation


def test_failure_cases_cover_required_categories() -> None:
    cases = failure_cases()

    assert [case["category"] for case in cases] == [
        "counting",
        "spelling",
        "arithmetic",
        "date-factuality",
        "hallucination",
    ]
    assert all(case["prompt"] for case in cases)
    assert all(case["modelOnlyOutput"] for case in cases)
    assert all(case["betterStrategy"] for case in cases)


def test_preference_simulation_returns_ranking_rewards_and_winner() -> None:
    simulation = preference_simulation()

    assert simulation["prompt"] == "Explain why tool verification helps arithmetic."
    assert simulation["ranking"][0] == "verified"
    assert simulation["winner"]["id"] == "verified"
    assert simulation["rewardScores"]["verified"] > simulation["rewardScores"]["guessy"]
    assert "verifiable" in simulation["explanation"]
