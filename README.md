# Omniflow AI

Bem-vindo ao Omniflow AI, uma plataforma de chat inteligente projetada para integração em websites, combinando a robustez do Firebase com a inteligência do Google Gemini.

Este documento serve como um guia de início rápido para a estrutura e os conceitos fundamentais do projeto.

---

## 1. Visão Geral da Arquitetura

A plataforma é construída sobre um ecossistema Next.js e Firebase, com uma clara separação de responsabilidades entre os diferentes tipos de utilizadores e serviços.

### **Para uma análise técnica detalhada, consulte `SYSTEM_ARCHITECTURE.md`**

O ficheiro `SYSTEM_ARCHITECTURE.md` contém uma descrição exaustiva da lógica de autenticação, dos diferentes tipos de utilizadores (Administradores vs. Visitantes Anónimos) e do fluxo de dados do chat. A consulta deste documento é **obrigatória** para qualquer desenvolvimento relacionado com perfis, permissões ou autenticação.

---

## 2. Princípios de Engenharia e Padrões

A base de código segue padrões de design robustos para garantir segurança, performance e estabilidade.

### 2.1. Inicialização Segura do Firebase (Cliente e Servidor)

-   **Lado do Cliente (`src/lib/firebase.ts`):** A configuração do Firebase é carregada dinamicamente a partir de um endpoint de API, impedindo que chaves sensíveis sejam expostas no browser. Um mecanismo de `Promise` única (`ensureFirebaseInitialized`) previne condições de corrida e múltiplas inicializações.
-   **Lado do Servidor (`src/lib/firebase-admin.ts`):** O Admin SDK utiliza um padrão singleton para reutilizar a instância inicializada, otimizando a performance em ambientes serverless (API Routes, Cloud Functions). As chaves de serviço são lidas de forma segura a partir de variáveis de ambiente.

### 2.2. Arquitetura da Inteligência Artificial

O sistema utiliza uma abordagem híbrida para a IA:

-   **Orquestração com Genkit (`src/ai/`):** Fluxos de IA complexos e estruturados são definidos e geridos com o framework `genkit` do Firebase, utilizando validação de esquema com `zod` para garantir a integridade dos dados de entrada e saída.
-   **API Sob Demanda (`src/app/api/...`):** Tarefas de IA mais simples ou que requerem uma interface HTTP direta são implementadas como `Route Handlers` do Next.js, utilizando o SDK do Google AI diretamente.

---

## 3. Como Começar

1.  **Instale as dependências:** `npm install`
2.  **Configure as suas variáveis de ambiente:** Crie um ficheiro `.env.local` com base no `.env.example`.
3.  **Execute o ambiente de desenvolvimento:** `npm run dev`

Lembre-se de consultar o `SYSTEM_ARCHITECTURE.md` antes de fazer alterações significativas na lógica de negócio principal.
