from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CharacterTokenizer:
    char_to_id: dict[str, int]
    id_to_char: dict[int, str]

    @classmethod
    def train(cls, text: str) -> "CharacterTokenizer":
        chars = sorted(set(text))
        char_to_id = {char: index for index, char in enumerate(chars)}
        id_to_char = {index: char for char, index in char_to_id.items()}
        return cls(char_to_id=char_to_id, id_to_char=id_to_char)

    @property
    def vocab_size(self) -> int:
        return len(self.char_to_id)

    def encode(self, text: str) -> list[int]:
        ids: list[int] = []
        for char in text:
            if char not in self.char_to_id:
                raise KeyError(f"Unknown character: {char}")
            ids.append(self.char_to_id[char])
        return ids

    def decode(self, ids: list[int]) -> str:
        return "".join(self.id_to_char[token_id] for token_id in ids)
