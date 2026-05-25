from llm_from_scratch.tokenizers.character import CharacterTokenizer


def test_character_tokenizer_round_trips_text():
    tokenizer = CharacterTokenizer.train("banana")

    ids = tokenizer.encode("banana")

    assert ids == [1, 0, 2, 0, 2, 0]
    assert tokenizer.decode(ids) == "banana"
    assert tokenizer.vocab_size == 3


def test_character_tokenizer_rejects_unknown_character():
    tokenizer = CharacterTokenizer.train("abc")

    try:
        tokenizer.encode("z")
    except KeyError as exc:
        assert "Unknown character: z" in str(exc)
    else:
        raise AssertionError("Expected KeyError for unknown character")
