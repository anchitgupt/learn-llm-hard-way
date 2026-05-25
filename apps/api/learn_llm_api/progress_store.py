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

    @staticmethod
    def _row_to_progress(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "conceptId": row["concept_id"],
            "status": row["status"],
            "confidence": row["confidence"],
            "note": row["note"],
            "revisit": bool(row["revisit"]),
        }
