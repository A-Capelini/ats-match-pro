/**
 * Identificador anônimo de sessão (Fase 3 — histórico).
 *
 * Gerado uma única vez por navegador (crypto.randomUUID) e persistido no
 * localStorage. Não é autenticação — não há conta, senha nem servidor
 * validando "quem" é o usuário. Serve apenas para o backend conseguir
 * agrupar "as análises feitas neste navegador" sem pedir cadastro.
 *
 * Enviado em toda chamada como o header `X-Session-Id`.
 */

const STORAGE_KEY = "ats-match-pro:session-id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // storage indisponível (modo privado restrito, cota excedida, etc.):
    // devolve um UUID novo a cada chamada — a análise principal continua
    // funcionando, só o histórico fica sem persistência entre reloads.
    return crypto.randomUUID();
  }
}
