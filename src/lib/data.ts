import type { PlatformUser, Contact, ChatSession, ContactInteraction, ActiveChat } from "./types";

// ETAPA DE CORREÇÃO: Corrigir dados mock para corresponder aos novos tipos.
// Importa PlatformUser e preenche todos os campos obrigatórios.

export const usersData: PlatformUser[] = [
    {
        id: '4xM4XWqy3qX4z9IQYxyHSXX7WaK2',
        name: 'cd.empreendimentos.sociais',
        email: 'cd.empreendimentos.sociais@gmail.com',
        role: 'superadmin',
        avatar: 'https://picsum.photos/seed/4xM4XWqy3qX4z9IQYxyHSXX7WaK2/40/40',
        status: 'active',
        whatsapp: '+5511999999999',
        createdAt: new Date(),
    },
    {
        id: 'admin-vendas',
        name: 'Admin Vendas',
        email: 'vendas@omniflow.ai',
        role: 'admin',
        avatar: 'https://picsum.photos/seed/admin-vendas/40/40',
        status: 'active',
        whatsapp: '+5511888888888',
        createdAt: new Date(),
    },
    {
        id: 'admin-suporte',
        name: 'Admin Suporte',
        email: 'suporte@omniflow.ai',
        role: 'admin',
        avatar: 'https://picsum.photos/seed/admin-suporte/40/40',
        status: 'active',
        whatsapp: '+5511777777777',
        createdAt: new Date(),
    }
];

export const contactsData: Contact[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', group: 'VIP', avatar: 'https://picsum.photos/seed/user1/40/40', ownerId: '4xM4XWqy3qX4z9IQYxyHSXX7WaK2', status: 'active', interesses: ['VIP'], createdAt: new Date() },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', group: 'Novo Usuário', avatar: 'https://picsum.photos/seed/user2/40/40', ownerId: 'admin-vendas', status: 'active', interesses: ['General'], createdAt: new Date() },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', group: 'Ativo', avatar: 'https://picsum.photos/seed/user3/40/40', ownerId: '4xM4XWqy3qX4z9IQYxyHSXX7WaK2', status: 'active', interesses: ['Support'], createdAt: new Date() },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', phone: '456-789-0123', group: 'VIP', avatar: 'https://picsum.photos/seed/user4/40/40', ownerId: 'admin-suporte', status: 'archived', interesses: ['VIP'], createdAt: new Date() },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', phone: '567-890-1234', group: 'Inativo', avatar: 'https://picsum.photos/seed/user5/40/40', ownerId: 'admin-vendas', status: 'inactive', interesses: ['Old'], createdAt: new Date() },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', phone: '678-901-2345', group: 'Novo Usuário', avatar: 'https://picsum.photos/seed/user6/40/40', ownerId: '4xM4XWqy3qX4z9IQYxyHSXX7WaK2', status: 'active', interesses: ['General'], createdAt: new Date() },
];

export const chatHistoryData: ChatSession[] = [
    { id: 'c1' },
    { id: 'c2' },
    { id: 'c3' },
    { id: 'c4' },
];

export const interactionsData: ContactInteraction[] = [
  { id: 'int1' },
  { id: 'int2' },
  { id: 'int3' },
  { id: 'int4' },
];

export const activeChatsData: ActiveChat[] = [
    {
        id: 'chat1',
        contact: { id: '7', name: 'Visitante 1', avatar: 'https://picsum.photos/seed/guest1/40/40' },
        lastMessage: 'Olá! Eu tenho uma pergunta sobre o preço.',
        timestamp: '10:40 AM',
        unreadCount: 2,
        messages: [
            { role: 'user', content: 'Olá! Eu tenho uma pergunta sobre o preço.' },
            { role: 'assistant', content: 'Claro! Como posso ajudar com os preços hoje?' },
            { role: 'user', content: 'Quais são os planos disponíveis?' },
        ],
        adminId: '4xM4XWqy3qX4z9IQYxyHSXX7WaK2'
    },
    {
        id: 'chat2',
        contact: { id: '8', name: 'Cliente Vendas', avatar: 'https://picsum.photos/seed/guest2/40/40' },
        lastMessage: 'Sim, por favor. Eu preciso de ajuda.',
        timestamp: '10:35 AM',
        unreadCount: 0,
        messages: [
            { role: 'assistant', content: 'Bem-vindo ao nosso suporte! Precisa de ajuda?' },
            { role: 'user', content: 'Sim, por favor. Eu preciso de ajuda.' },
        ],
        adminId: 'admin-vendas'
    },
     {
        id: 'chat3',
        contact: { id: '9', name: 'Cliente Suporte', avatar: 'https://picsum.photos/seed/guest3/40/40' },
        lastMessage: 'Meu aplicativo está travando.',
        timestamp: '10:32 AM',
        unreadCount: 1,
        messages: [
            { role: 'user', content: 'Meu aplicativo está travando.' },
        ],
        adminId: 'admin-suporte'
    }
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
