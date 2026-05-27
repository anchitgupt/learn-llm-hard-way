from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from llm_from_scratch.chat.failures import failure_cases
from llm_from_scratch.chat.local_model import build_chat_trace
from llm_from_scratch.chat.preference import preference_simulation


def build_chat_demo_artifact() -> dict[str, Any]:
    saved_memories = ["I am learning attention before chat."]
    trace = build_chat_trace(
        "What is 19 * 23?",
        {
            "mode": "assistant",
            "answerStyle": "short",
            "toolMode": "verified",
            "memoryMode": "saved",
            "contextSize": 96,
        },
        saved_memories=saved_memories,
    )
    return {
        "labId": "chat-mechanics-demo",
        "conceptIds": ["message-formatting", "tool-verification", "chat-memory"],
        "trace": trace,
        "failures": failure_cases(),
        "preference": preference_simulation(),
        "memoryExample": {
            "savedMemories": saved_memories,
            "memoryTrace": trace["memoryTrace"],
        },
    }


def write_chat_demo_artifact(root: Path) -> Path:
    artifact = build_chat_demo_artifact()
    output_path = root / "artifacts" / "labs" / "chat-mechanics-demo.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
