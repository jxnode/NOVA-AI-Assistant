
from pathlib import Path
import sqlite3

BACKEND_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BACKEND_DIR / "data" / "nova_memory.db"


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.commit()
    return connection


def save_memory(content: str) -> dict:
    content = content.strip()

    if not content or len(content) > 500:
        raise ValueError("Memory must contain 1–500 characters.")

    with get_connection() as connection:
        connection.execute(
            "INSERT OR IGNORE INTO memories (content) VALUES (?)",
            (content,),
        )
        row = connection.execute(
            "SELECT id, content, created_at FROM memories "
            "WHERE content = ?",
            (content,),
        ).fetchone()

    return dict(row)


def list_memories(limit: int = 100) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, content, created_at FROM memories "
            "ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


def delete_memory(memory_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM memories WHERE id = ?",
            (memory_id,),
        )
        return cursor.rowcount > 0


def search_memories(query: str = "", limit: int = 20) -> list[dict]:
    memories = list_memories(limit=100)

    if not query.strip():
        return memories[:limit]

    terms = set(query.lower().split())
    ranked = []

    for memory in memories:
        content = memory["content"].lower()
        score = sum(1 for term in terms if term in content)

        if score:
            ranked.append((score, memory))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [memory for _, memory in ranked[:limit]]
