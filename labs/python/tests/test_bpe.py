from llm_from_scratch.tokenizers.bpe import count_pairs, merge_pair, train_merges


def test_count_pairs_counts_adjacent_pairs():
    tokens = tuple("banana")

    counts = count_pairs(tokens)

    assert counts[("a", "n")] == 2
    assert counts[("n", "a")] == 2
    assert counts[("b", "a")] == 1


def test_merge_pair_replaces_non_overlapping_pairs():
    tokens = tuple("banana")

    merged = merge_pair(tokens, ("a", "n"), "an")

    assert merged == ("b", "an", "an", "a")


def test_train_merges_applies_most_frequent_pair():
    result = train_merges("banana", merge_count=1)

    assert result.initial_tokens == ("b", "a", "n", "a", "n", "a")
    assert result.merges[0].pair == ("a", "n")
    assert result.merges[0].new_token == "an"
    assert result.final_tokens == ("b", "an", "an", "a")
