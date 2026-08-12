"""Rota POST /api/analyze.

Responsabilidades desta camada (fina, de propósito):
    - Validar o payload de entrada (via Pydantic, em `schemas.py`).
    - Aplicar rate limiting por IP (via `limiter`, em `limiter.py`).
    - Delegar a lógica de negócio para `services/analysis_service.py`.
    - Traduzir falhas do serviço em HTTPException apropriada.

Nenhuma chamada direta à LLM deve acontecer aqui — isso vive no service.
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from limiter import DEFAULT_ANALYZE_LIMIT, limiter
from schemas import AnalyzeRequest, AnalyzeResponse
from services.analysis_service import AnalysisServiceError, analyze_resume

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit(DEFAULT_ANALYZE_LIMIT)
async def analyze(request: Request, payload: AnalyzeRequest) -> AnalyzeResponse:
    """Analisa a compatibilidade entre um currículo e uma vaga.

    Rate limit: ver `ANALYZE_RATE_LIMIT` no `.env` (padrão: 5/minute por IP).
    """
    try:
        return await analyze_resume(payload)
    except AnalysisServiceError as exc:
        logger.warning("Falha na análise: %s", exc.message)
        raise HTTPException(status_code=500, detail=exc.message) from exc
