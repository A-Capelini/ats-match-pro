import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Briefcase, ScanSearch, Loader2, RefreshCw, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { JobFields, type JobData } from "@/components/job-fields";
import { ResumeFields } from "@/components/resume-fields";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { ResultsReport } from "@/components/results-report";
import { ScoreComparison } from "@/components/score-comparison";
import { ResumeEditor } from "@/components/resume-editor";
import { HistoryList } from "@/components/history-list";
import { analyzeResume, type AnalysisResult } from "@/lib/ats-analysis";
import { clearSession, emptySession, loadSession, saveSession } from "@/lib/session";

type Props = {
  /**
   * @deprecated O fluxo BYOK (Bring Your Own Key) foi removido em 2026-08 —
   * a chave sempre viveu apenas no backend (.env). Prop mantida opcional só
   * para não quebrar componentes pai que ainda a repassam; pode ser
   * removida de vez assim que o modal de Configurações de API Key for
   * descontinuado.
   */
  onRequireApiKey?: () => void;
};

export function AnalysisForm(_props: Props) {
  const [tab, setTab] = useState("job");
  const [job, setJob] = useState<JobData>(emptySession.job);
  const [resume, setResume] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [optimizedResume, setOptimizedResume] = useState("");
  const [analyzedResume, setAnalyzedResume] = useState("");
  const [restored, setRestored] = useState(false);
  // Incrementado a cada análise concluída: força a aba de Histórico a
  // recarregar a lista na próxima vez que for aberta (ver HistoryList key).
  const [historyVersion, setHistoryVersion] = useState(0);

  // Restaura a sessão anterior (localStorage) após a hidratação.
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setJob(saved.job);
      setResume(saved.resume);
      setResult(saved.result);
      setAnalyzedResume(saved.analyzedResume);
      setOptimizedResume(saved.optimizedResume);
    }
    setRestored(true);
  }, []);

  // Persiste cada alteração para o usuário voltar exatamente onde parou.
  useEffect(() => {
    if (!restored) return;
    saveSession({ job, resume, result, analyzedResume, optimizedResume });
  }, [restored, job, resume, result, analyzedResume, optimizedResume]);

  const jobEmpty = !job.description.trim();
  const resumeEmpty = !resume.trim();
  const hasSessionData = Boolean(job.title || job.description || resume || result);

  function handleNewAnalysis() {
    clearSession();
    setJob(emptySession.job);
    setResume("");
    setResult(null);
    setAnalyzedResume("");
    setOptimizedResume("");
    setSubmitted(false);
    setTab("job");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Nova análise iniciada", {
      description: "Os dados anteriores foram apagados deste navegador.",
    });
  }

  async function handleAnalyze() {
    setSubmitted(true);

    if (jobEmpty && resumeEmpty) {
      toast.error("Campos obrigatórios", {
        description: "Preencha a descrição da vaga e o texto do seu currículo.",
      });
      setTab("job");
      return;
    }

    if (jobEmpty) {
      toast.error("Descrição da vaga obrigatória", {
        description: "Cole o texto completo da vaga para comparar as palavras-chave.",
      });
      setTab("job");
      return;
    }

    if (resumeEmpty) {
      toast.error("Currículo obrigatório", {
        description: "Cole o texto do seu currículo atual para iniciar a análise.",
      });
      setTab("resume");
      return;
    }

    setLoading(true);
    setResult(null);
    setOptimizedResume("");
    try {
      const analysis = await analyzeResume(job, resume);
      setResult(analysis);
      setOptimizedResume(analysis.optimizedResume);
      setAnalyzedResume(resume);
      setHistoryVersion((v) => v + 1);
      toast.success("Análise concluída", {
        description: `Compatibilidade estimada em ${analysis.score}%.`,
      });
    } catch {
      /* O toast de erro já é exibido dentro de analyzeResume, com a mensagem
         real do servidor (HTTP 500, timeout, CORS, etc.). Aqui apenas deixamos
         o bloco `finally` resetar o estado de loading. */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="job" className="min-h-11 gap-2">
                <Briefcase className="size-4" aria-hidden="true" />
                Dados da vaga
              </TabsTrigger>
              <TabsTrigger value="resume" className="min-h-11 gap-2">
                <FileText className="size-4" aria-hidden="true" />
                Seu currículo
              </TabsTrigger>
              <TabsTrigger value="history" className="min-h-11 gap-2">
                <History className="size-4" aria-hidden="true" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="job" className="mt-6 focus-visible:outline-none">
              <JobFields value={job} onChange={setJob} descriptionInvalid={submitted && jobEmpty} />
            </TabsContent>

            <TabsContent value="resume" className="mt-6 focus-visible:outline-none">
              <ResumeFields
                value={resume}
                onChange={setResume}
                invalid={submitted && resumeEmpty}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6 focus-visible:outline-none">
              {/* `key` força remontagem (e recarga da lista) a cada nova análise */}
              <HistoryList key={historyVersion} />
            </TabsContent>
          </Tabs>

          {tab !== "history" && (
            <div className="mt-8 border-t border-border pt-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={loading}
                    aria-label="Analisar compatibilidade com sistemas ATS"
                    className="min-h-12 w-full gap-2 text-base font-semibold focus-visible:ring-offset-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <ScanSearch aria-hidden="true" />
                    )}
                    {loading ? "Analisando…" : "Analisar Compatibilidade (ATS)"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Compara palavras-chave, requisitos e estrutura do seu currículo com a vaga.
                </TooltipContent>
              </Tooltip>

              {hasSessionData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleNewAnalysis}
                      aria-label="Iniciar uma nova análise e limpar os dados salvos"
                      className="mt-3 min-h-11 w-full gap-2 focus-visible:ring-offset-2"
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      Nova análise
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Limpa os formulários e o relatório salvos neste navegador.
                  </TooltipContent>
                </Tooltip>
              )}

              <p className="mt-3 text-center text-sm text-muted-foreground">
                Gratuito e sem cadastro. Seus dados de sessão permanecem apenas neste navegador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div aria-live="polite">
        {loading && <AnalysisSkeleton />}
        {!loading && result && (
          <div className="space-y-8">
            <ScoreComparison originalScore={result.score} optimizedScore={result.optimizedScore} />
            <ResultsReport result={result} jobTitle={job.title.trim()} />
            <ResumeEditor
              originalResume={analyzedResume}
              optimizedResume={optimizedResume}
              onOptimizedChange={setOptimizedResume}
              onReset={() => setOptimizedResume(result.optimizedResume)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
