from __future__ import annotations

from typing import Any


def preference_simulation() -> dict[str, Any]:
    candidates = [
        {
            "id": "guessy",
            "response": "The answer is probably correct because it sounds right.",
            "traits": ["fluent", "unsupported"],
        },
        {
            "id": "verbose",
            "response": "Tool verification helps arithmetic. Here is a long unrelated explanation about language models.",
            "traits": ["partly-correct", "too-long"],
        },
        {
            "id": "verified",
            "response": "Tool verification helps arithmetic because the tool computes the expression instead of guessing from text patterns.",
            "traits": ["correct", "grounded", "concise"],
        },
    ]
    reward_scores = {
        "guessy": 0.15,
        "verbose": 0.55,
        "verified": 0.92,
    }
    ranking = sorted(reward_scores, key=reward_scores.get, reverse=True)
    winner_id = ranking[0]
    return {
        "prompt": "Explain why tool verification helps arithmetic.",
        "candidates": candidates,
        "rewardScores": reward_scores,
        "ranking": ranking,
        "winner": next(candidate for candidate in candidates if candidate["id"] == winner_id),
        "explanation": "The verifiable response wins because correctness can be checked against a tool result, while unsupported fluency receives a low reward.",
    }
