# Backlog de Funcionalidades Essenciais

Este documento rastreia as próximas funcionalidades a serem implementadas para aprimorar o sistema de chat.

---

### [CONCLUÍDO] Gestão de Contatos e Unificação de Histórico

*   **Objetivo:** Permitir que o administrador conecte conversas de visitantes anônimos a contatos existentes ou crie novos contatos, unificando o histórico do cliente mesmo que ele acesse de múltiplos dispositivos.
*   **Implementação:**
    *   O modal de "Identificar Lead" foi transformado em um modal "Identificar / Conectar".
    *   Adicionada funcionalidade de busca de contatos por nome, email ou WhatsApp.
    *   Implementado fluxo de backend para mesclar uma sessão anônima com o histórico de um contato existente (`connectSessionToContact`).
    *   Implementada a criação de novos contatos a partir do mesmo modal, incluindo o campo WhatsApp.
*   **Status:** Concluído.

---

### 1. Reconhecimento Automático de Visitantes (Pré-identificação)

*   **Objetivo:** Fazer com que o sistema reconheça automaticamente um visitante que retorna, mesmo antes de o administrador interagir. Se um visitante já foi conectado a um contato no passado (no mesmo navegador), o sistema deve pré-identificá-lo, facilitando a vida do administrador.
*   **Ação:**
    1.  **"Carimbo" Anônimo:** No momento em que uma sessão é conectada a um contato, gerar um ID anônimo e seguro (`anonymousVisitorId`) e salvá-lo no `localStorage` do navegador do visitante. Este mesmo ID será adicionado a um array (`anonymousVisitorIds`) no documento do `Contact` correspondente no Firestore.
    2.  **Verificação no Início da Sessão:** O widget do chat, ao iniciar uma nova sessão, verificará se existe um `anonymousVisitorId` no `localStorage`. Se houver, ele enviará este ID junto com os dados da nova sessão.
    3.  **Pré-vinculação no Backend:** Uma função no backend detectará a presença do `anonymousVisitorId` na nova sessão, buscará o contato correspondente e adicionará um campo `probableContactId` ao documento da `chatSession`.
    4.  **Modal Inteligente:** O modal "Identificar / Conectar", ao ser aberto para uma sessão que contém um `probableContactId`, buscará automaticamente os dados deste contato e os exibirá em destaque, oferecendo uma opção de "Confirmar Conexão" com um único clique, ao mesmo tempo que mantém a opção de busca manual.

---

### 2. Mensagem de Boas-Vindas Proativa da IA

*   **Objetivo:** Fazer com que a IA inicie a conversa de forma proativa com uma saudação e uma pergunta relevante, em vez de esperar passivamente pela primeira mensagem do visitante.
*   **Ação:** Criar uma nova Cloud Function acionada pela criação de um novo documento `chatSession`. Esta função terá um delay de alguns segundos e então enviará a primeira mensagem como "assistente", usando o prompt de boas-vindas definido pelo administrador.

---

### 3. Normalização do Sistema de Notificações

*   **Objetivo:** Garantir que o administrador seja notificado em tempo real (via notificação push no navegador) sempre que um visitante enviar uma nova mensagem em uma sessão de chat anônima.
*   **Diagnóstico (Estado Atual):**
    *   O sistema de notificação está **parcialmente implementado, mas inoperante**.
    *   **Frontend (Funcional):** A lógica para solicitar permissão de notificação (`src/hooks/useFirebaseMessaging.js`) e salvar o token do dispositivo (`fcmToken`) no perfil do administrador já existe e funciona.
    *   **Backend (Ponto de Falha):** A Cloud Function `onNewVisitorMessage` (em `functions/index.js`), que é acionada corretamente quando uma nova mensagem chega, **não possui a lógica para enviar a notificação push**. Ela atualmente apenas processa a resposta da IA.
    *   **Conclusão:** O sistema de chat está **desconectado** do sistema de notificação no backend. A "fiação" precisa ser concluída.
*   **Plano de Ação (Normalização):**
    1.  **Modificar a Cloud Function `functions/index.js`:** Inserir, no início da função `onNewVisitorMessage`, a lógica de notificação.
    2.  **Lógica a ser inserida:**
        *   Obter o `adminId` da sessão de chat.
        *   Ler o documento do administrador (`users/{adminId}`) para recuperar a lista de `fcmTokens`.
        *   Se existirem tokens, montar uma notificação com título (`Nova mensagem de...`), corpo (a mensagem do visitante) e um link (`/admin/live-chat?chatId=...`).
        *   Utilizar `admin.messaging().sendToDevice()` para enviar a notificação para os tokens.
        *   Realizar a limpeza de tokens inválidos que possam ser retornados na resposta do envio.
*   **Status:** Em progresso. O diagnóstico foi concluído e a modificação no `functions/index.js` está pronta para ser aplicada.

### Nova Funcinalidade simples a inserir
Vamos inseri no Chat do cliente um botão "Voltar ao WhatsApp" ao lado esquerdo do "X" de fechar e encaminhar à página inicial da APP.

Isso será uma experiencia muito mais integrada ao Whatsapp que é nossa intenção, pois o cliente recebe sempre o link através de seu WhatsApp e entao ao terminar o chat no WhatsAi, poderá continar fechando "X" e ser encaminhado APP ou voltar direto pro seu Whatsapp novamente.

### Imagem do Avatar

A imagem de avatar não está sendo salva no perfil do usuário administrador comum nem do Super.... Verifiar de o chat do administrador comum mostra o seu avatar... no do super administrador mostra.
