# WhatsAI

Bem-vindo ao WhatsAI, uma plataforma de chat inteligente projetada para integração em websites, combinando a robustez do Firebase com a inteligência do Google Gemini.

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

## Ação Atual para Inspecionar e Resolver
Inspecione para CONFIRMAR SE AS SEGUINTE INFORMAÇÕES ESTÃO CORRETAS, LEIA TAMBEM O /SYSTEM_ARCHITECTURE.md

# Conforme o desenvolvedor anterior:
Botão "Divulgar Chat"

 o componente src/components/admin/CopyChatLinkButton.tsx tem a lógica errada. Mesmo após minha correção anterior (que ajustou o formato da URL de /?adminId= para /chat/), a funcionalidade principal ainda é apenas copiar o link. Ela não cria um link de compartilhamento para o WhatsApp (https://wa.me/...) com uma mensagem personalizada. O nome do arquivo e o ícone também estão desalinhados com a funcionalidade desejada de "Compartilhar".
Recomendação: O componente precisa ser fundamentalmente alterado.
Renomear o arquivo para algo mais apropriado, como ShareChatLinkButton.tsx.
Alterar o ícone e o texto para refletir a ação de compartilhar.
Reescrever a lógica handleCopy para construir e abrir uma URL wa.me que inclua uma mensagem de texto e o link do chat.

# Metadata para pré-visualizaçao OPEN GRAPH
Status: Não Implementado
Observação: Verifiquei o arquivo src/app/chat/[adminUid]/page.tsx. Atualmente, ele não possui a função generateMetadata. Isso significa que, quando um link de chat é compartilhado, nenhuma pré-visualização com o nome e a imagem do administrador será exibida. A funcionalidade descrita na arquitetura está ausente.
Recomendação: Implementar a função generateMetadata neste arquivo. A função precisará buscar os dados do perfil público do administrador no Firestore (public_profiles) e usar esses dados para exportar as meta-tags og:title, og:description, e og:image.
Status: Não Implementado
Observação: Analisei a página inicial em src/app/page.tsx. A lógica para buscar dinamicamente o superAdminId do documento de configuração (public_config/global) e atribuí-lo ao botão "Iniciar Atendimento" não está presente. Isso significa que a página inicial não está direcionando para o chat do super-administrador conforme especificado.
Recomendação: Adicionar a lógica de busca de dados no lado do servidor (server-side) à src/app/page.tsx para obter o superAdminId e passá-lo como prop para o botão, tornando o link dinâmico.
Para alinhar o projeto com a arquitetura definida, proponho executar as seguintes tarefas, em ordem:

Corrigir o Botão de Compartilhamento: Renomear o arquivo src/components/admin/CopyChatLinkButton.tsx para ShareChatLinkButton.tsx e reescrever completamente sua funcionalidade para criar e abrir um link de compartilhamento do WhatsApp.
Implementar a Geração de Metadata: Criar e implementar a função generateMetadata em src/app/chat/[adminUid]/page.tsx para permitir a pré-visualização de links.
Implementar a Lógica do Super-Admin: Modificar a página inicial (src/app/page.tsx) para buscar dinamicamente o ID do super-administrador e configurar o link do botão de chat principal.

## Base para a Implementação
Aqui está a lista de arquivos e a justificativa para a alteração em cada um:

Arquivo: src/components/admin/CopyChatLinkButton.tsx
Justificativa: Este é o componente do botão. A sua lógica será reescrita para, em vez de copiar um link, construir e abrir uma URL do WhatsApp (https://wa.me/...) contendo uma mensagem padrão e o link do chat. O texto e o ícone do botão também serão atualizados aqui para refletir a nova ação.
Arquivo: src/app/chat/[adminUid]/page.tsx

Justificativa: Para que a pré-visualização do link funcione, precisamos adicionar metadados (título e imagem) ao HTML da página. No Next.js, isso é feito exportando uma função generateMetadata neste arquivo. A função irá rodar no servidor para buscar as informações do administrador antes de a página ser enviada para o visitante.
Arquivo: src/lib/firebase-admin.ts

Justificativa: A função generateMetadata precisa buscar dados do perfil do administrador (nome, foto) no Firestore. Essa busca no lado do servidor requer uma instância autenticada do Firebase Admin. Este arquivo centraliza a inicialização e o acesso a essa instância, e será usado pela função generateMetadata.
Arquivo: src/lib/types.ts

Justificativa: Para garantir a consistência e segurança dos dados, definiremos um tipo PublicProfile neste arquivo. Ele irá modelar a estrutura dos dados do perfil público (ex: displayName, avatarUrl) que são lidos do Firestore e usados pela função generateMetadata.
Arquivo: src/app/page.tsx

Justificativa: Esta é a página inicial. Atualmente, ela é estática. Precisamos adicionar lógica de busca de dados no lado do servidor a este arquivo para que ele consulte o Firestore, obtenha o superAdminId da configuração global (public_config/global), e passe esse ID para o componente do botão "Iniciar Atendimento".
Arquivo: src/lib/firebase-admin.ts

Justificativa: Assim como na tarefa anterior, a página inicial usará a instância do Firebase Admin deste arquivo para se conectar de forma segura ao Firestore no servidor e buscar o superAdminId.
Estes são todos os arquivos que precisam ser modificados. A análise confirma que as alterações propostas estão alinhadas com a arquitetura do Next.js e com as melhores práticas para interagir com o Firebase.
