"""Camada de acesso ao SQLite — histórico de análises (resumo, anônimo).

Escopo deliberadamente enxuto (decisão de produto):
    - Guarda apenas RESUMO de cada análise (título da vaga, scores, data).
    - NÃO guarda o texto do currículo, da vaga, nem o currículo otimizado —
      são dados pessoais, e o produto é anônimo/sem login por design.
    - Identificação por `session_id` (UUID gerado no navegador, sem conta).

O arquivo do banco fica fora do versionamento (ver .gitignore: backend/data/).
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DB_PATH = Path(os.getenv("HISTORY_DB_PATH", Path(__file__).parent / "data" / "history.db"))


def init_db() -> None:
    """Cria a pasta/arquivo do banco e a tabela, se ainda não existirem.

    Chamado uma vez, na inicialização da aplicação (main.py).
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id      TEXT    NOT NULL,
                job_title       TEXT    NOT NULL,
                score           INTEGER NOT NULL,
                optimized_score INTEGER NOT NULL,
                created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_analyses_session ON analyses(session_id)"
        )
        conn.commit()


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Context manager que devolve uma conexão com row_factory configurado.

    Uso:
        with get_connection() as conn:
            conn.execute(...)
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def save_analysis(session_id: str, job_title: str, score: int, optimized_score: int) -> None:
    """Grava um resumo de análise no histórico do `session_id` informado."""
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO analyses (session_id, job_title, score, optimized_score)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, job_title.strip() or "Vaga sem título", score, optimized_score),
        )
        conn.commit()


def list_analyses(session_id: str, limit: int = 50) -> list[sqlite3.Row]:
    """Lista as análises mais recentes de um `session_id`, mais recentes primeiro."""
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT id, job_title, score, optimized_score, created_at
            FROM analyses
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (session_id, limit),
        ).fetchall()


def delete_analysis(session_id: str, analysis_id: int) -> bool:
    """Remove uma análise específica, se pertencer ao `session_id` informado.

    Retorna True se algo foi de fato removido (protege contra IDs de outra
    sessão — sem isso, um session_id qualquer poderia apagar registros
    alheios só adivinhando o ID).
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM analyses WHERE id = ? AND session_id = ?",
            (analysis_id, session_id),
        )
        conn.commit()
        return cursor.rowcount > 0
