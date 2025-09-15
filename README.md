# O WhatsAI
"O Complemento para seu WhatsApp Profissional."

Essa frase é muito mais do que um slogan. É a estratégia de produto inteira. O WhatsAI transforma o WhatsApp de uma ferramenta de mensagens caótica em um canal de negócios organizado, inteligente e proativo.

---

## Fluxo Principal

ciclo de vida de uma conversa de chat em sua plataforma:

Este processo pode ser dividido em cinco fases principais:

Chegada e Autenticação Anônima:

Quando um visitante abre a janela de chat pela primeira vez, o componente chat-client.tsx entra em ação.
Ele verifica se o usuário está autenticado. Como não está, ele chama a função signInAnonymously do Firebase.
O Firebase Auth cria uma identidade de usuário anônima com um uid único (ex: 1Xlfv9vmk3X...).
(Ponto da 1ª Correção) O sistema, então, salva esse uid anônimo no localStorage do navegador do visitante sob a chave plataforma_visitor_id.
Criação da Sessão de Chat:

Uma nova sessão é criada na coleção chatSessions do Firestore. O ID do documento é uma combinação do ID do administrador e do uid do visitante (ex: session_adminId_visitorUid).
Este documento contém informações iniciais como adminId, visitorUid e o anonymousVisitorId (que acabamos de salvar).
A Mensagem de Boas-Vindas da IA:

A criação do documento de sessão aciona a Cloud Function onChatSessionCreated.
Essa função espera alguns segundos e então instrui o Google Gemini a gerar uma mensagem de boas-vindas com base no prompt de IA definido pelo administrador.
A resposta da IA é salva como a primeira mensagem na subcoleção messages dentro do documento da sessão, com role: 'assistant'. O visitante vê essa mensagem na tela.
O Visitante Responde:

O visitante digita uma mensagem e a envia. O chat-client.tsx adiciona essa mensagem à subcoleção messages com role: 'user'.
A IA é Acionada:

A adição dessa nova mensagem aciona a Cloud Function onNewVisitorMessage.
(Ponto da Falha Atual) Esta função é o coração do problema. Ela deveria: a. Carregar o histórico da conversa até o momento. b. Pegar a nova mensagem do usuário. c. Combinar o prompt global da IA com a base de conhecimento específica do administrador. d. Enviar o histórico + as instruções + a nova mensagem para o Gemini. e. Receber a resposta do Gemini. f. Salvar a resposta na subcoleção messages com role: 'assistant'.
Notificação e Visualização:

A mesma função onNewVisitorMessage também envia uma notificação push para o administrador, informando sobre a nova mensagem.
O administrador pode clicar na notificação e ser levado à tela de chat ao vivo, onde ele vê a conversa entre o visitante e a IA.
Identificação do Contato:

O administrador pode, a qualquer momento, decidir "salvar" esse visitante como um contato permanente. Isso geralmente é feito através de um botão na interface de administração.
Sumarização pela IA:

Quando o administrador decide salvar o contato, uma Cloud Function (provavelmente archiveAndSummarizeConversation ou similar) é acionada.
Ela lê todo o histórico da conversa da sessão de chat.
Ela envia o histórico completo para o Gemini com uma instrução específica, como: "Resuma esta conversa, extraia o nome, email, telefone e as principais necessidades do cliente."
Criação do Contato Permanente:

A função recebe o resumo estruturado da IA.
Ela cria um novo documento na coleção contacts.
Este documento armazena as informações extraídas (nome, email, etc.), o resumo da conversa e, crucialmente, o uid anônimo original do visitante em um campo de array chamado anonymousVisitorIds. Isso cria um vínculo permanente entre o perfil do contato e o identificador do navegador do visitante.
Reconhecimento:

Quando o mesmo visitante retorna ao site/chat, o chat-client.tsx lê o plataforma_visitor_id do localStorage.
Uma nova sessão de chat é criada, mas ela contém o mesmo anonymousVisitorId de antes.
A função onChatSessionCreated é acionada novamente. Desta vez, sua sub-rotina preIdentifyContact encontra uma correspondência: ela consulta a coleção contacts e encontra o documento que contém aquele anonymousVisitorId no array.
A sessão de chat atual é atualizada com o ID do contato permanente, exibindo para o admin algo como "Provavelmente João Silva".
Respostas Futuras Contextualizadas:

Agora, quando a função onNewVisitorMessage for acionada, ela pode não apenas usar a base de conhecimento do admin, mas também consultar o documento do contato correspondente, ler o resumo da conversa anterior e injetá-lo no prompt da IA.
Isso permite que a IA responda com muito mais contexto: "Olá João, bem-vindo de volta! Da última vez, conversamos sobre o seu projeto de e-commerce. Como posso ajudá-lo a continuar hoje?"

## Fluxo de Notificaçoes

Busca de Tokens: A função identifica corretamente o adminId da sessão de chat, busca o documento do usuário correspondente no Firestore e lê o campo fcmTokens, que deve ser um array.
Construção da Mensagem: Ela cria um payload de notificação claro, com um título, o corpo da mensagem e, crucialmente, um link na seção webpush. Esse link é o que torna a notificação clicável, levando o administrador diretamente para a conversa correta (/admin/live-chat?chatId=...).
Envio: A função usa o método admin.messaging().sendToDevice(), que é a maneira correta de enviar uma notificação para uma lista de tokens de dispositivo.
Limpeza Automática: O código inclui uma lógica excelente para lidar com tokens expirados ou inválidos. Após cada tentativa de envio, ele verifica quais tokens falharam e os remove automaticamente do banco de dados. Isso mantém o sistema saudável e eficiente a longo prazo.

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

### 4. Nossas Cloud Functions
- [x] **Refatoração das Cloud Functions**: O arquivo monolítico `functions/index.js` foi refatorado com sucesso.

Status	Função	Gatilho	Versão	Solicitações (24 horas)	Mín. / Máx. de instâncias	Tempo limite	Ações
toggleAIChat
southamerica-east1
Solicitação
https://toggleaichat-iahq7eme2q-rj.a.run.app
v2	10	0 / 20	1min	
archiveAndSummarizeConversation
southamerica-east1
Solicitação
https://archiveandsummarizeconversation-iahq7eme2q-rj.a.run.app
v2	0	0 / 20	1min	
onChatSessionCreated
southamerica-east1
document.created
v2	15	0 / 20	1min	
identifyLead
southamerica-east1
Solicitação
https://identifylead-iahq7eme2q-rj.a.run.app
v2	0	0 / 20	1min	
cleanupOldChatSessions
southamerica-east1
v2	1	0 / 20	1min	
searchContacts
southamerica-east1
Solicitação
https://searchcontacts-iahq7eme2q-rj.a.run.app
v2	0	0 / 20	1min	
connectSessionToContact
southamerica-east1
Solicitação
https://connectsessiontocontact-iahq7eme2q-rj.a.run.app
v2	0	0 / 20	1min	
onNewVisitorMessage
southamerica-east1
document.created
v2	67	0 / 20	1min