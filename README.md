# Estado Atual do Sistema (Pós-Normalização)

**Funcionalidade Geral: ESTÁVEL E ROBUSTO**

O sistema passou por uma fase de normalização crucial, focada em alinhar as implementações de frontend e backend para garantir a funcionalidade completa das notificações em tempo real e o controle do administrador sobre a IA. O chat, que já estava estável, permanece totalmente funcional.

---

### Melhorias Implementadas

#### 1. Sistema de Notificação (NORMALIZADO E FUNCIONAL)

*   **Problema:** O administrador não recebia notificações push quando um visitante enviava uma nova mensagem.

*   **Diagnóstico:** Foi identificado um desencontro de contrato entre o frontend e o backend. O backend (`functions/index.js`) esperava um *array* no campo `fcmTokens` (plural), enquanto o frontend (`src/hooks/useFirebaseMessaging.js`) salvava uma *string* no campo `fcmToken` (singular).

*   **Solução:** A lógica do frontend foi corrigida para usar `arrayUnion`, alinhando-se ao contrato do backend. Nenhuma alteração foi necessária no backend.

*   **Resultado:** O sistema de notificação está **totalmente funcional**. Administradores recebem alertas em tempo real para novas mensagens.

#### 2. Controle da IA no Chat (CORRIGIDO E FUNCIONAL)

*   **Problema:** O botão "Ativar/Desativar IA" no painel de chat não funcionava como um interruptor. Após desativar a IA, não era possível reativá-la pela interface.

*   **Diagnóstico:** O problema era um bug de estado obsoleto (*stale state*) no frontend. O componente de chat (`src/components/chat.tsx`) não atualizava sua visão interna (`selectedChat`) após a alteração ser confirmada no banco de dados. Como resultado, a interface sempre "pensava" que a IA estava ativa e só oferecia a opção de desativar.

*   **Solução:** Foi implementada uma correção cirúrgica no `useEffect` que escuta as atualizações das listas de chats. Agora, sempre que uma alteração ocorre no banco de dados, o estado `selectedChat` é forçosamente atualizado com os dados mais recentes, garantindo que a interface sempre reflita o estado real.

*   **Resultado:** O controle da IA **funciona perfeitamente**. O administrador pode ativar e desativar a participação da IA em qualquer conversa com um clique, e a interface responderá corretamente, mostrando sempre a ação apropriada (Ativar ou Desativar).

---

# Convenções do Projeto

## Idioma

Toda a comunicação, documentação e código (comentários, variáveis, etc.) neste projeto devem ser em **Português do Brasil**.

## Ambiente de Desenvolvimento

O desenvolvimento é realizado utilizando o **Firebase Studio com a interface do Visual Studio Code**. O deploy para o App Hosting é feito através do botão "PUBLICAR", enquanto o deploy de Functions e Regras de Segurança é realizado via Firebase CLI.

---

# WhatsAI

Bem-vindo ao WhatsAI, uma plataforma de chat inteligente projetada para integração em websites, combinando a robustez do Firebase com a inteligência do Google Gemini.

Este documento serve como um guia de início rápido para a estrutura e os conceitos fundamentais do projeto.

---

## 1. Visão Geral da Arquitetura

A plataforma é construída sobre um ecossistema Next.js e Firebase, com uma clara separação de responsabilidades entre os diferentes tipos de utilizadores e serviços.


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

# Arquitetura e Lógica do Sistema WhatsAi

Este documento descreve a arquitetura de autenticação, autorização e a lógica de interação entre os diferentes tipos de utilizadores na plataforma WhatsAi. O objetivo é servir como uma referência central para prevenir bugs de lógica, especialmente loops de redirecionamento.

## 1. Os Atores do Sistema

Existem dois tipos fundamentais de "utilizadores" no sistema, cada um com um fluxo de autenticação e um propósito distintos.

### 1.1. Platform User (`Administrador` / `Superadmin`)

-   **Quem é?** É o cliente pagante, o dono do "workspace". Ele configura o sistema, personaliza a IA e pode intervir nas conversas.
-   **Como é criado?** Através do formulário de registo na `LoginPage`. A lógica de negócio dita que o primeiro utilizador a registar-se no sistema recebe a `role` de `superadmin`. Os utilizadores subsequentes recebem a `role` de `admin`.
-   **Autenticação:** Utiliza o sistema de **Email e Senha** do Firebase Authentication. Quando um admin faz login, ele tem um `FirebaseUser` com um `uid` permanente.
-   **Autorização e Dados:** A autenticação por si só não concede acesso. A autorização é governada por um documento na coleção do Firestore em **`/users/{uid}`**. Este documento **TEM** que existir e **TEM** que conter o campo `role` com o valor `'admin'` ou `'superadmin'`.
-   **A Chave (`uid`):** O `uid` do Firebase Authentication é a chave primária que liga a identidade de autenticação (quem ele diz ser) à sua autorização e dados de perfil no Firestore (o que ele pode fazer e quem ele é no sistema).

### 1.2. Visitor (`Visitante` / `Utilizador Anónimo`)

-   **Quem é?** É o cliente final que interage com o widget de chat no site do Administrador.
-   **Como é criado?** Automaticamente e de forma transparente. Quando um visitante carrega o widget de chat, o `chat-client.tsx` (a lógica do widget) chama a função `signInAnonymously()` do Firebase Authentication.
-   **Autenticação:** Utiliza o sistema de **Autenticação Anónima** do Firebase. Isto cria um `FirebaseUser` temporário com a propriedade `isAnonymous: true`. Este utilizador não tem email nem senha.
-   **Autorização e Dados:** Um visitante não tem um documento na coleção `/users`. A sua identidade é efémera. A sua sessão de chat é rastreada através do seu `uid` anónimo num documento na coleção `/chatSessions`.
-   **A Chave (`uid`):** O `uid` anónimo serve para identificar uma sessão de chat específica, garantindo que o visitante retome a sua conversa se recarregar a página.

---

## 2. O Fluxo de Autenticação e Autorização (Onde o Loop Acontecia)

Esta é a parte mais crítica e a fonte do nosso bug anterior.

### 2.1. O Coração: O Hook `useAuth()`

-   **Propósito:** É a **única fonte da verdade** no sistema para determinar se um utilizador está **autenticado E autorizado** a aceder às áreas de administração.
-   **Lógica Fundamental:**
    1.  Ele escuta o estado do `onAuthStateChanged` do Firebase, que lhe dá o `firebaseUser` (seja ele um admin logado ou um visitante anónimo).
    2.  Se um `firebaseUser` existe, o hook **imediatamente** tenta ler o documento correspondente no Firestore em `/users/{firebaseUser.uid}`.
    3.  **A DECISÃO CRÍTICA:** O hook só irá popular o seu estado `user` com os dados do perfil (`{ id, role, ... }`) se **TODAS** as seguintes condições forem verdadeiras:
        -   O documento `/users/{uid}` existe.
        -   O campo `role` nesse documento é `'admin'` ou `'superadmin'`.
    4.  Em **TODOS OS OUTROS CASOS** (utilizador não logado, utilizador anónimo, utilizador logado mas sem documento no Firestore, ou utilizador com `role` inválida), o hook definirá o seu estado `user` como **`null`**.
    5.  Ele expõe três estados cruciais: `user` (o perfil autorizado ou `null`), `loading` (um booleano que indica se a verificação dupla Auth+Firestore terminou) e `firebaseUser` (o objeto bruto do Firebase Auth).

### 2.2. A Guarda: O `AdminLayout`

-   **Propósito:** Proteger todas as rotas dentro de `/admin/*`.
-   **Lógica Fundamental:**
    1.  Ele consome o hook `useAuth`.
    2.  Possui um `useEffect` que observa `[loading, user]`.
    3.  **A PACIÊNCIA É UMA VIRTUDE:** A lógica de redirecionamento **SÓ** é executada quando `loading` é `false`. Isto é vital para esperar pela decisão final do `useAuth`.
    4.  Se `!loading && !user`, significa que o `useAuth` concluiu a sua verificação e determinou que o utilizador não é um admin autorizado. O layout então redireciona para `/login`.

### 2.3. O Portal: A `LoginPage`

-   **Propósito:** Servir de ponto de entrada para os `Platform Users`.
-   **Lógica Fundamental (A CORREÇÃO FINAL):**
    1.  Esta página é "burra" no que toca a redirecionamentos automáticos. Ela **NÃO CONTÉM** um `useEffect` para redirecionar utilizadores já logados.
    2.  A sua única responsabilidade é mostrar um ecrã de carregamento enquanto o `useAuth` inicializa (`isAuthLoading`) e, depois, mostrar o formulário de login.
    3.  O redirecionamento para o dashboard só acontece como consequência de uma ação do utilizador: uma chamada bem-sucedida às funções `handleLogin` ou `handleSignUp`.

---

## 3. A Lógica do Chat

-   **Início da Conversa:** Um `Visitor` anónimo é criado. Um novo documento é criado em `/chatSessions`, que armazena o `visitorId` (o `uid` anónimo) e o `adminId` a quem a conversa pertence.
-   **Troca de Mensagens:** Todas as mensagens (do visitante, da IA e do admin) são documentos dentro de uma subcoleção: `/chatSessions/{sessionId}/messages`. Cada documento de mensagem tem um `sender` (`'visitor'`, `'ai'`, `'admin'`) e o `text`.
-   **O Papel da IA:** A IA não é um "utilizador". É um serviço (Cloud Function) que é acionado quando uma nova mensagem do visitante é criada. Ela lê o histórico da conversa, gera uma resposta e escreve um novo documento de mensagem na mesma subcoleção com `sender: 'ai'`.
-   **Intervenção do Admin:** O admin, a partir do seu dashboard (`src/components/chat.tsx`), pode ler as conversas da coleção `/chatSessions` e escrever novas mensagens na subcoleção `/messages` com `sender: 'admin'`.
-   **Nota Técnica Crucial:** Para garantir a correta ordenação e visualização das mensagens em todos os clientes (visitante e admin), é **mandatório** que todos os documentos de mensagem incluam o campo `timestamp` com um `FieldValue.serverTimestamp()`. Queries que utilizam `orderBy('timestamp')` no frontend descartarão silenciosamente qualquer mensagem que não contenha este campo.

---

## Componentes e Funcionalidades Chave

Esta seção detalha componentes específicos e funcionalidades notáveis do sistema.

### Componente: `ShareChatLinkButton.tsx` (Botão "Divulgar no WhatsApp")

Localizado em `src/components/admin/ShareChatLinkButton.tsx`, este componente renderiza o botão no cabeçalho dos painéis de `admin` e `super-admin` para um compartilhamento rápido do link do chat.

#### 1. Visão Geral e Propósito

O botão fornece um método eficiente para o administrador compartilhar o link direto para seu assistente de chat via WhatsApp, substituindo a funcionalidade anterior de apenas copiar a URL.

#### 2. Interface e Experiência do Usuário (Frontend)

-   **Aparência:** Estilizado com a cor verde do WhatsApp (`bg-green-500`) e texto em branco para clara identificação.
-   **Ícone e Rótulo:** Exibe o ícone do WhatsApp (`FaWhatsapp`) junto ao texto "Divulgar no WhatsApp".
-   **Interação ao Clicar:**
    1.  Ao clicar, o ícone muda para um "Check" de confirmação por 2.5 segundos.
    2.  Uma notificação (toast) informa: "Link Copiado e pronto para compartilhar! Abrindo o WhatsApp...".
    3.  Uma nova aba do navegador é aberta, direcionando o usuário para a API do WhatsApp.

#### 3. Lógica e Funcionamento (Nos Bastidores)

-   **Guarda de Autenticação:** O componente só é renderizado se um usuário (`admin` ou `superadmin`) estiver autenticado, conforme determinado pelo hook `useAuth()`.

-   **Construção da URL do Chat:** A URL do chat é montada dinamicamente usando `window.location.origin` e o `user.id` do usuário logado (ex: `https://app.whatsai.com/chat/aBcDeFg12345`).

-   **Construção da URL de Compartilhamento do WhatsApp:**
    1.  Uma mensagem padrão é definida: `Olá! Inicie uma conversa comigo através deste link: [URL do Chat]`.
    2.  Esta mensagem é codificada com `encodeURIComponent()` para garantir que a URL seja válida.
    3.  A URL final é montada no formato: `https://api.whatsapp.com/send?text=[MENSAGEM_CODIFICADA]`.

-   **Execução da Ação Dupla:**
    1.  **Cópia:** A API do navegador `navigator.clipboard.writeText(chatUrl)` copia a URL do chat para a área de transferência como um fallback conveniente.
    2.  **Redirecionamento:** Imediatamente após a cópia bem-sucedida, `window.open(whatsappUrl, '_blank')` abre a URL do WhatsApp em uma nova aba, iniciando o compartilhamento.

-   **Dependências:** O componente requer a biblioteca `react-icons` para o ícone do WhatsApp.
