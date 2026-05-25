from learn_llm_api.progress_store import ProgressStore


def test_progress_store_saves_note_and_confidence(tmp_path):
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    store.save_progress(
        concept_id="character-tokenization",
        status="in-progress",
        confidence=2,
        note="Need to revisit vocab ordering.",
        revisit=False,
    )

    progress = store.get_progress("character-tokenization")
    assert progress == {
        "conceptId": "character-tokenization",
        "status": "in-progress",
        "confidence": 2,
        "note": "Need to revisit vocab ordering.",
        "revisit": False,
    }


def test_progress_store_returns_revisit_queue(tmp_path):
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.save_progress("bytes-unicode", "done", 4, "", False)
    store.save_progress("byte-pair-encoding", "confusing", 1, "Pair merges", True)

    revisit = store.list_revisit()

    assert revisit == [
        {
            "conceptId": "byte-pair-encoding",
            "status": "confusing",
            "confidence": 1,
            "note": "Pair merges",
            "revisit": True,
        }
    ]
