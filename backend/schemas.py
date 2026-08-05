"""Modelos Pydantic compartilhados pela API ATS Match Pro."""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Payload enviado pelo frontend para solicitar a análise.

    Campos:
        job_title:        Título da vaga (ex.: "Analista de Dados Pleno").
        job_description:  Descrição completa da vaga, em texto corrido.
        resume_text:      Texto do currículo do candidato, em texto corrido.
    """

    job_title: str = Field(..., min_length=1, max_length=200, description="Título da vaga")
    job_description: str = Field(
        ..., min_length=1, max_length=20000, description="Descrição completa da vaga"
    )
    resume_text: str = Field(
        ..., min_length=1, max_length=30000, description="Texto do currículo do candidato"
    )


class AnalyzeResponse(BaseModel):
    """Resposta da análise, refletindo o esquema JSON do SYSTEM_PROMPT.

    Mapeamento para o frontend (AnalysisResult):
        score                -> score
        strengths            -> strengths
        missing_keywords     -> weaknesses  (renomeado)
        ats_optimized_resume -> optimizedResume
        optimized_score      -> optimizedScore
        suggestions          -> suggestions
    """

    score: int = Field(..., ge=0, le=100, description="Match score global (0-100)")
    strengths: list[str] = Field(
        default_factory=list,
        max_length=8,
        description="Requisitos atendidos pelo currículo (máx. 8 itens)",
    )
    missing_keywords: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="Requisitos ausentes no currículo (máx. 10 itens)",
    )
    ats_optimized_resume: str = Field(
        ...,
        description="Currículo otimizado em Markdown (ATS-friendly)",
    )
    optimized_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Pontuação estimada do currículo otimizado (0-100)",
    )
    suggestions: list[str] = Field(
        default_factory=list,
        max_length=8,
        description="Sugestões estruturais para melhorar a leitura ATS (máx. 8 itens)",
    )


class ErrorResponse(BaseModel):
    """Corpo de erro padronizado retornado pela API."""

    detail: str = Field(..., description="Mensagem de erro legível para o usuário")
