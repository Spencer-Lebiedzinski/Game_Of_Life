from __future__ import annotations

import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "canvas_tokens.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS canvas_tokens (
                user_id TEXT PRIMARY KEY,
                token TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_token(user_id: str, token: str) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO canvas_tokens (user_id, token)
            VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                token = excluded.token,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, token),
        )
        conn.commit()
    finally:
        conn.close()


def get_token(user_id: str) -> str | None:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT token FROM canvas_tokens WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return row["token"] if row else None
    finally:
        conn.close()


def delete_token(user_id: str) -> None:
    conn = get_conn()
    try:
        conn.execute("DELETE FROM canvas_tokens WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


def has_token(user_id: str) -> bool:
    return get_token(user_id) is not None