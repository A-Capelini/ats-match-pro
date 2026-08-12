# 📄 ATS Match Pro

Aplicação full-stack que analisa a compatibilidade entre um currículo e uma vaga de emprego, aponta palavras-chave ausentes e gera uma versão otimizada do currículo para passar por sistemas de rastreamento de candidatos (ATS), usando IA generativa (Google Gemini).

Projeto desenvolvido como entrega do bootcamp **DIO.me / Riachuelo**, combinando **Vibe Coding** (Lovable) para a interface inicial com desenvolvimento manual (VS Code) para a lógica de backend e integração com IA.

---

## 📋 Sobre o projeto

O ATS Match Pro resolve um problema comum de quem está em processo seletivo: currículos bem escritos são frequentemente descartados por sistemas automatizados (ATS) por não conterem as palavras-chave exatas exigidas pela vaga, mesmo quando o candidato tem a experiência necessária.

O usuário cola o texto da vaga e o texto do seu currículo, e a aplicação:

1. Calcula um **score de compatibilidade** (0–100%) entre os dois textos.
2. Lista os **pontos fortes** já presentes no currículo que atendem à vaga.
3. Aponta as **palavras-chave ausentes** — requisitos da vaga que o currículo não cobre.
4. Gera uma **versão reescrita e otimizada** do currículo, reorganizando (nunca inventando) as informações existentes para melhor leitura por sistemas ATS.
5. Estima o **novo score** após a otimização.

**Regra de ouro do projeto:** a IA nunca pode alucinar qualificações, experiências, métricas ou certificações que não estejam literalmente presentes no currículo original enviado pelo usuário. O currículo otimizado é sempre uma reorganização dos fatos existentes.

---

## 🖼️ Demonstração

<!-- TODO: adicionar prints/GIF do fluxo completo -->
<!-- Sugestão de conteúdo:
  1. Tela inicial com o formulário (Dados da vaga / Currículo)
  2. Tela de resultado com o score de compatibilidade
  3. Tela do currículo otimizado gerado pela IA
-->

![Tela inicial do ATS Match Pro](./docs/images/placeholder-tela-inicial.png)
![Resultado da análise ATS](./docs/images/placeholder-resultado.png)
![Currículo otimizado gerado pela IA](./docs/images/placeholder-curriculo-otimizado.png)

---

## 🧠 Prompt Final (PRD) — Fase 1 (Lovable)

Este foi o prompt utilizado no [Lovable](https://lovable.dev) para gerar a interface inicial da aplicação (formulários, layout, acessibilidade), antes da implementação da lógica de IA e do backend:

```
Atue como um Engenheiro de Software Sênior e Especialista em UI/UX. Crie a Fase 1
de uma aplicação web de otimização de currículos para sistemas ATS (Applicant
Tracking Systems). O sistema é de uso livre, sem necessidade de login.

Stack obrigatória: React, Vite, Tailwind CSS, e componentes Radix UI (shadcn/ui).

Diretrizes de Design Universal (Estrito):
- Alto contraste (padrões WCAG).
- Suporte total a navegação por teclado (Tab/Enter para todos os elementos interativos).
- Uso obrigatório de aria-labels em botões de ícone e campos de formulário.
- Layout responsivo estritamente mobile-first.

Escopo da Fase 1 (Interface e Formulários):
1. Layout Principal: Crie um layout limpo de página única. O Header deve conter
   apenas o nome do app ("ATS Match Pro") e um ícone de configurações.
2. Tipografia e Cores: Use uma paleta neutra e profissional (tons de ardósia,
   branco e um azul ou verde escuro de alto contraste para ações principais).
   Tipografia sem serifa, limpa, simulando documentos formais.
3. Seção de Entrada de Dados (Hero/Main):
   - Crie um formulário em formato de abas (Tabs) ou acordeões (Accordion) usando shadcn.
   - Área 1: "Dados da Vaga" (Input text para o Título da Vaga, Input text opcional
     para o Link, e um Textarea grande para a descrição da vaga).
   - Área 2: "Seu Currículo" (Textarea grande para o usuário colar o texto do seu
     currículo atual).
4. Botão de Ação: Um botão proeminente "Analisar Compatibilidade (ATS)".
5. Comportamento: Por enquanto, o botão "Analisar" deve apenas validar se os
   textareas de vaga e currículo não estão vazios e exibir um toast notification
   (shadcn) de sucesso ou erro (campos obrigatórios).

Crie componentes modulares, pois nas próximas iterações adicionaremos a lógica de
IA e o gerador de PDF. Foco total em uma interface de usuário impecável, acessível
e que transmita confiança.
```

> **Nota:** o campo "Link da vaga" mencionado no prompt original foi posteriormente removido da interface (Fase 2 de melhorias) por não ter implementação funcional de extração automática — mantido aqui apenas como registro histórico do prompt real utilizado.

### Evolução pós-Lovable

A partir da Fase 1 gerada pelo Lovable, o projeto evoluiu com desenvolvimento assistido por IA (Gemini + Claude) diretamente no VS Code, adicionando:
- Backend em FastAPI com integração real ao Google Gemini.
- Rate limiting, CORS e tratamento de erros.
- Structured output (JSON validado por schema) na resposta da IA.
- Remoção do fluxo BYOK (Bring Your Own Key) vestigial, já que a chave de API vive apenas no servidor.

---

## 💬 Reflexão sobre o processo

<!-- TODO: personalizar esta seção com suas próprias palavras antes de entregar -->

**O que funcionou bem:**
O Vibe Coding no Lovable acelerou muito a Fase 1 — em poucos prompts já havia uma interface acessível, responsiva e com boa UX, sem precisar escrever CSS/JSX manualmente. A combinação com desenvolvimento manual depois permitiu ter o melhor dos dois mundos: velocidade no começo, controle e robustez no backend.

**O que não funcionou como esperado:**
Modelos de IA (no caso, o Gemini) são descontinuados com frequência — o projeto quebrou em produção porque o modelo `gemini-1.5-flash` usado inicialmente foi desativado pelo provedor, exigindo migração para uma versão mais recente. Também identificamos, já com o projeto rodando, resíduos de uma arquitetura anterior (campo de link decorativo, exigência de chave de API que não era usada) — sinal de que é fácil a IA generativa deixar "pontas soltas" quando o projeto passa por várias iterações e ferramentas diferentes.

**O que aprendi sobre conversar com IAs:**
Ferramentas de IA são ótimas para gerar estrutura inicial e código funcional rapidamente, mas exigem revisão humana constante — principalmente em pontos de segurança (chaves de API, `.gitignore`), consistência entre partes do sistema (frontend prometendo algo que o backend não implementa) e decisões de escopo (nem toda funcionalidade sugerida vale a pena implementar antes de um prazo de entrega).

---

## 🏗️ Arquitetura e Stack

- **Frontend:** React + Vite, Tailwind CSS, Radix UI / shadcn — porta `8080`
- **Backend:** Python + FastAPI, Pydantic, slowapi (rate limiting) — porta `8000`
- **IA:** Google Gemini (SDK `google-genai`), com structured output via `response_schema`
- **Comunicação:** REST (`POST /api/analyze`), CORS configurado entre front e back

---

## ▶️ Como rodar localmente

### Backend

```sh
cd backend
conda activate <seu-ambiente>   # ou python -m venv/pip conforme preferir
pip install -r requirements.txt
cp .env.example .env            # preencha GEMINI_API_KEY e LLM_PROVIDER=gemini
uvicorn main:app --reload --port 8000
```

### Frontend

```sh
npm install
npm run dev
```

Acesse `http://localhost:8080`.

---

## 🔗 Links

- **Repositório:** https://github.com/A-Capelini/ats-match-pro
- **Projeto no Lovable:** <!-- TODO: adicionar link após publicação em lovable.dev -->
- **Deploy / demonstração ao vivo:** <!-- TODO: adicionar link após publicação -->

---

Este projeto foi construído com [Lovable](https://lovable.dev) (Fase 1 — interface) e evoluído manualmente com FastAPI + Google Gemini.
