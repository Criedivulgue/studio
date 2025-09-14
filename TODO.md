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
