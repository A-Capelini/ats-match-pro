import { CheckCircle2, AlertTriangle, Lightbulb, FileCheck2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/lib/ats-analysis";

function scoreTone(score: number) {
  if (score < 50)
    return {
      label: "Baixa compatibilidade",
      text: "text-danger",
      ring: "border-danger",
      bar: "bg-danger",
      surface: "bg-danger-soft",
    };
  if (score < 80)
    return {
      label: "Compatibilidade moderada",
      text: "text-warning",
      ring: "border-warning",
      bar: "bg-warning",
      surface: "bg-warning-soft",
    };
  return {
    label: "Alta compatibilidade",
    text: "text-success",
    ring: "border-success",
    bar: "bg-success",
    surface: "bg-success-soft",
  };
}

type Props = {
  result: AnalysisResult;
  jobTitle?: string;
};

export function ResultsReport({ result, jobTitle }: Props) {
  const tone = scoreTone(result.score);

  return (
    <section aria-labelledby="report-title" className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="gap-1 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <FileCheck2 className="size-4" aria-hidden="true" />
            Relatório de auditoria ATS
          </div>
          <CardTitle id="report-title" className="text-xl">
            Compatibilidade{jobTitle ? ` — ${jobTitle}` : ""}
          </CardTitle>
          <CardDescription>
            Resultado da comparação entre o texto da vaga e o seu currículo.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div
              className={`grid size-28 shrink-0 place-items-center rounded-full border-4 ${tone.ring} ${tone.surface}`}
              role="img"
              aria-label={`Pontuação de compatibilidade: ${result.score} por cento — ${tone.label}`}
            >
              <span className={`text-3xl font-bold tabular-nums ${tone.text}`}>
                {result.score}%
              </span>
            </div>

            <div className="w-full min-w-0 space-y-3 text-center sm:text-left">
              <p className={`text-lg font-semibold ${tone.text}`}>{tone.label}</p>
              <Progress
                value={result.score}
                aria-label="Barra de pontuação de compatibilidade"
                indicatorClassName={tone.bar}
              />
              <dl className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground sm:justify-start">
                <div className="flex gap-1">
                  <dt>Pontos fortes:</dt>
                  <dd className="font-medium text-foreground">{result.strengths.length}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Lacunas:</dt>
                  <dd className="font-medium text-foreground">{result.weaknesses.length}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Sugestões:</dt>
                  <dd className="font-medium text-foreground">{result.suggestions.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <Tabs defaultValue="strengths">
            <TabsList className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3">
              <TabsTrigger value="strengths" className="min-h-11">
                Pontos fortes
              </TabsTrigger>
              <TabsTrigger value="weaknesses" className="min-h-11">
                Pontos fracos
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="min-h-11">
                Sugestões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strengths" className="mt-6 focus-visible:outline-none">
              <h3 className="text-sm font-semibold text-foreground">
                Requisitos atendidos pelo seu currículo
              </h3>
              <Separator className="my-4" />
              <ul className="flex flex-wrap gap-2">
                {result.strengths.map((item) => (
                  <li key={item}>
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-success bg-success-soft py-1.5 text-success"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="weaknesses" className="mt-6 focus-visible:outline-none">
              <h3 className="text-sm font-semibold text-foreground">
                Requisitos da vaga ausentes ou pouco evidentes
              </h3>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {result.weaknesses.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-danger"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-6 focus-visible:outline-none">
              <h3 className="text-sm font-semibold text-foreground">
                Ajustes estruturais recomendados para leitores ATS
              </h3>
              <Separator className="my-4" />
              <ol className="space-y-3">
                {result.suggestions.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Aplique as sugestões e rode a análise novamente para acompanhar a evolução da
                pontuação.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
