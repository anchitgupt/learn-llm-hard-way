from __future__ import annotations

from llm_from_scratch.chat.context import assemble_context
from llm_from_scratch.chat.local_model import build_chat_trace


def test_assemble_context_records_kept_and_dropped_tokens() -> None:
    token_trace = {
        "tokens": ["a", "b", "c", "d", "e"],
        "tokenIds": [0, 1, 2, 3, 4],
    }

    context = assemble_context(token_trace, context_size=3)

    assert context == {
        "contextSize": 3,
        "droppedTokens": ["a", "b"],
        "droppedTokenIds": [0, 1],
        "keptTokens": ["c", "d", "e"],
        "keptTokenIds": [2, 3, 4],
    }


def test_build_chat_trace_returns_prompt_token_context_sampling_stream_and_reply() -> None:
    trace = build_chat_trace(
        "Explain attention.",
        {
            "mode": "assistant",
            "answerStyle": "scratch",
            "toolMode": "none",
            "memoryMode": "context",
            "contextSize": 24,
        },
    )

    assert trace["messages"][0]["role"] == "system"
    assert "<user>Explain attention.</user>" in trace["formattedPrompt"]
    assert trace["tokenTrace"]["tokens"]
    assert trace["contextTrace"]["contextSize"] == 24
    assert trace["samplingTrace"][0]["token"]
    assert "".join(trace["streamChunks"]) == trace["finalReply"]
    assert "First compare query and key vectors" in trace["finalReply"]


def test_build_chat_trace_adds_tool_trace_for_verified_arithmetic() -> None:
    trace = build_chat_trace(
        "What is 19 * 23?",
        {
            "mode": "assistant",
            "answerStyle": "short",
            "toolMode": "verified",
            "memoryMode": "context",
            "contextSize": 64,
        },
    )

    assert trace["toolTrace"] == {
        "tool": "arithmetic-verifier",
        "expression": "19 * 23",
        "result": 437,
        "explanation": "The allowlisted verifier evaluated the arithmetic expression directly.",
    }
    assert trace["finalReply"] == "437"
