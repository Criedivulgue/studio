/**
 * @fileoverview
 * Este arquivo define os tipos de dados centrais usados em toda a aplicação OmniFlow AI.
 */

/**
 * # Tipos de Usuário na Aplicação
 *
 * A aplicação distingue três papéis de usuário principais:
 *
 * 1.  **Super Administrador**:
 *     - **Descrição**: O usuário de nível mais alto com controle total sobre o aplicativo.
 *     - **Acesso**: Acessa o painel de administração (`/admin/*`) e pode ver/gerenciar todos os dados.
 *     - **Responsabilidades**: Gerenciar outros administradores, supervisionar todos os contatos e chats,
 *       configurar configurações globais do aplicativo.
 *
 * 2.  **Administrador**:
 *     - **Descrição**: Um usuário interno com permissões limitadas para gerenciar seus próprios recursos.
 *     - **Acesso**: Acessa o painel de administração (`/admin/*`), mas sua visão é restrita.
 *     - **Responsabilidades**: Gerenciar apenas seus próprios contatos e interagir com os chats
 *       associados a eles. Não pode ver os contatos de outros administradores.
 *
 * 3.  **Usuário Final (Cliente)**:
 *     - **Descrição**: Um cliente ou visitante externo que interage com o assistente de IA.
 *     - **Acesso**: Acessa as páginas de chat públicas (ex: `/chat/nome-do-admin`).
 *     - **Responsabilidades**: Conversar com a IA para obter suporte ou informações.
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
