import type { JobData } from "@/components/job-fields";
import type { AnalysisResult } from "@/lib/ats-analysis";

const STORAGE_KEY = "ats-match-pro:session";

export type SessionState = {
  job: JobData;
  resume: string;
  result: AnalysisResult | null;
  analyzedResume: string;
  optimizedResume: string;
};

export const emptySession: SessionState = {
  job: { title: "", link: "", description: "" },
  resume: "",
  result: null,
  analyzedResume: "",
  optimizedResume: "",
};

/** Lê a sessão salva. Retorna null quando não há nada persistido (ou no SSR). */
export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      ...emptySession,
      ...parsed,
      job: { ...emptySession.job, ...(parsed.job ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveSession(state: SessionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage indisponível ou cota excedida */
  }
}

/** Limpa apenas os dados da análise — a chave de API do usuário é preservada. */
export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage indisponível */
  }
}
