import type { Contact, Broadcast, ChatSession, User } from "./types";

export const usersData: User[] = [
    { id: 'super-admin', name: 'Super Admin', email: 'admin@omniflow.ai', role: 'Super Admin', avatar: 'https://picsum.photos/seed/admin/40/40' },
    { id: 'admin-vendas', name: 'Admin Vendas', email: 'vendas@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-vendas/40/40' },
    { id: 'admin-suporte', name: 'Admin Suporte', email: 'suporte@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-suporte/40/40' }
]

export const contactsData: Contact[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', group: 'VIP', avatar: '/avatars/01.png', ownerId: 'super-admin' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', group: 'Novo Usuário', avatar: '/avatars/02.png', ownerId: 'admin-vendas' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', group: 'Ativo', avatar: '/avatars/03.png', ownerId: 'super-admin' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', phone: '456-789-0123', group: 'VIP', avatar: '/avatars/04.png', ownerId: 'admin-suporte' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', phone: '567-890-1234', group: 'Inativo', avatar: '/avatars/05.png', ownerId: 'admin-vendas' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', phone: '678-901-2345', group: 'Novo Usuário', avatar: '/avatars/01.png', ownerId: 'super-admin' },
];

export const broadcastData: Broadcast[] = [
  { id: 'b1', message: '🎉 Alerta de Novo Recurso: Agora você pode personalizar seu assistente de IA!', channels: ['Email', 'Push'], target: 'Todos os Usuários', status: 'Enviada', date: '2024-05-10' },
  { id: 'b2', message: 'Ganhe 20% de desconto em todos os planos premium. Oferta por tempo limitado!', channels: ['Email'], target: 'Novo Usuário', status: 'Enviada', date: '2024-05-08' },
  { id: 'b3', message: 'Manutenção agendada para este domingo às 2h.', channels: ['Push'], target: 'Todos os Usuários', status: 'Agendada', date: '2024-05-15' },
  { id: 'b4', message: 'Bem-vindo ao OmniFlow AI! Estamos aqui para ajudar você.', channels: ['Email'], target: 'Novo Usuário', status: 'Rascunho', date: '2024-05-20' },
];

export const chatHistoryData: ChatSession[] = [
    { id: 'c1', user: 'Bob Williams', date: '2024-05-10 10:30', status: 'Resolvido', snippet: 'Usuário perguntou sobre cobrança e o problema foi resolvido...' },
    { id: 'c2', user: 'Diana Miller', date: '2024-05-10 09:15', status: 'Aberto', snippet: 'Problema técnico com integração de API, escalando...' },
    { id: 'c3', user: 'Alice Johnson', date: '2024-05-09 17:20', status: 'Resolvido', snippet: 'Solicitação de redefinição de senha tratada com sucesso.' },
    { id: 'c4', user: 'Novo Visitante', date: '2024-05-09 15:00', status: 'Abandonado', snippet: 'Usuário deixou o chat antes que uma solução fosse encontrada.' },
];

export const chartData = [
  { date: "2024-04-01", chats: 28 },
  { date: "2024-04-02", chats: 45 },
  { date: "2024-04-03", chats: 32 },
  { date: "2024-04-04", chats: 51 },
  { date: "2024-04-05", chats: 48 },
  { date: "2024-04-06", chats: 62 },
  { date: "2024-04-07", chats: 55 },
];
