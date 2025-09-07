/**
 * @fileoverview
 * Este arquivo define os tipos de dados centrais usados em toda a aplicação OmniFlow AI.
 * Ele formaliza os papéis de usuário e as estruturas de dados para garantir consistência
 * e permissões corretas em todo o sistema.
 */

/**
 * # Tipos de Usuário na Aplicação
 * A aplicação distingue dois papéis de usuário principais, cada um com acesso e
 * responsabilidades distintas, modelados pela analogia de um "Shopping Center".
 *
 * ## 1. Super Administrador (Dono do Shopping)
 * - **Descrição**: É o "Dono" ou "Gerente Geral" do sistema. Ele tem acesso e controle total sobre o aplicativo.
 * - **Acesso**: Acessa um painel de controle global (`/super-admin/*`).
 * - **Responsabilidades**:
 *   - Gerencia todos os outros usuários (Administradores).
 *   - Visualiza e gerencia **todos** os contatos de **todos** os administradores no sistema.
 *   - Configura a IA "pública" ou global.
 *   - Atua também como um Administrador Comum para sua própria lista de contatos.
 *
 * ## 2. Administrador Comum (Dono de Loja)
 * - **Descrição**: É um "Vendedor" ou "Atendente". Ele tem uma visão restrita, focada apenas em seus próprios recursos.
 * - **Acesso**: Acessa um painel de controle individual (`/admin/*`).
 * - **Responsabilidades**:
 *   - Gerencia **apenas** sua própria lista de contatos/clientes. Não pode ver os contatos de outros administradores.
 *   - Configura sua própria "persona" de IA para atender seus contatos.
 *   - O link de atendimento para seus clientes é único (ex: `dominio.com/chat/{seu-id-de-admin}`).
 *
 * ## 3. Usuário Final (Cliente)
 * - **Descrição**: Um cliente ou visitante externo que interage com o assistente de IA.
 * - **Acesso**: Acessa as páginas de chat públicas (ex: `/chat/id-do-admin`). Não possui login.
 * - **Responsabilidades**: Conversar com a IA para obter suporte ou informações.
 */

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'Super Admin' | 'Admin';
    avatar: string;
}

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: 'VIP' | 'Novo Usuário' | 'Ativo' | 'Inativo';
  avatar: string;
  ownerId: string; // ID do administrador que é 'dono' do contato
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

export type ContactInteraction = {
  id: string;
  contactId: string;
  adminId: string;
  type: 'Chat' | 'Ligação' | 'Email';
  timestamp: string;
  notes: string;
};
