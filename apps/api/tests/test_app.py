from fastapi.testclient import TestClient

from learn_llm_api.app import create_app


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
