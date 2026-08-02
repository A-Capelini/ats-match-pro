import { ArrowRight, ArrowDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

function tone(score: number) {
  if (score < 50) return { text: "text-danger", ring: "border-danger", surface: "bg-danger-soft" };
  if (score < 80)
    return { text: "text-warning", ring: "border-warning", surface: "bg-warning-soft" };
  return { text: "text-success", ring: "border-success", surface: "bg-success-soft" };
}

type Props = {
  originalScore: number;
  optimizedScore: number;
};

export function ScoreComparison({ originalScore, optimizedScore }: Props) {
  const delta = optimizedScore - originalScore;
  const before = tone(originalScore);
  const after = tone(optimizedScore);

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <TrendingUp className="size-4" aria-hidden="true" />
          Evolução da pontuação
        </h2>

        <p className="sr-only">
          Pontuação original de {originalScore} por cento, pontuação otimizada de {optimizedScore}{" "}
          por cento. Ganho de {delta} pontos percentuais.
        </p>

        <div
          aria-hidden="true"
          className="mt-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
        >
          <div
            className={`flex-1 rounded-lg border ${before.ring} ${before.surface} px-4 py-5 text-center`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pontuação original
            </p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${before.text}`}>
              {originalScore}%
            </p>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="hidden size-6 text-muted-foreground sm:block" />
            <ArrowDown className="size-6 text-muted-foreground sm:hidden" />
          </div>

          <div
            className={`flex-1 rounded-lg border-2 ${after.ring} ${after.surface} px-4 py-5 text-center`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pontuação otimizada
            </p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${after.text}`}>
              {optimizedScore}%
            </p>
          </div>
        </div>

        {delta > 0 && (
          <p className="mt-4 text-center text-sm font-medium text-success">
            +{delta} pontos percentuais de compatibilidade com a vaga.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
