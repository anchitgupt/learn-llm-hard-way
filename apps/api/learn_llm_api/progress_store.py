from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


class ProgressStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.database_path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS concept_progress (
                  concept_id TEXT PRIMARY KEY,
                  status TEXT NOT NULL,
                  confidence INTEGER NOT NULL,
                  note TEXT NOT NULL,
                  revisit INTEGER NOT NULL CHECK (revisit IN (0, 1)),
                  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS checkpoint_attempts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  concept_id TEXT NOT NULL,
                  submitted_answer TEXT NOT NULL,
                  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
                  feedback TEXT NOT NULL,
                  confidence INTEGER NOT NULL,
                  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS lab_runs (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  lab_id TEXT NOT NULL,
                  concept_id TEXT NOT NULL,
                  artifact_path TEXT NOT NULL,
                  status TEXT NOT NULL,
                  error TEXT NOT NULL DEFAULT '',
                  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def save_progress(
        self,
        concept_id: str,
        status: str,
        confidence: int,
        note: str,
        revisit: bool,
    ) -> None:
        with sqlite3.connect(self.database_path) as connection:
            connection.execute(
                """
                INSERT INTO concept_progress (concept_id, status, confidence, note, revisit)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(concept_id) DO UPDATE SET
                  status = excluded.status,
                  confidence = excluded.confidence,
                  note = excluded.note,
                  revisit = excluded.revisit,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (concept_id, status, confidence, note, int(revisit)),
            )

    def get_progress(self, concept_id: str) -> dict[str, Any] | None:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute(
                """
                SELECT concept_id, status, confidence, note, revisit
                FROM concept_progress
                WHERE concept_id = ?
                """,
                (concept_id,),
            ).fetchone()
        return self._row_to_progress(row) if row else None

    def list_revisit(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT concept_id, status, confidence, note, revisit
                FROM concept_progress
                WHERE revisit = 1
                ORDER BY updated_at DESC, concept_id ASC
                """
            ).fetchall()
        return [self._row_to_progress(row) for row in rows]

    def list_progress(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT concept_id, status, confidence, note, revisit
                FROM concept_progress
                ORDER BY updated_at DESC, concept_id ASC
                """
            ).fetchall()
        return [self._row_to_progress(row) for row in rows]

    def record_checkpoint_attempt(
        self,
        concept_id: str,
        submitted_answer: str,
        correct: bool,
        feedback: str,
        confidence: int,
    ) -> dict[str, Any]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute(
                """
                INSERT INTO checkpoint_attempts (concept_id, submitted_answer, correct, feedback, confidence)
                VALUES (?, ?, ?, ?, ?)
                RETURNING concept_id, submitted_answer, correct, feedback, confidence
                """,
                (concept_id, submitted_answer, int(correct), feedback, confidence),
            ).fetchone()
        return self._row_to_checkpoint_attempt(row)

    def record_lab_run(
        self,
        lab_id: str,
        concept_id: str,
        artifact_path: str,
        status: str,
        error: str = "",
    ) -> dict[str, Any]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute(
                """
                INSERT INTO lab_runs (lab_id, concept_id, artifact_path, status, error)
                VALUES (?, ?, ?, ?, ?)
                RETURNING lab_id, concept_id, artifact_path, status, error
                """,
                (lab_id, concept_id, artifact_path, status, error),
            ).fetchone()
        return self._row_to_lab_run(row)

    def list_missed_topics(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT concept_id, 'manual-revisit' AS reason, updated_at
                FROM concept_progress
                WHERE revisit = 1
                UNION ALL
                SELECT concept_id, 'low-confidence' AS reason, updated_at
                FROM concept_progress
                WHERE confidence <= 2
                UNION ALL
                SELECT concept_id, 'failed-checkpoint' AS reason, created_at AS updated_at
                FROM checkpoint_attempts
                WHERE correct = 0
                ORDER BY updated_at DESC, concept_id ASC
                """
            ).fetchall()

        seen: set[str] = set()
        missed: list[dict[str, Any]] = []
        for row in rows:
            if row["concept_id"] in seen:
                continue
            seen.add(row["concept_id"])
            missed.append({"conceptId": row["concept_id"], "reason": row["reason"]})
        return missed

    def list_recent_artifacts(self, limit: int = 5) -> list[dict[str, Any]]:
        with sqlite3.connect(self.database_path) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT lab_id, concept_id, artifact_path, status, error
                FROM lab_runs
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [self._row_to_lab_run(row) for row in rows]

    @staticmethod
    def _row_to_progress(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "conceptId": row["concept_id"],
            "status": row["status"],
            "confidence": row["confidence"],
            "note": row["note"],
            "revisit": bool(row["revisit"]),
        }

    @staticmethod
    def _row_to_checkpoint_attempt(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "conceptId": row["concept_id"],
            "submittedAnswer": row["submitted_answer"],
            "correct": bool(row["correct"]),
            "feedback": row["feedback"],
            "confidence": row["confidence"],
        }

    @staticmethod
    def _row_to_lab_run(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "labId": row["lab_id"],
            "conceptId": row["concept_id"],
            "artifactPath": row["artifact_path"],
            "status": row["status"],
            "error": row["error"],
        }
