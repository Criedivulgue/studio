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
