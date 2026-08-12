import { toast } from "sonner";

import type { JobData } from "@/components/job-fields";

export type AnalysisResult = {
  score: number;
  optimizedScore: number;
  optimizedResume: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

/**
 * URL base do backend FastAPI.
 *
 * Em desenvolvimento o servidor Python roda em http://localhost:8000.
 * Em outros ambientes defina `VITE_API_BASE_URL` (ex.: num `.env` do Vite).
 */
const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

/**
 * Contrato exato retornado pelo endpoint `POST /api/analyze` (backend Python).
 *
 * Os campos `optimized_score` e `suggestions` são opcionais para manter
 * compatibilidade com versões anteriores do backend; quando ausentes, o
 * frontend adota fallbacks seguros (sem fabricar dados).
 */
type BackendAnalysisResponse = {
  score: number;
  strengths: string[];
  missing_keywords: string[];
  ats_optimized_resume: string;
  optimized_score?: number;
  suggestions?: string[];
};

/**
 * Envia a vaga e o currículo para o backend e devolve a análise ATS.
 *
 * O backend detém a chave da LLM inteiramente no servidor (via `.env`).
 * Não existe mais fluxo BYOK (Bring Your Own Key) no frontend — removido em
 * 2026-08 por ser vestigial: a chave nunca era de fato enviada nem usada.
 *
 * Mapeamento backend -> AnalysisResult:
 *   score                 -> score
 *   strengths             -> strengths
 *   missing_keywords      -> weaknesses        (renomeado)
 *   ats_optimized_resume  -> optimizedResume    (renomeado)
 *   optimized_score       -> optimizedScore
 *   suggestions           -> suggestions
 *
 * Em caso de erro (HTTP 5xx, timeout, CORS, JSON inválido) um toast de erro
 * é exibido ao usuário e o erro é re-lançado, para que o chamador resete o
 * estado de "loading" no bloco `finally`.
 */
export async function analyzeResume(
  jobData: JobData,
  resumeData: string,
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: jobData.title,
        job_description: jobData.description,
        resume_text: resumeData,
      }),
    });

    if (!response.ok) {
      // O FastAPI retorna { "detail": "mensagem" } nos erros.
      let detail = `Erro do servidor (${response.status}).`;
      try {
        const errorBody = (await response.json()) as { detail?: string };
        if (errorBody.detail) detail = errorBody.detail;
      } catch {
        /* corpo não-JSON: mantém a mensagem padrão */
      }
      throw new Error(detail);
    }

    const data = (await response.json()) as BackendAnalysisResponse;

    return {
      score: data.score,
      optimizedScore: data.optimized_score ?? data.score,
      optimizedResume: data.ats_optimized_resume,
      strengths: data.strengths,
      weaknesses: data.missing_keywords,
      suggestions: data.suggestions ?? [],
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível contatar o servidor de análise.";

    toast.error("Não foi possível concluir a análise", {
      description: message,
    });

    // Re-lança para que o chamador resete o loading no `finally`.
    throw error;
  }
}
