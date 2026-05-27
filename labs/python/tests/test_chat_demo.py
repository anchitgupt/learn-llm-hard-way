from __future__ import annotations

import json

from llm_from_scratch.experiments.chat_demo import build_chat_demo_artifact, write_chat_demo_artifact


def test_chat_demo_artifact_includes_trace_failures_preference_and_memory(tmp_path) -> None:
    artifact = build_chat_demo_artifact()

    assert artifact["labId"] == "chat-mechanics-demo"
    assert artifact["conceptIds"] == ["message-formatting", "tool-verification", "chat-memory"]
    assert artifact["trace"]["finalReply"] == "437"
    assert artifact["trace"]["toolTrace"]["result"] == 437
    assert artifact["failures"][0]["category"] == "counting"
    assert artifact["preference"]["winner"]["id"] == "verified"
    assert artifact["memoryExample"]["savedMemories"] == ["I am learning attention before chat."]

    path = write_chat_demo_artifact(tmp_path)
    written = json.loads(path.read_text(encoding="utf-8"))
    assert written["trace"]["toolTrace"]["tool"] == "arithmetic-verifier"
