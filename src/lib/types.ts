/**
 * @fileoverview
 * Este arquivo define os tipos de dados centrais usados em toda a aplicação OmniFlow AI.
 *
 * @description
 * # Tipos de Usuário na Aplicação
 *
 * A aplicação distingue dois papéis de usuário principais:
 *
 * 1.  **Administrador**:
 *     - **Descrição**: Um usuário interno que gerencia o sistema.
 *     - **Acesso**: Acessa o painel de administração (`/admin/*`).
 *     - **Responsabilidades**: Configurar o comportamento da IA, gerenciar contatos,
 *       enviar transmissões e monitorar a atividade do chat.
 *     - **Observação**: Atualmente, não há um tipo de dados explícito para Administradores
 *       no banco de dados; seu papel é inferido pelo acesso à rota `/admin`. O termo "Super Admin"
 *       usado na UI é um placeholder.
 *
 * 2.  **Usuário Final (Cliente)**:
 *     - **Descrição**: Um cliente ou visitante externo que interage com o assistente de IA.
 *     - **Acesso**: Acessa as páginas de chat públicas (ex: `/chat/nome-do-admin`).
 *     - **Responsabilidades**: Conversar com a IA para obter suporte ou informações.
 *     - **Tipo de Dados**: `Contact` representa as informações de um Usuário Final.
 */
export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: 'VIP' | 'Novo Usuário' | 'Ativo' | 'Inativo';
  avatar: string;
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
