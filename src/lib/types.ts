/**
 * @fileoverview
 * Este arquivo define os tipos de dados centrais usados em toda a aplicação OmniFlow AI.
 */

/**
 * # Tipos de Usuário na Aplicação
 * A aplicação distingue três papéis de usuário principais:
 *
 * ## 1. Super Administrador (Dono do Shopping)
 * - **Descrição**: É o "Dono" ou "Gerente Geral" do sistema. Ele tem acesso e controle total sobre o aplicativo.
 * - **Acesso**: Acessa um painel de controle global (ex: `/super-admin-dashboard`).
 * - **Responsabilidades**:
 *   - Gerencia todos os outros usuários (Administradores, Parceiros, etc.).
 *   - Visualiza e gerencia **todos** os contatos de **todos** os administradores no sistema.
 *   - Configura a IA "pública" ou global.
 *   - Cria e envia transmissões (broadcasts) para todos os usuários ou segmentos.
 *   - Atua também como um Administrador Comum para sua própria lista de contatos.
 *
 * ## 2. Administrador Comum (Dono de Loja)
 * - **Descrição**: É um "Vendedor" ou "Atendente". Ele tem uma visão restrita, focada apenas em seus próprios recursos.
 * - **Acesso**: Acessa um painel de controle individual (ex: `/admin-dashboard`).
 * - **Responsabilidades**:
 *   - Gerencia **apenas** sua própria lista de contatos/clientes. Não pode ver os contatos de outros administradores.
 *   - Configura sua própria "persona" de IA para atender seus contatos.
 *   - O link de atendimento para seus clientes é único (ex: `dominio.com/chat/{seu-id-de-admin}`).
 *
 * ## 3. Usuário Final (Cliente)
 * - **Descrição**: Um cliente ou visitante externo que interage com o assistente de IA.
 * - **Acesso**: Acessa as páginas de chat públicas (ex: `/chat/id-do-admin`).
 * - **Responsabilidades**: Conversar com a IA para obter suporte ou informações.
 */
export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: 'VIP' | 'Novo Usuário' | 'Ativo' | 'Inativo';
  avatar: string;
  ownerId: string; // ID do administrador que é 'dono' do contato
};

export type Broadcast = {
  id: string;
  message: string;
  channels: ('Email' | 'WhatsApp' | 'Push')[];
  target: 'Todos os Usuários' | 'Novo Usuário' | 'VIP' | 'Ativo' | 'Inativo';
  status: 'Enviada' | 'Agendada' | 'Rascunho' | 'Falhou';
  date: string;
};

export type ChatSession = {
    id: string;
    user: string;
    date: string;
    status: 'Resolvido' | 'Aberto' | 'Abandonado';
    snippet: string;
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
