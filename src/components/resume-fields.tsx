import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function ResumeFields({ value, onChange, invalid }: Props) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="resume-text">Texto do seu currículo</Label>
        <Textarea
          id="resume-text"
          aria-label="Texto do seu currículo"
          aria-required="true"
          aria-invalid={invalid || undefined}
          aria-describedby="resume-help"
          placeholder="Cole aqui o conteúdo do seu currículo atual, em texto simples."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-72 resize-y font-mono text-sm leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id="resume-help" className="text-sm text-muted-foreground">
            Campo obrigatório. Evite tabelas e imagens: sistemas ATS leem melhor texto puro.
          </p>
          <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {words} palavras
          </p>
        </div>
      </div>
    </div>
  );
}
