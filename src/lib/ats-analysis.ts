import { toast } from "sonner";

import type { JobData } from "@/components/job-fields";
import { getOrCreateSessionId } from "@/lib/session-id";

export type AnalysisResult = {
  score: number;
  optimizedScore: number;
  optimizedResume: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

/**
 * Item de histórico (Fase 3) — apenas o resumo retornado pelo backend.
 * Não inclui vaga/currículo/currículo otimizado: o backend nunca os guarda.
 */
export type HistoryItem = {
  id: number;
  jobTitle: string;
  score: number;
  optimizedScore: number;
  createdAt: string;
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

type BackendHistoryEntry = {
  id: number;
  job_title: string;
  score: number;
  optimized_score: number;
  created_at: string;
};

type BackendHistoryListResponse = {
  items: BackendHistoryEntry[];
};

/** Monta os headers padrão de toda chamada autenticada por sessão anônima. */
function sessionHeaders(): HeadersInit {
  return { "X-Session-Id": getOrCreateSessionId() };
}

/** Extrai a mensagem de erro do corpo `{ "detail": "..." }` que o FastAPI retorna. */
async function extractErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Envia a vaga e o currículo para o backend e devolve a análise ATS.
 *
 * O backend detém a chave da LLM inteiramente no servidor (via `.env`).
 * Não existe fluxo BYOK (Bring Your Own Key) no frontend — removido em
 * 2026-08 por ser vestigial: a chave nunca era de fato enviada nem usada.
 *
 * Envia o header `X-Session-Id` para que o backend salve um resumo desta
 * análise no histórico (Fase 3) — falha em salvar o histórico nunca
 * impede a análise de ser retornada normalmente.
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
      headers: { "Content-Type": "application/json", ...sessionHeaders() },
      body: JSON.stringify({
        job_title: jobData.title,
        job_description: jobData.description,
        resume_text: resumeData,
      }),
    });

    if (!response.ok) {
      const detail = await extractErrorDetail(response, `Erro do servidor (${response.status}).`);
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

/**
 * Lista o histórico de análises da sessão atual (mais recente primeiro).
 *
 * Diferente de `analyzeResume`, não exibe toast em caso de erro — quem
 * chama decide como comunicar a falha (ex.: estado vazio silencioso na aba
 * de histórico), já que essa é uma funcionalidade secundária.
 */
export async function listAnalyses(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/analyses`, {
    method: "GET",
    headers: sessionHeaders(),
  });

  if (!response.ok) {
    const detail = await extractErrorDetail(response, `Erro do servidor (${response.status}).`);
    throw new Error(detail);
  }

  const data = (await response.json()) as BackendHistoryListResponse;

  return data.items.map((item) => ({
    id: item.id,
    jobTitle: item.job_title,
    score: item.score,
    optimizedScore: item.optimized_score,
    createdAt: item.created_at,
  }));
}

/** Remove uma entrada do histórico da sessão atual. */
export async function deleteAnalysisEntry(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/analyses/${id}`, {
    method: "DELETE",
    headers: sessionHeaders(),
  });

  if (!response.ok && response.status !== 204) {
    const detail = await extractErrorDetail(response, `Erro do servidor (${response.status}).`);
    throw new Error(detail);
  }
}
