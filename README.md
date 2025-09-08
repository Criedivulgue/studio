# O Manual Definitivo da OmniFlow AI

**Versão 2.0: Estamos desenvolvendo no Firebase Studio com interface do Visual Code. Usando React e Next.jse Gemini IA.
---

studio-9899475758:~/studio{main}$ ls -R src/app
src/app:
admin  api  chat  favicon.ico  globals.css  layout.tsx  login  page.tsx  super-admin

src/app/admin:
ai-config  broadcast  contacts  dashboard  groups  history  layout.tsx  live-chat

src/app/admin/ai-config:
page.tsx

src/app/admin/broadcast:

src/app/admin/contacts:
_components  page.tsx

src/app/admin/contacts/_components:
cell-action.tsx  columns.tsx

src/app/admin/dashboard:
page.tsx

src/app/admin/groups:
_components  page.tsx

src/app/admin/groups/_components:
cell-action.tsx  columns.tsx

src/app/admin/history:
_components  page.tsx

src/app/admin/history/_components:
cell-action.tsx  columns.tsx

src/app/admin/live-chat:
page.tsx

src/app/api:
summarize

src/app/api/summarize:
route.ts

src/app/chat:
'[adminId]'  '[adminUid]'

'src/app/chat/[adminId]':

'src/app/chat/[adminUid]':
page.tsx

src/app/login:
page.tsx

src/app/super-admin:
admins  ai-config  ai-settings  broadcast  contacts  dashboard  history  layout.tsx  live-chat  users

src/app/super-admin/admins:
_components  page.tsx

src/app/super-admin/admins/_components:
cell-action.tsx  columns.tsx

src/app/super-admin/ai-config:
page.tsx

src/app/super-admin/ai-settings:
page.tsx

src/app/super-admin/broadcast:

src/app/super-admin/contacts:
_components  page.tsx

src/app/super-admin/contacts/_components:
cell-action.tsx  columns.tsx

src/app/super-admin/dashboard:
page.tsx

src/app/super-admin/history:
page.tsx

src/app/super-admin/live-chat:
page.tsx

src/app/super-admin/users:
page.tsx
studio-9899475758:~/studio{main}$ 

## 1. A Alma da Aplicação: A Metáfora do Shopping Center

A OmniFlow AI é concebida como um **Shopping Center Digital**. Esta analogia define a hierarquia, as permissões e a interação entre todos os participantes do ecossistema.

- **Super Administrador:** O Dono do Shopping.
- **Administrador:** O Dono de uma Loja específica dentro do shopping.
- **Usuário Final:** O Cliente que visita uma loja.

---

## 2. Papéis de Usuário e Permissões

### 2.1. Super Administrador (Dono do Shopping)
- **Acesso:** Painel de Super Admin (`/super-admin/*`).
- **Poderes e Responsabilidades:**
  - **Gestão Total de Lojistas:** CRUD completo sobre os usuários `Administradores`.
  - **Visão Onisciente:** Visualiza e gerencia os contatos, históricos e métricas de **TODOS** os `Administradores`.
  - **Estrategista de Comunicação Global:** Único usuário capaz de criar e gerenciar campanhas de **Broadcasting Corporativo** para todos os clientes do sistema ou segmentos específicos.
  - **Arquiteto da IA Global:** Configura uma IA pública (`/super-admin/global-ai-config`) que pode servir como ponto de partida ou fallback.
  - **Também é um Lojista:** Possui seu próprio painel de `Admin` para gerenciar seus contatos pessoais.

### 2.2. Administrador (Dono de Loja)
- **Acesso:** Painel de Admin (`/admin/*`).
- **Poderes e Responsabilidades:**
  - **Gestão Focada no Cliente:** CRUD completo **apenas** sobre sua própria lista de contatos. O isolamento é total; ele não pode ver dados de outros `Admins`.
  - **Arquiteto da IA Pessoal:** Configura sua própria persona de IA (`/admin/ai-config`) para atender seus clientes com uma voz e base de conhecimento únicas.
  - **Canal de Atendimento Exclusivo:** Cada `Admin` possui uma "porta de entrada" única para seus clientes: `https://app.com/chat/{adminUid}`.
  - **Receptor de Comunicados:** Visualiza os informes enviados pelo `Super Administrador`.

### 2.3. Usuário Final (Cliente)
- **Acesso:** Anônimo, via link de chat do `Admin` (`/chat/{adminUid}`). Não possui login.
- **Poderes:** Conversar com o assistente de IA da "loja", solicitar atendimento humano e, se desejar, fornecer suas informações de contato.

---

## 3. O Fluxo de Atendimento: A Jornada do Cliente ao CRM

Este é o fluxo principal que define a interação entre o cliente, a IA e o `Admin`.

1.  **O Primeiro Contato:** Um cliente acessa a URL de chat de um `Admin` (`/chat/{adminUid}`).
2.  **Boas-vindas da IA:** A página carrega a interface de chat. O cliente é imediatamente recebido pela IA pessoal daquele `Admin`, pronta para ajudar. A conversa é anônima.
3.  **A Solicitação Humana (O Momento da Conversão):**
    - A IA é treinada para identificar quando o cliente pede para falar com um atendente humano (ex: "quero falar com uma pessoa", "falar com suporte").
    - Neste momento, a IA responde de forma inteligente: "Claro! Para que possamos continuar o atendimento, por favor, preencha seu nome e informações de contato." e apresenta um **modal de captura de leads**.
    - O cliente preenche **Nome, WhatsApp e Email**.
4.  **Criação do Contato no CRM:**
    - Ao enviar o modal, o sistema cria um novo registro na coleção `contacts` associado ao `ownerId` do `Admin`.
    - Simultaneamente, cria o registro correspondente em `users/{adminUid}/conversations`.
5.  **Notificação e Visão do Admin:**
    - No painel `/admin/live-chat`, a nova conversa aparece **instantaneamente** na lista do `Admin`.
    - O sistema dispara uma **notificação push** (via Firebase Cloud Messaging) para o `Admin`, alertando sobre o novo lead que solicitou atendimento.
6.  **Intervenção Humana:**
    - O `Admin` clica na conversa e vê todo o histórico (cliente ↔ IA).
    - Ele pode então assumir o chat. A partir da primeira mensagem do `Admin`, a IA entra em "modo co-piloto", parando de responder diretamente ao cliente, mas podendo oferecer sugestões ao `Admin`.

---

## 4. Arquitetura Técnica Detalhada

### 4.1. Stack Tecnológica
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI.
- **Backend & Database:** Firebase (Authentication, Firestore, Cloud Functions, Cloud Messaging).
- **IA:** Google Gemini API.

### 4.2. Estrutura de Dados no Firestore (O Cérebro)

- `/users/{userId}`: Armazena o perfil do usuário, incluindo seu `role` (`admin` ou `superadmin`).
- `/contacts/{contactId}`: A lista mestra de todos os contatos. Cada documento contém um `ownerId` que o vincula a um `user`.
- `/ai_configs/{userId}`: Configuração da IA pessoal para um `user` específico.
- `/global_ai_config` (single doc): Configuração da IA global, gerenciada pelo `Super Admin`.
- `/users/{userId}/conversations/{contactId}`: A lista de chats de um `Admin`. Otimizada para leituras em tempo real no painel de Chat ao Vivo. Contém metadados como `lastMessage`, `unreadCount`.
- `/chats/{conversationId}/messages/{messageId}`: O histórico detalhado de mensagens de uma conversa.
- `/broadcasts/{broadcastId}`: Documentos de campanhas de broadcasting.
- `/broadcasts/{broadcastId}/tasks/{taskId}`: Fila de tarefas para processamento assíncrono de envios em massa.

### 4.3. Sistemas de IA (Isolados e Hierárquicos)

O fluxo de processamento de uma mensagem de chat é roteado dinamicamente para garantir o uso da IA correta.

```typescript
// Rota da API: /api/chat/[userId]/route.ts
export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { message, conversationId } = await req.json();
  
  // 1. Identifica o proprietário do chat (o "dono da loja")
  const targetUserId = params.userId;
  
  // 2. Busca a configuração de IA correta para aquele dono
  const aiConfig = await getAIConfig(targetUserId); // ou a global se não houver
  
  // 3. Processa a mensagem com Gemini usando a config específica
  const response = await geminiService.generateResponse(message, aiConfig);
  
  // 4. Salva a interação no histórico da conversa
  await saveToConversationHistory(targetUserId, conversationId, message, response);
  
  return NextResponse.json({ response });
}
```

### 4.4. Sistema de Broadcasting Corporativo (Poder do Super Admin)

Uma arquitetura em camadas para envio de comunicados em massa, projetada para escalabilidade e resiliência.

- **Camadas:** Frontend (UI do Super Admin) → Cloud Function (Orquestração) → Fila de Tarefas no Firestore → Workers (Cloud Functions que disparam os envios).
- **Inteligência:** Permite segmentar o público por tipo de usuário, interesses, ou listas customizadas.
- **Assíncrono:** O uso de uma fila de tarefas garante que o sistema pode lidar com milhares de envios sem travar ou perder mensagens.

### 4.5. Regras de Segurança do Firestore (A Fortaleza)

Estas regras **não são opcionais**. Elas são a garantia de isolamento e segurança dos dados.

```javascript
// Exemplo de Regras Críticas

// Funções helper
function isOwner(userId) { return request.auth.uid == userId; }
function isSuperAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin'; }

// Admins só podem acessar seus próprios contatos. Super Admins podem acessar todos.
match /contacts/{contactId} {
  allow read, write: if isOwner(resource.data.ownerId) || isSuperAdmin();
}

// Configs de IA só podem ser alteradas pelo dono ou Super Admin.
match /ai_configs/{userId} {
  allow read, write: if isOwner(userId) || isSuperAdmin();
}

// Apenas Super Admins podem criar ou alterar broadcasts.
match /broadcasts/{broadcastId} {
  allow read, write: if isSuperAdmin();
}

// Tasks de broadcast não podem ser escritas por usuários, apenas por Cloud Functions.
match /broadcasts/{broadcastId}/tasks/{taskId} {
  allow write: if false; 
}
```

---

## 5. Estratégia de Implementação e Roadmap Futuro

### 5.1. Fases de Implementação

1.  **Fase 1: Core Infrastructure (Fundação):**
    - Configuração do Firebase, autenticação com `roles`, estrutura de dados e regras de segurança.
2.  **Fase 2: Sistemas de IA e Chat (O Coração):**
    - Integração com Gemini, roteamento de chat, fluxo de captura de leads e painel de Chat ao Vivo.
3.  **Fase 3: Sistema de Broadcasting (O Megafone):**
    - UI, Cloud Functions e sistema de filas para comunicação em massa.
4.  **Fase 4: Refinamento e Otimização (O Polimento):**
    - Dashboards analíticos, sistema de relatórios, otimização de performance e monitoramento.

### 5.2. Roadmap de Evolução (Visão de Futuro)

- **IA de Próxima Geração:**
  - **Base de Conhecimento (RAG):** Permitir que `Admins` façam upload de documentos (PDFs, TXT) para treinar suas IAs, garantindo respostas ultra-precisas.
  - **Análise de Sentimento:** Notificar `Admins` em tempo real se um cliente demonstrar frustração, permitindo intervenção proativa.
- **Melhorias de Arquitetura:**
  - **Migrar Data-Fetching:** Adotar React Query ou SWR para otimizar o estado do servidor, melhorando a performance e a experiência do usuário.
- **Integrações Externas:**
  - **Canais Unificados:** Integrar com APIs de **WhatsApp** e **Instagram**, para que as mensagens dessas plataformas caiam diretamente no painel OmniFlow AI.
  - **Sincronização com CRMs:** Permitir a sincronização de contatos e históricos com sistemas como HubSpot, Pipedrive, etc.

---
# Mão na Massa
Plano dividido em duas frentes de ataque:

FRENTE 1: Normalização e Estabilização. Corrigir os erros do passado e garantir que a fundação da nossa aplicação esteja 100% sólida. Não podemos construir um arranha-céu sobre areia movediça.

FRENTE 2: Implementação da Fase Core. Começar a construir as funcionalidades essenciais que dão vida à OmniFlow AI, seguindo o roadmap do nosso README.md.
O objetivo aqui é um só: erradicar a tela de carregamento infinita e garantir que o fluxo de autenticação seja à prova de falhas.

Ação 1: Consertar o authService.ts.

Problema: Na tentativa de simplificar, alteramos a assinatura da função onAuthChange, o que causou um efeito dominó de erros.
Solução Técnica: Vou reverter a lógica de onAuthChange para sua forma correta e robusta. Ela deve:
Ouvir o onAuthStateChanged do Firebase.
Se receber um firebaseUser, ela deve buscar o perfil correspondente na coleção users do Firestore.
Ela retornará o par (firebaseUser, appUser), onde appUser são os dados do nosso Firestore (com o role). Se não houver firebaseUser, ambos serão null.
Resultado Esperado: O serviço de autenticação voltará a ser uma fonte de verdade confiável.
Ação 2: Corrigir o Hook useAuth.

Problema: O hook use-auth.tsx foi adaptado para a lógica errada do authService e é a causa raiz da tela de carregamento não desaparecer.
Solução Técnica: Vou reescrever o useEffect dentro do useAuth para que ele:
Consuma a assinatura correta (firebaseUser, appUser) do onAuthChange.
Chame a função setLoading(false) em TODOS os cenários possíveis dentro do callback (usuário logado, usuário não encontrado, usuário deslogado). Esta é a correção mais crítica.
Resultado Esperado: O estado de loading da aplicação passará a refletir a realidade, terminando quando a verificação de autenticação terminar.
Ação 3: Simplificar o AdminLayout.

Problema: A lógica de renderização no src/app/admin/layout.tsx está falha e contribui para o problema.
Solução Técnica: Vou ajustar a lógica de renderização para ser inequívoca:
if (loading) return <Loader /> — Mostra o loader apenas durante o carregamento.
if (!user) return null — Se o carregamento terminou e não há usuário, não renderiza nada, permitindo que o useEffect de redirecionamento faça seu trabalho sem erros.
Se passar por essas checagens, o layout principal é renderizado com segurança.
Resultado Esperado: A aplicação se torna estável. Ou ela carrega o painel do administrador, ou ela redireciona para o login. O limbo do carregamento infinito é destruído.
Com a aplicação estável, começaremos imediatamente a implementação da Fase 1 e 2 do nosso README.md.

Ação 4: Implementar as Regras de Segurança (A Fortaleza).

Prioridade: Esta é a primeira ação de implementação. É inegociável.
Solução Técnica: Vou gerar o conteúdo do arquivo firestore.rules com base exatamente nas regras que definimos na seção 4.5 do README.md, garantindo o isolamento de dados entre Admins e o poder do Super Admin.
Ação 5: Ativar a Criação de Contatos via Chat (O Coração do CRM).

Solução Técnica:
Página Pública: Criarei a estrutura da página /chat/[userId]/page.tsx.
API de Chat: Criarei a rota /api/chat/[userId]/route.ts para receber as mensagens.
Inteligência da IA: Na lógica da API, vou adicionar a detecção de palavras-chave ("falar com humano", "suporte", etc.).
Modal de Captura: Ao detectar a intenção, a UI do chat irá disparar um novo componente: o Modal de Captura de Leads (Nome, Email, WhatsApp).
Serviço de Contato: O envio do modal chamará uma nova função no contactService.ts que criará o contato e a conversa, conforme descrito no fluxo 3 do README.md.
Ação 6: Ativar Notificações Push.

Solução Técnica:
Cloud Function: Criarei uma Cloud Function que será acionada (on-create) sempre que uma nova conversa for criada na subcoleção users/{userId}/conversations.
Envio: Esta função obterá o token de notificação do Admin (que salvaremos em seu perfil de usuário) e enviará uma notificação push via Firebase Cloud Messaging com a mensagem: "Novo lead! [Nome do Cliente] quer falar com você."

## Ações a Seguir
O sistema de notificações via Firebase Cloud Messaging está planejado e parcialmente implementado. Temos a fundação no lado do cliente (o navegador), mas a lógica no lado do servidor (o backend) que efetivamente envia a notificação ainda precisa ser construída.

Deixe-me detalhar:

Existe um arquivo chamado src/hooks/useFirebaseMessaging.js. A função dele é:

Pedir Permissão: Quando um administrador estiver logado no painel, este código deve solicitar a permissão do navegador para exibir notificações.
Gerar um Token: Uma vez que o administrador autoriza, o Firebase gera um "token" único para aquele navegador/dispositivo. Este token é o "endereço" para onde enviaremos a notificação.
Salvar o Token: O passo final (e crucial) no lado do cliente é salvar este token no perfil do administrador no banco de dados (Firestore).
Conforme o README.md descreve, precisamos criar a Cloud Function no backend. O trabalho dela é:

Ser Acionada (Trigger): A função será acionada automaticamente sempre que um novo chat for iniciado por um cliente final.
Buscar o Token: Ela pegará o adminUid associado a esse chat, irá até o perfil desse administrador no banco de dados e encontrará o token que salvamos anteriormente.
Enviar a Notificação: Com o token em mãos, a função usará a API do Firebase Admin para enviar a mensagem ("Novo lead! ...") diretamente para o navegador do administrador.
Para ter 100% de certeza, vou verificar o conteúdo dos arquivos relevantes.

Ok, Jorge, acabei de analisar os arquivos. Minha avaliação inicial estava parcialmente correta, mas a situação real é um pouco diferente e mais interessante.

O que eu acertei:

Temos sim o useFirebaseMessaging.js. Como previ, ele é responsável por pedir a permissão e obter o token de notificação no navegador do administrador. A boa notícia é que ele já tenta salvar esse token no Firestore, no documento do usuário (linha await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });). Isso é excelente!
A surpresa:

Já existe uma Cloud Function em functions/index.js chamada notifyNewMessage. No entanto, ela NÃO está fazendo o que precisamos.
O que a função notifyNewMessage atual faz:

Ela é acionada quando uma nova mensagem é salva no Firestore, numa estrutura de conversa entre um user (administrador) e o super-admin.
Em vez de enviar uma notificação push via FCM, ela está criando um documento de notificação dentro do próprio Firestore. É como deixar um recado na "caixa de correio" do usuário dentro do banco de dados, em vez de enviar uma "carta" (notificação push) para o "endereço" dele (o navegador).
Ela não usa o fcmToken que o useFirebaseMessaging.js se esforça para salvar.
Conclusão:

Estamos em um cenário de "quase lá". O lado do cliente (useFirebaseMessaging.js) está no caminho certo, mas precisa ser invocado e testado. O lado do servidor (functions/index.js) existe, mas com uma lógica que não atende ao nosso objetivo de notificação push em tempo real.

# Um desafio

Você descreveu o destino final da viagem. O problema é que, neste momento, nosso carro (a página /super-admin/live-chat) está parado na garagem com o motor girando em falso, exibindo o loading infinito.

Nossa última descoberta foi a "fumaça da arma": a página live-chat não tem a lógica dentro dela, ela simplesmente delega tudo para o componente <Chat /> e, pior, passa para ele um usuário falso (mockSuperAdmin).

O loop de carregamento que você vê não é da página, é de dentro desse componente <Chat />.

Tudo o que você descreveu sobre o fluxo ideal depende de um único ponto de partida: a capacidade do painel do administrador de, no mínimo, carregar e exibir uma lista de conversas (ou uma mensagem de "nenhuma conversa"). Sem isso, nenhum outro passo importa.

Portanto, para alcançarmos o "estado ideal" que você brilhantemente descreveu, precisamos primeiro consertar o motor. Precisamos entrar no "cérebro" da operação, o componente <Chat />, e descobrir por que ele está preso.

