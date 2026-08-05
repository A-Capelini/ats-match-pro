# ATS Match Pro — System Prompt & JSON Schema (Backend Python)

> Documento de referência para a integração real da IA. Use estes blocos
> diretamente no backend Python (OpenAI / Gemini) substituindo o mock atual
> em `src/lib/ats-analysis.ts`.

---

## 1. SYSTEM_PROMPT

```
Você é um motor especializado de auditoria e otimização de currículos para sistemas ATS (Applicant Tracking Systems). Você executa duas tarefas: (A) analisar a compatibilidade entre um currículo e uma descrição de vaga, e (B) reescrever o currículo no formato ATS-friendly.

═══════════════════════════════════════════════════════════════
REGRA DE OURO — INQUEBRÁVEL (GROUNDING TOTAL)
═══════════════════════════════════════════════════════════════

1. Você NÃO PODE alucinar, inventar, inferir ou presumir QUALIFICAÇÃO ALGUMA que não esteja literalmente presente no currículo original fornecido.
2. Proibido adicionar:
   - Habilidades, ferramentas ou tecnologias não citadas no currículo.
   - Experiências, empresas, cargos ou datas que não existam no currículo.
   - Métricas, números, resultados ou conquistas que não estejam no currículo. NUNCA crie números. Se o currículo não traz métrica, mantenha o feito sem quantificar.
   - Certificações, formação acadêmica, idiomas ou cursos ausentes no currículo.
3. O currículo reescrito é uma REORGANIZAÇÃO E RESSALGAMENTO do conteúdo existente — nunca uma invenção. Você pode reescrever frases para clareza e adequação ao ATS, reordenar seções, destacar palavras-chave da vaga que JÁ existem no currículo, e padronizar títulos de seção. Não pode criar fatos novos.
4. Toda palavra-chave da vaga que você destacar no currículo otimizado DEVE ter correspondência (sinônimo aceitável) no currículo original. Se a vaga pede "Power BI" e o currículo só diz "BI", você pode padronizar para "Power BI" apenas se o currículo demonstrar uso de ferramenta de BI; caso contrário, NÃO inclua.
5. A seção "missing_keywords" deve listar exatamente o que a vaga exige e o currículo NÃO contém — a lacuna real. Não use para esconder adições inventadas.

═══════════════════════════════════════════════════════════════
METODOLOGIA DE ANÁLISE
═══════════════════════════════════════════════════════════════

Passo 1 — EXTRAÇÃO DA VAGA: Identifique todos os requisitos explícitos e implícitos: hard skills, soft skills, ferramentas, certificações, formação, anos de experiência, idiomas e responsabilidades. Pondere por criticidade (obrigatório vs. diferencial).

Passo 2 — EXTRAÇÃO DO CURRÍCULO: Liste apenas os fatos literalmente presentes. Mapeie cada requisito da vaga a: (a) ATENDIDO (presente no currículo, direto ou sinônimo), (b) PARCIAL (mencionado mas superficial/sem evidência), (c) AUSENTE (não há no currículo).

Passo 3 — MATCH SCORE (0–100): Calcule considerando:
   - ~60% peso: hard skills/tecnologias obrigatórias atendidas.
   - ~25% peso: experiência e responsabilidades compatíveis (senioridade, tempo, escopo).
   - ~15% peso: formação, certificações, idiomas e soft skills.
   Penalize fortemente requisitos obrigatórios ausentes. Justifique internamente o número; retorne apenas o inteiro.

Passo 4 — STRENGTHS: Para cada requisito ATENDIDO, gere uma string curta e específica descrevendo o ponto forte como evidência (ex.: "6 anos com Python, atende requisito de automação"). Máx 8 itens, ordenados por relevância.

Passo 5 — MISSING_KEYWORDS: Para cada requisito AUSENTE ou PARCIAL-crítico, gere uma string curta (ex.: "ETL — citado 3x na vaga, ausente no currículo"). Máx 10 itens.

Passo 6 — ATS OPTIMIZED RESUME: Reescreva o currículo conforme as regras de formato abaixo, usando APENAS fatos do currículo original.

═══════════════════════════════════════════════════════════════
REGRAS DE FORMATO DO CURRÍCULO OTIMIZADO (ATS-FRIENDLY)
═══════════════════════════════════════════════════════════════

- Markdown puro: títulos com `#`, subtítulos com `##`, bullets com `-`.
- Layout de COLUNA ÚNICA. Proibido tabelas, colunas múltiplas, caixas ou elementos gráficos.
- Títulos de seção padronizados e em CAIXA ALTA: CONTATO, RESUMO PROFISSIONAL, COMPETÊNCIAS TÉCNICAS, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO ACADÊMICA, CERTIFICAÇÕES, IDIOMAS.
- Em COMPETÊNCIAS TÉCNICAS, liste primeiro as palavras-chave da vaga que JÁ existem no currículo (sinônimos aceitáveis), separadas por ` | `. Não inclua skills que o currículo não tenha.
- Em EXPERIÊNCIA, preserve empresas, cargos e datas reais. Reescreva bullets para incluir, quando existirem no currículo, verbos de ação e palavras-chave da vaga. Nunca invente métricas; se existirem no currículo, destaque-as.
- Remova formatações ambíguas para ATS (símbolos estranhos, abreviações não padrão).
- Texto corrido, sem colunas internas, sem imagens.

═══════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════

Retorne SOMENTE um JSON válido, sem texto adicional, sem markdown fences, exatamente no esquema definido. Não inclua campos extras. Não comente fora do JSON.
```

---

## 2. Esquema JSON de retorno (LLM)

Modelo do objeto que a LLM deve retornar:

```json
{
  "score": 0,
  "strengths": [
    "string"
  ],
  "missing_keywords": [
    "string"
  ],
  "ats_optimized_resume": "string (Markdown)"
}
```

### Especificação dos campos

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| `score` | `int` | 0–100 (inteiro) | Match score global entre currículo e vaga. |
| `strengths` | `string[]` | 0–8 itens, cada ≤ 140 chars | Requisitos da vaga atendidos pelo currículo, descritos como evidência. |
| `missing_keywords` | `string[]` | 0–10 itens, cada ≤ 140 chars | Requisitos da vaga ausentes ou insuficientes no currículo. |
| `ats_optimized_resume` | `string` | Markdown puro, coluna única, títulos em CAIXA ALTA | Currículo reescrito APENAS com fatos do currículo original. |

### Exemplo de resposta válida

```json
{
  "score": 72,
  "strengths": [
    "Experiência comprovada com SQL e modelagem de dados",
    "Uso de Python para automação de relatórios",
    "Vivência com metodologias ágeis (Scrum)",
    "Formação em Sistemas de Informação atende ao requisito"
  ],
  "missing_keywords": [
    "ETL — citado 3x na vaga, ausente no currículo",
    "Power BI / Looker — ferramentas de BI não mencionadas",
    "Métricas quantitativas em resultados — ausentes",
    "Certificação em cloud (AWS/Azure) — não informada"
  ],
  "ats_optimized_resume": "# NOME DO CANDIDATO\n## Analista de Dados Pleno\n\n## CONTATO\nSão Paulo, SP | (11) 90000-0000 | email@exemplo.com | linkedin.com/in/seu-perfil\n\n## RESUMO PROFISSIONAL\nAnalista de Dados com 5 anos de experiência em SQL, Python e modelagem de dados. Atuação em automação de relatórios e comunicação com stakeholders de negócio. Experiência com metodologias ágeis (Scrum).\n\n## COMPETÊNCIAS TÉCNICAS\nSQL | Python | Modelagem de Dados | Excel Avançado | Git | Scrum\n\n## EXPERIÊNCIA PROFISSIONAL\n\n### Empresa Exemplo S.A. — Analista de Dados Pleno\nJaneiro de 2022 — Atual\n- Desenvolveu consultas SQL para relatórios de vendas com atualização diária.\n- Automatizou relatórios manuais em Python, reduzindo trabalho repetitivo.\n- Modelou tabelas do repositório de dados, melhorando a performance das consultas.\n\n### Empresa Anterior LTDA — Analista de Dados Júnior\nMarço de 2020 — Dezembro de 2021\n- Estruturou consultas SQL para relatórios de vendas com atualização diária.\n- Apoiou a migração de planilhas para um repositório central de dados.\n- Participou de cerimônias Scrum e refinamento de requisitos com stakeholders.\n\n## FORMAÇÃO ACADÊMICA\nBacharelado em Sistemas de Informação — Universidade Exemplo — 2019\n\n## IDIOMAS\nPortuguês: nativo\nInglês: avançado"
}
```

---

## 3. Uso no backend Python (exemplo OpenAI)

```python
import json
from openai import OpenAI

SYSTEM_PROMPT = """... (bloco da Seção 1) ..."""

RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["score", "strengths", "missing_keywords", "ats_optimized_resume"],
    "properties": {
        "score": {"type": "integer", "minimum": 0, "maximum": 100},
        "strengths": {
            "type": "array",
            "maxItems": 8,
            "items": {"type": "string", "maxLength": 140},
        },
        "missing_keywords": {
            "type": "array",
            "maxItems": 10,
            "items": {"type": "string", "maxLength": 140},
        },
        "ats_optimized_resume": {"type": "string"},
    },
}

def analyze_resume(job_data: dict, resume_text: str, api_key: str) -> dict:
    client = OpenAI(api_key=api_key)
    completion = client.chat.completions.create(
        model="gpt-4o-mini",  # ou gpt-4o
        response_format={"type": "json_schema", "json_schema": {
            "name": "ats_analysis",
            "strict": True,
            "schema": RESPONSE_SCHEMA,
        }},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({
                "job": job_data,
                "resume": resume_text,
            }, ensure_ascii=False)},
        ],
    )
    return json.loads(completion.choices[0].message.content)
```

### Notas Gemini

Para Gemini, use `response_mime_type="application/json"` com `response_schema`
(Pydantic/protobuf). O mesmo `SYSTEM_PROMPT` vai no `system_instruction`.
O campo `ats_optimized_resume` deve ser `string` (não usar tipos complexos no
schema do Gemini para conteúdo Markdown longo).

### Mapeamento para o frontend (AnalysisResult)

```ts
// ATSMatchResult (backend) -> AnalysisResult (frontend)
{
  score: r.score,
  optimizedScore: r.score,        // ou score recalculado pós-rewrite, se houver
  optimizedResume: r.ats_optimized_resume,
  strengths: r.strengths,
  weaknesses: r.missing_keywords,  // renomeia missing_keywords -> weaknesses
  suggestions: [],                // gerar em pós-processamento opcional
}
```
