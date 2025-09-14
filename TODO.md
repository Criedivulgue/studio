# Histórico de Tarefas e Próximos Passos

Este documento rastreia as principais tarefas concluídas e as que estão no backlog para futuras implementações.

---

## 🟡 PRIORIDADE ATUAL: Refatoração da Experiência do Chat Ao Vivo

**Status:** Planejamento concluído, implementação pendente.

**Objetivo:** Corrigir problemas críticos de usabilidade e layout na interface do chat do administrador para melhorar a eficiência e a experiência de uso em todos os dispositivos, especialmente os móveis.

### Tarefas Imediatas:

1.  **Implementar Layout Responsivo (Mobile-First):**
    *   **Arquivo Alvo:** `src/components/chat.tsx`
    *   **Descrição:** Reestruturar o layout para que, em telas pequenas, o comportamento seja adaptativo. A visualização inicial mostrará apenas a lista de conversas. Ao selecionar um chat, a lista será ocultada e a janela da conversa ocupará toda a tela. Um botão "Voltar" permitirá a navegação de volta à lista.

2.  **Adicionar Controle da IA (Botão Ligar/Desligar):**
    *   **Descrição:** Após a implementação do layout responsivo, adicionar um botão de controle (toggle) na interface de cada conversa. Este botão permitirá ao administrador ativar ou desativar as respostas automáticas da IA para aquele chat específico, dando-lhe controle total sobre a interação.
    *   **Impacto no Backend:**
        *   Adicionar um campo `aiEnabled` (boolean) aos modelos de dados `chatSessions` e `conversations`.
        *   Modificar a Cloud Function `onNewVisitorMessage` para verificar esse campo antes de processar uma resposta.
        *   Criar uma nova Cloud Function para ser chamada pelo botão, que irá simplesmente inverter o valor do campo `aiEnabled` no banco de dados.

---

## 🔵 BACKLOG: Melhorias Estratégicas do Chat

**Descrição:** Funcionalidades de alto impacto planejadas para implementação após a conclusão da refatoração da interface.

1.  **Enriquecimento da Qualificação de Leads:**
    *   **Objetivo:** Aumentar a qualidade dos dados coletados no momento da conversão de um visitante em lead, o que irá enriquecer o perfil do contato e fornecer mais contexto para a IA em interações futuras.
    *   **Ação:** Modificar o modal `LeadIdentificationModal.tsx` e a função `identifyLead` para incluir os campos (obrigatórios): `WhatsApp`, `Grupo` e `Tags`.

2.  **Reconhecimento Contínuo do Cliente:**
    *   **Objetivo:** Implementar um mecanismo para que o sistema reconheça um cliente que retorna ao chat, carregando seu histórico e perfil automaticamente, em vez de tratá-lo como um novo "Visitante Anônimo".
    *   **Ação:** Desenvolver um fluxo onde, após a identificação, um `contactId` permanente é salvo no `localStorage` do navegador do cliente, servindo como um "carimbo" de reconhecimento para visitas futuras.

3.  **Mensagem de Boas-Vindas Proativa da IA:**
    *   **Objetivo:** Aumentar as taxas de engajamento do chat, fazendo com que a IA inicie a conversa com uma saudação assim que o visitante abre a janela de chat.
    *   **Ação:** Criar uma nova Cloud Function, acionada na criação de uma `chatSession`, responsável por postar a primeira mensagem automática.

---

## ✅ Concluído: Funcionalidade "Divulgar no WhatsApp"

**Status:** Implementado e documentado.

**Resumo:** O botão de compartilhamento nos painéis de administração foi refatorado. Agora, ele copia o link do chat e, simultaneamente, abre a API do WhatsApp com uma mensagem pronta, agilizando a divulgação. O componente `ShareChatLinkButton.tsx` foi implementado e integrado nos layouts de admin e super-admin.
