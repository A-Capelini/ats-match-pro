import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, History as HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deleteAnalysisEntry, listAnalyses, type HistoryItem } from "@/lib/ats-analysis";

/** Formata o timestamp UTC do backend (ISO 8601) para "dd/mm/aaaa às hh:mm". */
function formatDate(iso: string): string {
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Aba "Histórico" — lista as análises anteriores desta sessão (anônima,
 * por navegador). Mostra apenas o resumo: o backend nunca guarda o
 * currículo, a vaga ou o currículo otimizado (ver database.py).
 */
export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchHistory() {
    setLoading(true);
    try {
      const data = await listAnalyses();
      setItems(data);
    } catch {
      // Histórico é funcionalidade secundária: falha aqui não deve
      // incomodar o usuário com um toast — só mostra estado vazio/erro leve.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteAnalysisEntry(id);
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
      toast.success("Removido do histórico");
    } catch {
      toast.error("Não foi possível remover este item", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Carregando histórico…
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
        <HistoryIcon className="size-8" aria-hidden="true" />
        <p className="font-medium">Nenhuma análise ainda</p>
        <p className="text-sm">
          Suas análises anteriores neste navegador vão aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.jobTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-sm">
                  <span className={scoreColorClass(item.score)}>{item.score}%</span>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className={scoreColorClass(item.optimizedScore)}>
                    {item.optimizedScore}%
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover análise "${item.jobTitle}" do histórico`}
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover do histórico</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
