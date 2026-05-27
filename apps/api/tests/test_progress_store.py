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
