from pathlib import Path

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
        "lastOpenedAt": None,
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
            "lastOpenedAt": None,
        }
    ]


def test_records_checkpoint_attempts_and_missed_topics(tmp_path: Path) -> None:
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    attempt = store.record_checkpoint_attempt(
        concept_id="vectors",
        submitted_answer="numbers",
        correct=False,
        feedback="Mention ordered numbers.",
        confidence=2,
    )
    store.save_progress("vectors", status="confusing", confidence=2, note="Need practice", revisit=True)

    missed = store.list_missed_topics()

    assert attempt["conceptId"] == "vectors"
    assert missed[0]["conceptId"] == "vectors"
    assert missed[0]["reason"] == "low-confidence"


def test_records_lab_runs_and_recent_artifacts(tmp_path: Path) -> None:
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    run = store.record_lab_run(
        lab_id="math-vector-demo",
        concept_id="vectors",
        artifact_path="artifacts/labs/math-vector-demo.json",
        status="passed",
    )

    recent = store.list_recent_artifacts(limit=3)

    assert run["labId"] == "math-vector-demo"
    assert recent == [
        {
            "labId": "math-vector-demo",
            "conceptId": "vectors",
            "artifactPath": "artifacts/labs/math-vector-demo.json",
            "status": "passed",
            "error": "",
        }
    ]


def test_saves_and_lists_chat_memory(tmp_path: Path) -> None:
    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    saved = store.save_chat_memory("I am learning attention before chat.")

    memories = store.list_chat_memories()

    assert saved["content"] == "I am learning attention before chat."
    assert saved["id"] == memories[0]["id"]
    assert memories[0]["content"] == "I am learning attention before chat."


def test_touch_concept_records_last_opened_at(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.touch_concept("bytes-unicode")
    rows = store.list_progress()
    assert len(rows) == 1
    assert rows[0]["conceptId"] == "bytes-unicode"
    assert rows[0]["lastOpenedAt"] is not None
    assert "T" in rows[0]["lastOpenedAt"]  # ISO 8601 with date+time


def test_touch_concept_updates_existing_progress_row(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    store.save_progress(
        concept_id="bytes-unicode",
        status="learning",
        confidence=3,
        note="",
        revisit=False,
    )
    store.touch_concept("bytes-unicode")
    rows = store.list_progress()
    assert len(rows) == 1
    assert rows[0]["status"] == "learning"
    assert rows[0]["lastOpenedAt"] is not None


def test_list_checkpoint_attempts_returns_most_recent_first(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()

    store.record_checkpoint_attempt(
        concept_id="bytes-unicode",
        submitted_answer="first",
        correct=False,
        feedback="try again",
        confidence=2,
    )
    store.record_checkpoint_attempt(
        concept_id="bytes-unicode",
        submitted_answer="second",
        correct=True,
        feedback="Checkpoint passed.",
        confidence=4,
    )
    store.record_checkpoint_attempt(
        concept_id="character-tokenization",
        submitted_answer="other concept",
        correct=False,
        feedback="...",
        confidence=2,
    )

    attempts = store.list_checkpoint_attempts("bytes-unicode")
    assert len(attempts) == 2
    assert attempts[0]["submittedAnswer"] == "second"
    assert attempts[0]["correct"] is True
    assert attempts[1]["submittedAnswer"] == "first"
    assert attempts[1]["correct"] is False


def test_list_checkpoint_attempts_returns_empty_for_unknown_concept(tmp_path):
    from learn_llm_api.progress_store import ProgressStore

    store = ProgressStore(tmp_path / "progress.sqlite")
    store.initialize()
    assert store.list_checkpoint_attempts("never-recorded") == []
