import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Copy, Download, FileText, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Estilo que reproduz exatamente como um leitor ATS interpreta o texto:
 *  coluna única, fonte segura, preto sobre branco, sem formatação visual. */
const atsSurface: React.CSSProperties = {
  fontFamily: "Arial, Roboto, Helvetica, sans-serif",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#000000",
  backgroundColor: "#ffffff",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 420)}px`;
  }, [value]);
  return ref;
}

type Props = {
  originalResume: string;
  optimizedResume: string;
  onOptimizedChange: (value: string) => void;
  onReset: () => void;
};

export function ResumeEditor({
  originalResume,
  optimizedResume,
  onOptimizedChange,
  onReset,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const desktopRef = useAutoGrow(optimizedResume);
  const mobileRef = useAutoGrow(optimizedResume);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(optimizedResume);
      toast.success("Currículo copiado", {
        description: "Cole em um documento em branco e salve como PDF com texto selecionável.",
      });
    } catch {
      toast.error("Não foi possível copiar", {
        description: "Selecione o texto manualmente e copie com Ctrl+C.",
      });
    }
  }

  /** Usa a impressão nativa do navegador: o CSS @media print isola o
   *  #ats-print-area, gerando um PDF com texto puro e selecionável. */
  function handleDownloadPdf() {
    toast.info("Abrindo a janela de impressão", {
      description: "Escolha 'Salvar como PDF' para gerar o arquivo pronto para o ATS.",
    });
    window.print();
  }

  const renderOriginal = (idSuffix: string) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground" id={`original-resume-label-${idSuffix}`}>
        Currículo original
      </h3>
      <p className="text-sm text-muted-foreground">Somente leitura, como você colou.</p>
      <div
        role="region"
        aria-labelledby={`original-resume-label-${idSuffix}`}
        tabIndex={0}
        style={atsSurface}
        className="h-[420px] overflow-auto rounded-md border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {originalResume}
      </div>
    </div>
  );

  const renderOptimized = (idSuffix: string, ref?: React.Ref<HTMLTextAreaElement>) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        <label htmlFor={`optimized-resume-${idSuffix}`}>Currículo otimizado (editável)</label>
      </h3>
      <p className="text-sm text-muted-foreground" id={`optimized-resume-help-${idSuffix}`}>
        Coluna única, sem tabelas e sem ícones — exatamente como o robô ATS lê.
      </p>
      <textarea
        id={`optimized-resume-${idSuffix}`}
        ref={ref}
        value={optimizedResume}
        onChange={(event) => onOptimizedChange(event.target.value)}
        aria-label="Editor do currículo otimizado para ATS"
        aria-describedby={`optimized-resume-help-${idSuffix}`}
        spellCheck
        style={atsSurface}
        className="block min-h-[420px] w-full resize-none overflow-hidden rounded-md border-2 border-primary p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );

  return (
    <section aria-labelledby="editor-title" className="space-y-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="gap-1 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
            Gerador ATS-friendly
          </div>
          <CardTitle id="editor-title" className="text-xl">
            Seu novo currículo otimizado
          </CardTitle>
          <CardDescription>
            Compare, edite livremente e mantenha a formatação simples: texto puro, coluna única e
            títulos convencionais.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Telas grandes: duas colunas lado a lado */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-2">
            {renderOriginal("desktop")}
            {renderOptimized("desktop", desktopRef)}
          </div>

          {/* Telas menores: abas */}
          <Tabs defaultValue="optimized" className="lg:hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original" className="min-h-11 gap-2">
                <FileText className="size-4" aria-hidden="true" />
                Original
              </TabsTrigger>
              <TabsTrigger value="optimized" className="min-h-11 gap-2">
                <Sparkles className="size-4" aria-hidden="true" />
                Otimizado
              </TabsTrigger>
            </TabsList>
            <TabsContent value="original" className="mt-6 focus-visible:outline-none">
              {renderOriginal("mobile")}
            </TabsContent>
            <TabsContent value="optimized" className="mt-6 focus-visible:outline-none">
              {renderOptimized("mobile", mobileRef)}
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  aria-label="Baixar o currículo otimizado em PDF"
                  className="min-h-11 gap-2 focus-visible:ring-offset-2 sm:w-auto"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Baixar Currículo (PDF)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Gera um PDF formatado especificamente para leitura de robôs (texto puro, Arial,
                coluna única).
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCopy}
                  aria-label="Copiar currículo otimizado para a área de transferência"
                  className="min-h-11 gap-2 focus-visible:ring-offset-2 sm:w-auto"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copiar texto
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copia o texto editado para colar em outro editor ou formulário de candidatura.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  aria-label="Restaurar a versão gerada pela análise"
                  className="min-h-11 gap-2 focus-visible:ring-offset-2 sm:w-auto"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Restaurar versão gerada
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Descarta suas edições e volta ao texto sugerido pela análise.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Único bloco visível na impressão — renderizado como filho direto de
          <body> para que o restante da interface possa ser removido do PDF. */}
      {mounted && createPortal(<div id="ats-print-area">{optimizedResume}</div>, document.body)}
    </section>
  );
}
