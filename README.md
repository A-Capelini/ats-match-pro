# ATS Match Pro

Atue como um Engenheiro de Software Sênior e Especialista em UI/UX. Crie a Fase 1 de uma aplicação web de otimização de currículos para sistemas ATS (Applicant Tracking Systems). O sistema é de uso livre, sem necessidade de login.

Stack obrigatória: React, Vite, Tailwind CSS, e componentes Radix UI (shadcn/ui).

Diretrizes de Design Universal (Estrito):

- Alto contraste (padrões WCAG).

- Suporte total a navegação por teclado (Tab/Enter para todos os elementos interativos).

- Uso obrigatório de aria-labels em botões de ícone e campos de formulário.

- Layout responsivo estritamente mobile-first.

Escopo da Fase 1 (Interface e Formulários):

1. Layout Principal: Crie um layout limpo de página única. O Header deve conter apenas o nome do app ("ATS Match Pro") e um ícone de configurações.

2. Tipografia e Cores: Use uma paleta neutra e profissional (tons de ardósia, branco e um azul ou verde escuro de alto contraste para ações principais). Tipografia sem serifa, limpa, simulando documentos formais.

3. Seção de Entrada de Dados (Hero/Main):

   - Crie um formulário em formato de abas (Tabs) ou acordeões (Accordion) usando shadcn.

   - Área 1: "Dados da Vaga" (Input text para o Título da Vaga, Input text opcional para o Link, e um Textarea grande para a descrição da vaga).

   - Área 2: "Seu Currículo" (Textarea grande para o usuário colar o texto do seu currículo atual).

4. Botão de Ação: Um botão proeminente "Analisar Compatibilidade (ATS)".

5. Comportamento: Por enquanto, o botão "Analisar" deve apenas validar se os textareas de vaga e currículo não estão vazios e exibir um toast notification (shadcn) de sucesso ou erro (campos obrigatórios). 

Crie componentes modulares, pois nas próximas iterações adicionaremos a lógica de IA e o gerador de PDF. Foco total em uma interface de usuário impecável, acessível e que transmita confiança.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/19af4c10-d9ca-4558-b1c8-8739407b1c02).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
