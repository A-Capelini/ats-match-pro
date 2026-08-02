import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { AnalysisForm } from "@/components/analysis-form";
import { SettingsDialog } from "@/components/settings-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATS Match Pro — Otimize seu currículo para sistemas ATS" },
      {
        name: "description",
        content:
          "Compare seu currículo com a descrição da vaga e aumente a compatibilidade com filtros ATS. Gratuito, sem cadastro.",
      },
      { property: "og:title", content: "ATS Match Pro — Currículo aprovado no ATS" },
      {
        property: "og:description",
        content:
          "Cole a vaga e o seu currículo para analisar a compatibilidade com sistemas de triagem automatizada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-muted/40">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

        <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
          <section className="mb-8 max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              Análise de compatibilidade
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Seu currículo aprovado na triagem automática
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Informe os dados da vaga e cole o texto do seu currículo. Vamos comparar termos,
              requisitos e estrutura para indicar o que ajustar antes de se candidatar.
            </p>
          </section>

          <AnalysisForm onRequireApiKey={() => setSettingsOpen(true)} />
        </main>
      </div>
    </TooltipProvider>
  );
}
