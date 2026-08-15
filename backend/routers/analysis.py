"""Rota POST /api/analyze.

Responsabilidades desta camada (fina, de propósito):
    - Validar o payload de entrada (via Pydantic, em `schemas.py`).
    - Aplicar rate limiting por IP (via `limiter`, em `limiter.py`).
    - Delegar a lógica de negócio para `services/analysis_service.py`.
    - Salvar um resumo no histórico (Fase 3), se a sessão for informada.
    - Traduzir falhas do serviço em HTTPException apropriada.

Nenhuma chamada direta à LLM deve acontecer aqui — isso vive no service.
"""

import logging

from fastapi import APIRouter, Header, HTTPException, Request

import database
from limiter import DEFAULT_ANALYZE_LIMIT, limiter
from schemas import AnalyzeRequest, AnalyzeResponse
from services.analysis_service import AnalysisServiceError, analyze_resume

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit(DEFAULT_ANALYZE_LIMIT)
async def analyze(
    request: Request,
    payload: AnalyzeRequest,
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> AnalyzeResponse:
    """Analisa a compatibilidade entre um currículo e uma vaga.

    Rate limit: ver `ANALYZE_RATE_LIMIT` no `.env` (padrão: 5/minute por IP).

    Se o header `X-Session-Id` for enviado, um resumo da análise (título da
    vaga + scores) é salvo no histórico dessa sessão. O header é opcional
    de propósito: sua ausência não deve nunca impedir a análise de rodar —
    o histórico é um extra, não um requisito da funcionalidade principal.
    """
    try:
        result = await analyze_resume(payload)
    except AnalysisServiceError as exc:
        logger.warning("Falha na análise: %s", exc.message)
        raise HTTPException(status_code=500, detail=exc.message) from exc

    if x_session_id:
        try:
            database.save_analysis(
                session_id=x_session_id,
                job_title=payload.job_title,
                score=result.score,
                optimized_score=result.optimized_score,
            )
        except Exception:
            # Falha ao salvar histórico NUNCA deve quebrar a resposta da análise.
            logger.exception("Falha ao salvar histórico (session_id=%s)", x_session_id)

    return result
