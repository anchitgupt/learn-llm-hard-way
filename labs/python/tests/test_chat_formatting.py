from __future__ import annotations

from llm_from_scratch.chat.formatting import ChatMessage, format_messages, trace_tokens


def test_format_messages_renders_base_and_assistant_prompts_differently() -> None:
    messages = [
        ChatMessage(role="system", content="You expose traces."),
        ChatMessage(role="user", content="Explain attention."),
    ]

    base_prompt = format_messages(messages, mode="base")
    assistant_prompt = format_messages(messages, mode="assistant")

    assert base_prompt == "You expose traces.\nExplain attention."
    assert assistant_prompt == (
        "<system>You expose traces.</system>\n"
        "<user>Explain attention.</user>\n"
        "<assistant>"
    )


def test_trace_tokens_returns_display_tokens_and_ids() -> None:
    trace = trace_tokens("Hi!")

    assert trace["text"] == "Hi!"
    assert trace["tokens"] == ["H", "i", "!"]
    assert trace["tokenIds"] == [1, 2, 0]
    assert trace["vocabulary"] == {"!": 0, "H": 1, "i": 2}
