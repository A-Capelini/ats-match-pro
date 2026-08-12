import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type JobData = {
  title: string;
  description: string;
};

type Props = {
  value: JobData;
  onChange: (value: JobData) => void;
  descriptionInvalid?: boolean;
};

export function JobFields({ value, onChange, descriptionInvalid }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="job-title">Título da vaga</Label>
        <Input
          id="job-title"
          aria-label="Título da vaga"
          placeholder="Ex.: Analista de Dados Pleno"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>

      {/*
        Campo "Link da vaga" removido (2026-08).
        Motivo: o backend não faz scraping da URL — o campo era decorativo
        e enganava o usuário. Reintroduzir apenas quando o endpoint de
        extração automática (fetch + parse da vaga) for implementado.
      */}

      <div className="grid gap-2">
        <Label htmlFor="job-description">Descrição da vaga</Label>
        <Textarea
          id="job-description"
          aria-label="Descrição da vaga"
          aria-required="true"
          aria-invalid={descriptionInvalid || undefined}
          aria-describedby="job-description-help"
          placeholder="Cole aqui a descrição completa da vaga: responsabilidades, requisitos e diferenciais."
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className="min-h-56 resize-y font-mono text-sm leading-relaxed"
        />
        <p id="job-description-help" className="text-sm text-muted-foreground">
          Campo obrigatório. Quanto mais completa a descrição, melhor a comparação de
          palavras-chave.
        </p>
      </div>
    </div>
  );
}
