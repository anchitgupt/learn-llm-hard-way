from __future__ import annotations

from typing import Any

from llm_from_scratch.generation.sampling import sample_from_logits
from llm_from_scratch.chat.context import assemble_context
from llm_from_scratch.chat.formatting import ChatMessage, format_messages, trace_tokens
from llm_from_scratch.chat.tools import verify_tool


DEFAULT_SYSTEM = "You expose chat mechanics and answer from local deterministic demos."


def _reply_for(user_message: str, options: dict[str, Any], tool_trace: dict[str, Any] | None) -> str:
    if tool_trace and options["toolMode"] == "verified":
        return str(tool_trace["result"])

    normalized = user_message.lower()
    if "attention" in normalized and options["answerStyle"] == "scratch":
        return (
            "First compare query and key vectors, then softmax the scores, "
            "then mix value vectors into the reply representation."
        )
    if "attention" in normalized:
        return "Attention compares tokens and mixes useful context."
    if options["mode"] == "base":
        return " continuing the document with likely next text."
    return "I can answer with a visible prompt, token, context, sampling, and stream trace."


def _sampling_trace(reply: str) -> list[dict[str, Any]]:
    words = reply.split()
    trace: list[dict[str, Any]] = []
    for index, word in enumerate(words[:5]):
        logits = {
            word: 2.0,
            "trace": 1.0,
            "token": 0.5,
        }
        decision = sample_from_logits(logits, temperature=0.7, top_k=2, seed=index)
        trace.append({"step": index + 1, **decision})
    return trace


def _stream_chunks(reply: str, chunk_size: int = 16) -> list[str]:
    return [reply[index : index + chunk_size] for index in range(0, len(reply), chunk_size)]


def build_chat_trace(
    user_message: str,
    options: dict[str, Any],
    saved_memories: list[str] | None = None,
) -> dict[str, Any]:
    mode = options.get("mode", "assistant")
    answer_style = options.get("answerStyle", "short")
    tool_mode = options.get("toolMode", "none")
    memory_mode = options.get("memoryMode", "context")
    context_size = int(options.get("contextSize", 64))
    if mode not in {"base", "assistant"}:
        raise ValueError(f"unknown mode: {mode}")
    if answer_style not in {"short", "scratch"}:
        raise ValueError(f"unknown answer style: {answer_style}")
    if tool_mode not in {"none", "verified"}:
        raise ValueError(f"unknown tool mode: {tool_mode}")
    if memory_mode not in {"context", "saved"}:
        raise ValueError(f"unknown memory mode: {memory_mode}")

    memories = saved_memories or []
    memory_lines = [f"Saved memory: {memory}" for memory in memories] if memory_mode == "saved" else []
    messages = [
        ChatMessage(role="system", content=DEFAULT_SYSTEM),
        *(ChatMessage(role="memory", content=line) for line in memory_lines),
        ChatMessage(role="user", content=user_message),
    ]
    formatted_prompt = format_messages(messages, mode=mode)
    token_trace = trace_tokens(formatted_prompt)
    context_trace = assemble_context(token_trace, context_size=context_size)
    tool_trace = verify_tool(user_message) if tool_mode == "verified" else None
    final_reply = _reply_for(
        user_message,
        {"mode": mode, "answerStyle": answer_style, "toolMode": tool_mode, "memoryMode": memory_mode},
        tool_trace,
    )

    return {
        "messages": [message.as_dict() for message in messages],
        "formattedPrompt": formatted_prompt,
        "tokenTrace": token_trace,
        "contextTrace": context_trace,
        "samplingTrace": _sampling_trace(final_reply),
        "streamChunks": _stream_chunks(final_reply),
        "toolTrace": tool_trace,
        "memoryTrace": {
            "mode": memory_mode,
            "savedMemoriesUsed": memories if memory_mode == "saved" else [],
            "contextOnly": memory_mode == "context",
        },
        "finalReply": final_reply,
    }
