"""Rotas do histórico de análises (Fase 3).

Todas as rotas exigem o header `X-Session-Id` — um UUID gerado e persistido
pelo frontend (localStorage), sem cadastro/login. É o único "identificador
de usuário" do produto, propositalmente anônimo.
"""

from fastapi import APIRouter, Header, HTTPException

import database
from schemas import HistoryEntry, HistoryListResponse

router = APIRouter()


@router.get("/api/analyses", response_model=HistoryListResponse)
def get_history(
    x_session_id: str = Header(..., alias="X-Session-Id", min_length=1),
) -> HistoryListResponse:
    """Lista as análises anteriores da sessão (mais recente primeiro, máx. 50)."""
    rows = database.list_analyses(session_id=x_session_id)
    return HistoryListResponse(
        items=[
            HistoryEntry(
                id=row["id"],
                job_title=row["job_title"],
                score=row["score"],
                optimized_score=row["optimized_score"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
    )


@router.delete("/api/analyses/{analysis_id}", status_code=204)
def delete_history_entry(
    analysis_id: int,
    x_session_id: str = Header(..., alias="X-Session-Id", min_length=1),
) -> None:
    """Remove uma entrada do histórico. Só afeta registros da própria sessão."""
    deleted = database.delete_analysis(session_id=x_session_id, analysis_id=analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Análise não encontrada (ou pertence a outra sessão).",
        )
