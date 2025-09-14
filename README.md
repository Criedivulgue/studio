# O WhatsAI
"O Complemento para seu WhatsApp Profissional."

Essa frase é muito mais do que um slogan. É a estratégia de produto inteira. O WhatsAI transforma o WhatsApp de uma ferramenta de mensagens caótica em um canal de negócios organizado, inteligente e proativo.

---

## 🚀 Funcionalidades Principais

O WhatsAI é equipado com um conjunto de funcionalidades projetadas para maximizar a eficiência e a personalização do atendimento ao cliente.

### 1. Assistente de IA Proativo

-   **Saudação Inteligente:** A IA não espera pelo cliente. Assim que um visitante abre a janela de chat, a IA o saúda proativamente, usando a personalidade e a mensagem de boas-vindas definidas pelo administrador. A primeira impressão é automatizada e personalizada.

### 2. Gestão de Contatos e Unificação de Histórico

-   **Reconhecimento Automático:** O sistema reconhece visitantes que retornam (usando o `localStorage` do navegador) e os pré-identifica para o administrador.
-   **Unificação de Conversas:** O administrador pode, com um clique, conectar uma sessão de um visitante anônimo a um contato existente ou criar um novo contato. Todo o histórico de conversa é imediatamente mesclado, criando uma visão 360º do cliente, independentemente do dispositivo que ele use.

### 3. Experiência Integrada ao WhatsApp

-   **Botão "Divulgar no WhatsApp":** O administrador pode compartilhar seu link de chat diretamente para o WhatsApp com um único botão, que já prepara uma mensagem padrão.
-   **Botão "Voltar ao WhatsApp":** O cliente, após conversar com a IA, pode retornar para o WhatsApp com um clique, criando um fluxo de interação contínuo e natural.

### 4. Notificações em Tempo Real

-   O administrador recebe notificações push instantâneas no navegador sempre que um visitante envia uma nova mensagem, permitindo uma intervenção humana imediata quando necessário.

### 5. Personalização Completa

-   **Perfil do Administrador:** Cada administrador pode configurar seu perfil com nome, mensagem de saudação e imagem de avatar, que é exibida corretamente nas conversas.
-   **Base de Conhecimento da IA:** O administrador pode fornecer um documento de conhecimento específico para a IA, garantindo que as respostas sejam precisas e alinhadas com o negócio.

---

## 🏛️ Arquitetura e Lógica do Sistema

Esta seção descreve a arquitetura de autenticação, autorização e a lógica de interação entre os diferentes tipos de utilizadores na plataforma WhatsAi.

### 1. Os Atores do Sistema

-   **Platform User (`Administrador` / `Superadmin`):** O cliente que configura o sistema. Autentica-se com Email/Senha e tem seus dados e `role` definidos em `/users/{uid}`.
-   **Visitor (`Visitante`):** O cliente final que interage com o widget. É autenticado anonimamente e sua sessão é rastreada em `/chatSessions/{sessionId}`.

### 2. Fluxo de Autenticação e Autorização

-   **`useAuth()` Hook:** A única fonte da verdade para determinar se um usuário está autenticado E autorizado a acessar as áreas de administração. Ele valida a autenticação do Firebase contra a existência e a `role` correta do perfil no Firestore.
-   **`AdminLayout`:** Protege as rotas `/admin/*`, redirecionando para o login se o `useAuth` não confirmar um usuário autorizado.

### 3. Lógica do Chat

-   **Criação da Sessão:** Uma nova sessão em `/chatSessions` é criada para cada visitante, vinculando o `visitorId` anônimo ao `adminId` correspondente.
-   **Troca de Mensagens:** As mensagens são armazenadas em ordem cronológica na subcoleção `/chatSessions/{sessionId}/messages`.
-   **Papel da IA:** Uma Cloud Function acionada por novas mensagens de visitantes lê o histórico, gera uma resposta com o Google Gemini e a insere na conversa como o papel `assistant`.

---

## 🎬 Como Começar

1.  **Instale as dependências:** `npm install`
2.  **Configure as suas variáveis de ambiente:** Crie um ficheiro `.env.local` com base no `.env.example`.
3.  **Execute o ambiente de desenvolvimento:** `npm run dev`
