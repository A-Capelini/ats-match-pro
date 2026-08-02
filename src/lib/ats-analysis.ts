import type { JobData } from "@/components/job-fields";

export type AnalysisResult = {
  score: number;
  optimizedScore: number;
  optimizedResume: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

/**
 * MOCK do serviço de análise.
 *
 * TODO (integração real): substituir o setTimeout abaixo por uma chamada HTTP
 * ao provedor escolhido, por exemplo:
 *
 *   const response = await fetch("https://api.openai.com/v1/chat/completions", {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       Authorization: `Bearer ${apiKey}`,
 *     },
 *     body: JSON.stringify({
 *       model: "gpt-4o-mini",
 *       response_format: { type: "json_object" },
 *       messages: [
 *         { role: "system", content: PROMPT_ATS },
 *         { role: "user", content: JSON.stringify({ jobData, resumeData }) },
 *       ],
 *     }),
 *   });
 *   const json = await response.json();
 *   return JSON.parse(json.choices[0].message.content) as AnalysisResult;
 *
 * Para o Gemini, usar generativelanguage.googleapis.com/v1beta/models/... com
 * a mesma chave (BYOK) e mapear a resposta para o tipo AnalysisResult.
 * A resposta DEVE conter: score, optimizedScore, optimizedResume, strengths,
 * weaknesses e suggestions. Na Fase 3 esta função chamará o provedor de IA
 * usando a chave informada pelo usuário (BYOK).
 */
export async function analyzeResume(
  _jobData: JobData,
  _resumeData: string,
  _apiKey: string,
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    score: 78,
    optimizedScore: 93,
    optimizedResume: OPTIMIZED_RESUME_MOCK,
    strengths: [
      "Experiência comprovada com SQL e modelagem de dados",
      "Uso de Python para automação de relatórios",
      "Vivência com metodologias ágeis (Scrum)",
      "Comunicação com stakeholders de negócio",
      "Formação alinhada ao requisito da vaga",
    ],
    weaknesses: [
      "Ausência do termo 'ETL', citado 3 vezes na vaga",
      "Não menciona ferramentas de BI (Power BI / Looker)",
      "Falta de métricas quantitativas nos resultados",
      "Certificações em cloud não informadas",
    ],
    suggestions: [
      "Inclua uma seção 'Competências Técnicas' com palavras-chave literais da vaga.",
      "Substitua tabelas e colunas por texto corrido: leitores ATS podem embaralhar a ordem.",
      "Use títulos de seção convencionais: Experiência, Formação, Competências.",
      "Quantifique conquistas (ex.: 'reduziu o tempo de processamento em 40%').",
      "Salve o arquivo final em PDF com texto selecionável, nunca como imagem.",
    ],
  };
}

const OPTIMIZED_RESUME_MOCK = `NOME DO CANDIDATO
Analista de Dados Pleno
Sao Paulo, SP | (11) 90000-0000 | email@exemplo.com | linkedin.com/in/seu-perfil

RESUMO PROFISSIONAL
Analista de Dados com 5 anos de experiencia em SQL, Python e processos de ETL. Atuacao na construcao de pipelines de dados, automacao de relatorios e criacao de dashboards em Power BI e Looker para areas de negocio. Experiencia com metodologias ageis (Scrum) e comunicacao direta com stakeholders.

COMPETENCIAS TECNICAS
SQL | Python | ETL | Modelagem de Dados | Power BI | Looker | Data Warehouse | Airflow | Excel Avancado | Git | Scrum

EXPERIENCIA PROFISSIONAL

Empresa Exemplo S.A. - Analista de Dados Pleno
Janeiro de 2022 - Atual
- Desenvolveu rotinas de ETL em Python e SQL que reduziram o tempo de processamento em 40%.
- Criou 12 dashboards em Power BI utilizados por 3 diretorias para decisoes semanais.
- Automatizou 20 relatorios manuais, economizando 60 horas de trabalho por mes.
- Modelou tabelas do data warehouse, melhorando a performance das consultas em 35%.

Empresa Anterior LTDA - Analista de Dados Junior
Marco de 2020 - Dezembro de 2021
- Estruturou consultas SQL para relatorios de vendas com atualizacao diaria.
- Apoiou a migracao de planilhas para um repositorio central de dados.
- Participou de cerimonias Scrum e refinamento de requisitos com stakeholders.

FORMACAO ACADEMICA
Bacharelado em Sistemas de Informacao - Universidade Exemplo - 2019

CERTIFICACOES
Microsoft Certified: Azure Data Fundamentals (DP-900) - 2023
Google Data Analytics Professional Certificate - 2022

IDIOMAS
Portugues: nativo
Ingles: avancado
`;
