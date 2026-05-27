from __future__ import annotations

from typing import Any


def failure_cases() -> list[dict[str, Any]]:
    return [
        {
            "id": "count-r-letters",
            "category": "counting",
            "prompt": "How many r letters are in strawberry?",
            "modelOnlyOutput": "There are two r letters.",
            "explanation": "The model may reason over word-shaped tokens instead of reliably iterating over characters.",
            "betterStrategy": "Use explicit character splitting or a counting tool.",
            "relatedConcepts": ["tokenization-trace", "failure-museum"],
        },
        {
            "id": "spell-token-boundary",
            "category": "spelling",
            "prompt": "Spell tokenization backwards.",
            "modelOnlyOutput": "noitazinekot",
            "explanation": "Long words can be represented by multi-character tokens, making character-level manipulation fragile.",
            "betterStrategy": "Expose characters as the working representation before reversing.",
            "relatedConcepts": ["tokenization-trace", "failure-museum"],
        },
        {
            "id": "arithmetic-guess",
            "category": "arithmetic",
            "prompt": "What is 19 * 23?",
            "modelOnlyOutput": "437 or around 430.",
            "explanation": "A model can imitate arithmetic-looking text without actually executing arithmetic.",
            "betterStrategy": "Use the allowlisted arithmetic verifier.",
            "relatedConcepts": ["tool-verification", "failure-museum"],
        },
        {
            "id": "date-fact-missing-context",
            "category": "date-factuality",
            "prompt": "What day is launch day?",
            "modelOnlyOutput": "Launch day is probably Monday.",
            "explanation": "The answer is not in context, so a fluent date answer is just a guess.",
            "betterStrategy": "Provide the exact date in context or use a verified calendar tool.",
            "relatedConcepts": ["context-window-trace", "tool-verification"],
        },
        {
            "id": "hallucinated-citation",
            "category": "hallucination",
            "prompt": "Cite the paper that proves this tiny demo is state of the art.",
            "modelOnlyOutput": "A 2024 benchmark paper proves it.",
            "explanation": "The local tiny demo has no citation database and should not invent sources.",
            "betterStrategy": "Say the source is unavailable unless retrieval or provided context supports it.",
            "relatedConcepts": ["failure-museum", "base-vs-assistant-chat"],
        },
    ]
