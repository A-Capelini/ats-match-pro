"""
ATS Match Pro — API REST (FastAPI)
===================================

Backend da aplicação de análise de currículos para sistemas ATS
(Applicant Tracking Systems).

Estrutura:
    main.py                        -> app, CORS, health check, registro de routers
    database.py                    -> SQLite (histórico de análises, Fase 3)
    schemas.py                     -> modelos Pydantic (request/response)
    prompts.py                     -> SYSTEM_PROMPT + esquema JSON + user prompt
    routers/analysis.py            -> POST /api/analyze
    routers/history.py             -> GET/DELETE /api/analyses (histórico)
    services/analysis_service.py   -> integração real com a LLM (OpenAI/Gemini)

Regras de ouro (inquebráveis):
- A IA NÃO PODE alucinar qualificações ausentes no currículo original.
- O `ats_optimized_resume` é uma REORGANIZAÇÃO dos fatos existentes.
- O histórico guarda apenas RESUMO (nunca currículo/vaga), é anônimo
  por session_id (sem login) e nunca deve impedir a análise principal.

Execução local (desenvolvimento):
    pip install -r requirements.txt
    cp .env.example .env   # e preencha a chave do provedor escolhido
    uvicorn main:app --reload --port 8000
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

# Carrega variáveis do .env ANTES de importar módulos que leem os defaults.
load_dotenv()

from database import init_db  # noqa: E402
from limiter import limiter  # noqa: E402
from routers.analysis import router as analysis_router  # noqa: E402
from routers.history import router as history_router  # noqa: E402

# --------------------------------------------------------------------------- #
# Configuração da aplicação
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="ATS Match Pro API",
    description=(
        "API REST para análise de compatibilidade entre currículos e "
        "descrições de vagas (ATS) com geração de currículo otimizado."
    ),
    version="0.3.0",
)

# Cria a tabela do histórico (se ainda não existir) na subida do servidor.
init_db()

# --------------------------------------------------------------------------- #
# Rate Limiting (slowapi)
# --------------------------------------------------------------------------- #
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Limite de análises atingido. Tente novamente em alguns minutos."
            ),
        },
    )


# --------------------------------------------------------------------------- #
# CORS
# --------------------------------------------------------------------------- #
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    # X-Session-Id precisa estar liberado explicitamente para o navegador
    # conseguir enviá-lo em requisições cross-origin (dev: 8080 -> 8000).
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Routers
# --------------------------------------------------------------------------- #

app.include_router(analysis_router)  # expõe POST /api/analyze
app.include_router(history_router)   # expõe GET/DELETE /api/analyses


# --------------------------------------------------------------------------- #
# Infra
# --------------------------------------------------------------------------- #

@app.get("/health", tags=["infra"])
def health_check() -> dict[str, str]:
    """Health check simples.

    Retorna 200 OK quando o servidor está no ar, além do provedor de IA ativo.
    """
    return {
        "status": "ok",
        "provider": os.getenv("LLM_PROVIDER", "openai"),
    }
