import json
from pathlib import Path

from fastapi.testclient import TestClient

from learn_llm_api.app import create_app


def write_phase2_api_repo(root: Path) -> None:
    (root / "content" / "concepts").mkdir(parents=True)
    (root / "content" / "lessons" / "data-and-tokens").mkdir(parents=True)
    (root / "content" / "glossary").mkdir(parents=True)
    (root / "content" / "lessons" / "data-and-tokens" / "bytes-unicode.md").write_text(
        "# Bytes and Unicode\n",
        encoding="utf-8",
    )
    (root / "content" / "concepts" / "data-and-tokens.json").write_text(
        json.dumps(
            {
                "track": {"id": "data-and-tokens", "title": "Data and Tokens", "summary": "Tokens", "order": 1},
                "concepts": [
                    {
                        "id": "bytes-unicode",
                        "title": "Bytes and Unicode",
                        "order": 1,
                        "prerequisites": [],
                        "lessonPath": "content/lessons/data-and-tokens/bytes-unicode.md",
                        "lab": "math-vector-demo",
                        "visual": "token-flow-svg",
                        "checkpoint": {
                            "question": "What is a vector?",
                            "answer": "A vector is an ordered list of numbers.",
                            "acceptedKeywords": ["ordered", "numbers"],
                        },
                        "glossary": ["vector"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (root / "content" / "glossary" / "core.json").write_text(
        json.dumps(
            {
                "entries": [
                    {
                        "id": "vector",
                        "term": "Vector",
                        "shortDefinition": "A list of numbers.",
                        "explanation": "Used for embeddings.",
                        "relatedConcepts": ["bytes-unicode"],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )


def test_health_endpoint():
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_tracks_endpoint_returns_curriculum():
    client = TestClient(create_app())

    response = client.get("/api/tracks")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["id"] == "data-and-tokens"
    assert body[0]["concepts"][0]["id"] == "bytes-unicode"


def test_progress_round_trip(tmp_path):
    app = create_app(database_path=tmp_path / "progress.sqlite")
    client = TestClient(app)

    response = client.put(
        "/api/progress/character-tokenization",
        json={
            "status": "in-progress",
            "confidence": 2,
            "note": "I need to revisit ids.",
            "revisit": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["conceptId"] == "character-tokenization"
    revisit = client.get("/api/revisit").json()
    assert revisit[0]["conceptId"] == "character-tokenization"


def test_create_app_uses_database_path_env(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "env-progress.sqlite"
    monkeypatch.setenv("LEARN_LLM_DATABASE_PATH", str(database_path))
    app = create_app(repo_root=Path("."))
    client = TestClient(app)

    response = client.put(
        "/api/progress/bytes-unicode",
        json={"status": "in-progress", "confidence": 3, "note": "", "revisit": False},
    )

    assert response.status_code == 200
    assert database_path.exists()


def test_phase_two_endpoints_return_glossary_checkpoint_lab_and_artifacts(tmp_path: Path) -> None:
    write_phase2_api_repo(tmp_path)
    app = create_app(repo_root=tmp_path, database_path=tmp_path / "progress.sqlite")
    client = TestClient(app)

    glossary_response = client.get("/api/glossary")
    assert glossary_response.status_code == 200
    assert glossary_response.json()[0]["id"] == "vector"

    attempt_response = client.post(
        "/api/checkpoints/bytes-unicode/attempts",
        json={"submittedAnswer": "not sure", "confidence": 2},
    )
    assert attempt_response.status_code == 200
    assert attempt_response.json()["conceptId"] == "bytes-unicode"

    lab_response = client.post("/api/labs/math-vector-demo/runs")
    assert lab_response.status_code == 200
    assert lab_response.json()["status"] == "passed"

    artifacts_response = client.get("/api/artifacts/recent")
    assert artifacts_response.status_code == 200
    assert artifacts_response.json()[0]["labId"] == "math-vector-demo"

    revisit_response = client.get("/api/revisit")
    assert revisit_response.status_code == 200
    assert revisit_response.json()[0]["conceptId"] == "bytes-unicode"
