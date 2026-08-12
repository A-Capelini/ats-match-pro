"""Serviço de análise ATS — integração real com a LLM.

Suporta dois provedores, selecionados pela variável de ambiente `LLM_PROVIDER`:

    LLM_PROVIDER=openai   (padrão)  -> usa `openai`      + OPENAI_API_KEY
    LLM_PROVIDER=gemini             -> usa `google-genai` + GEMINI_API_KEY

Ambos são forçados a devolver JSON válido:
    - OpenAI: `response_format={"type": "json_object"}` (+ schema strict quando disponível)
    - Gemini: `response_mime_type="application/json"` + `response_schema` (SDK google-genai)

IMPORTANTE: o Gemini usa o SDK novo (`google-genai`, pacote `google.genai`),
NÃO o legado `google-generativeai`. São bibliotecas diferentes, com APIs
incompatíveis entre si — misturar as duas é a causa mais comum de erro aqui.

Erros de rede, timeout, JSON inválido ou schema divergente são convertidos em
`AnalysisServiceError`, que a rota traduz em HTTP 500 com mensagem clara.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os

from pydantic import ValidationError

from prompts import RESPONSE_SCHEMA, SYSTEM_PROMPT, build_user_prompt
from schemas import AnalyzeRequest, AnalyzeResponse

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Configuração (via .env / variáveis de ambiente)
# --------------------------------------------------------------------------- #

DEFAULT_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "60"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# 'gemini-1.5-flash', 'gemini-2.5-flash' e 'gemini-2.0-flash' estão
# desativados/indisponíveis para chaves novas (404 NOT_FOUND).
# 'gemini-3.6-flash' é o modelo GA atual (lançado 21/07/2026).
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


class AnalysisServiceError(RuntimeError):
    """Falha ao obter uma análise válida da LLM.

    Atributos:
        message: mensagem amigável, segura para exibir no frontend.
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


# --------------------------------------------------------------------------- #
# Provedor: OpenAI
# --------------------------------------------------------------------------- #

async def _call_openai(user_prompt: str) -> str:
    """Chama a API da OpenAI e devolve o conteúdo bruto (string JSON)."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise AnalysisServiceError(
            "Chave de API da OpenAI não configurada no servidor (OPENAI_API_KEY)."
        )

    try:
        from openai import AsyncOpenAI  # import tardio: mantém o boot leve
    except ImportError as exc:  # pragma: no cover
        raise AnalysisServiceError(
            "Dependência 'openai' não instalada no servidor."
        ) from exc

    client = AsyncOpenAI(api_key=api_key, timeout=DEFAULT_TIMEOUT_SECONDS)

    completion = await client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.2,  # baixo: reduz criatividade e risco de alucinação
        # Força JSON válido. Se o modelo suportar structured outputs, troque por:
        # {"type": "json_schema", "json_schema": {"name": "ats_analysis",
        #  "strict": True, "schema": RESPONSE_SCHEMA}}
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = completion.choices[0].message.content
    if not content:
        raise AnalysisServiceError("A IA retornou uma resposta vazia.")
    return content


# --------------------------------------------------------------------------- #
# Provedor: Gemini (SDK novo — google-genai)
# --------------------------------------------------------------------------- #

def _call_gemini_sync(user_prompt: str) -> str:
    """Chamada síncrona ao Gemini (executada em thread separada).

    Usa o cliente `google.genai.Client` (SDK novo/oficial), com
    `system_instruction` + `response_schema` no `GenerateContentConfig`
    para obrigar o modelo a devolver JSON já validado contra o esquema.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AnalysisServiceError(
            "Chave de API do Gemini não configurada no servidor (GEMINI_API_KEY)."
        )

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:  # pragma: no cover
        raise AnalysisServiceError(
            "Dependência 'google-genai' não instalada no servidor."
        ) from exc

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise AnalysisServiceError("A IA retornou uma resposta vazia.")
    return text


async def _call_gemini(user_prompt: str) -> str:
    """Wrapper assíncrono: o SDK do Gemini é bloqueante."""
    return await asyncio.to_thread(_call_gemini_sync, user_prompt)


# --------------------------------------------------------------------------- #
# Utilitários
# --------------------------------------------------------------------------- #

def _strip_code_fences(raw: str) -> str:
    """Remove cercas markdown (```json ... ```) que alguns modelos insistem em enviar.

    Com response_mime_type='application/json' isso raramente é necessário,
    mas mantemos como rede de segurança.
    """
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1] if "\n" in text else text
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


# --------------------------------------------------------------------------- #
# Serviço público
# --------------------------------------------------------------------------- #

async def analyze_resume(request: AnalyzeRequest) -> AnalyzeResponse:
    """Executa a análise ATS chamando a LLM configurada.

    Fluxo:
        1. Monta o prompt do usuário com os dados da requisição (delimitados).
        2. Chama o provedor (OpenAI ou Gemini) com timeout global.
        3. Faz o parse do JSON e valida contra `AnalyzeResponse` (Pydantic).

    Levanta:
        AnalysisServiceError: em qualquer falha (timeout, erro da API, JSON
        inválido ou payload fora do esquema). A rota converte em HTTP 500.
    """
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    user_prompt = build_user_prompt(
        job_title=request.job_title,
        job_description=request.job_description,
        resume_text=request.resume_text,
    )

    if provider == "gemini":
        call = _call_gemini(user_prompt)
    elif provider == "openai":
        call = _call_openai(user_prompt)
    else:
        raise AnalysisServiceError(
            f"Provedor de IA desconhecido: '{provider}'. Use 'openai' ou 'gemini'."
        )

    # 1) Chamada com timeout global (proteção extra ao timeout do SDK).
    try:
        raw = await asyncio.wait_for(call, timeout=DEFAULT_TIMEOUT_SECONDS + 5)
    except asyncio.TimeoutError as exc:
        logger.warning("Timeout na chamada à LLM (%s)", provider)
        raise AnalysisServiceError(
            "A análise demorou mais do que o esperado. Tente novamente em instantes."
        ) from exc
    except AnalysisServiceError:
        raise
    except Exception as exc:  # erros de rede, rate limit, auth, etc.
        logger.exception("Falha na chamada à LLM (%s)", provider)
        raise AnalysisServiceError(
            "Não foi possível concluir a análise: o serviço de IA retornou um erro."
        ) from exc

    # 2) Parse do JSON.
    try:
        payload = json.loads(_strip_code_fences(raw))
    except json.JSONDecodeError as exc:
        logger.error("JSON inválido retornado pela LLM: %.500s", raw)
        raise AnalysisServiceError(
            "A IA retornou uma resposta em formato inválido. Tente novamente."
        ) from exc

    # 3) Validação de esquema.
    try:
        return AnalyzeResponse.model_validate(payload)
    except ValidationError as exc:
        logger.error("Payload fora do esquema esperado: %s", exc)
        raise AnalysisServiceError(
            "A IA retornou dados fora do formato esperado. Tente novamente."
        ) from exc
