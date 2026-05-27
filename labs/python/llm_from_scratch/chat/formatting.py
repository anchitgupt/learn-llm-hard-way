from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from llm_from_scratch.tokenizers.character import CharacterTokenizer

ChatMode = Literal["base", "assistant"]


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str

    def as_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


def format_messages(messages: list[ChatMessage], mode: ChatMode) -> str:
    if mode == "base":
        return "\n".join(message.content for message in messages)
    if mode == "assistant":
        formatted = "\n".join(f"<{message.role}>{message.content}</{message.role}>" for message in messages)
        return f"{formatted}\n<assistant>"
    raise ValueError(f"unknown chat mode: {mode}")


def trace_tokens(text: str) -> dict[str, object]:
    tokenizer = CharacterTokenizer.train(text)
    tokens = list(text)
    return {
        "text": text,
        "tokens": tokens,
        "tokenIds": tokenizer.encode(text),
        "vocabulary": tokenizer.char_to_id,
    }
