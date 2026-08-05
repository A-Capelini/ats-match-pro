"""
ATS Match Pro — API REST (FastAPI)
===================================

Backend da aplicação de análise de currículos para sistemas ATS
(Applicant Tracking Systems).

Estrutura:
    main.py                        -> app, CORS, health check, registro de routers
    schemas.py                     -> modelos Pydantic (request/response)
    prompts.py                     -> SYSTEM_PROMPT + esquema JSON + user prompt
    routers/analysis.py            -> POST /api/analyze
    services/analysis_service.py   -> integração real com a LLM (OpenAI/Gemini)

Regras de ouro (inquebráveis):
- A IA NÃO PODE alucinar qualificações ausentes no currículo original.
- O `ats_optimized_resume` é uma REORGANIZAÇÃO dos fatos existentes.

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

from limiter import limiter  # noqa: E402
from routers.analysis import router as analysis_router  # noqa: E402

# --------------------------------------------------------------------------- #
# Configuração da aplicação
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="ATS Match Pro API",
    description=(
        "API REST para análise de compatibilidade entre currículos e "
        "descrições de vagas (ATS) com geração de currículo otimizado."
    ),
    version="0.2.0",
)

# --------------------------------------------------------------------------- #
# Rate Limiting (slowapi)
# --------------------------------------------------------------------------- #
# O slowapi exige dois anexos na instância da app:
#   1. `app.state.limiter`     -> a instância do Limiter (usada pelos decorators)
#   2. `exception_handler`     -> captura RateLimitExceeded e devolve HTTP 429
app.state.limiter = limiter


# Exception handler custom: retorna um JSON limpo e mensagem amigável em PT-BR
# quando o IP do usuário ultrapassa o limite configurado.
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
# Origens de desenvolvimento do frontend React (Vite/CRA/Next).
# Em produção, defina ALLOWED_ORIGINS no .env como lista separada por vírgula.
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
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Routers
# --------------------------------------------------------------------------- #

app.include_router(analysis_router)  # expõe POST /api/analyze


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
