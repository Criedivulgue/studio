import type { Contact, ChatSession, User, ContactInteraction, ActiveChat } from "./types";

export const usersData: User[] = [
    { id: 'super-admin', name: 'Super Admin', email: 'admin@omniflow.ai', role: 'Super Admin', avatar: 'https://picsum.photos/seed/admin/40/40' },
    { id: 'admin-vendas', name: 'Admin Vendas', email: 'vendas@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-vendas/40/40' },
    { id: 'admin-suporte', name: 'Admin Suporte', email: 'suporte@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-suporte/40/40' }
]

export const contactsData: Contact[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', group: 'VIP', avatar: 'https://picsum.photos/seed/user1/40/40', ownerId: 'super-admin' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', group: 'Novo Usuário', avatar: 'https://picsum.photos/seed/user2/40/40', ownerId: 'admin-vendas' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', group: 'Ativo', avatar: 'https://picsum.photos/seed/user3/40/40', ownerId: 'super-admin' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', phone: '456-789-0123', group: 'VIP', avatar: 'https://picsum.photos/seed/user4/40/40', ownerId: 'admin-suporte' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', phone: '567-890-1234', group: 'Inativo', avatar: 'https://picsum.photos/seed/user5/40/40', ownerId: 'admin-vendas' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', phone: '678-901-2345', group: 'Novo Usuário', avatar: 'https://picsum.photos/seed/user6/40/40', ownerId: 'super-admin' },
];

export const chatHistoryData: ChatSession[] = [
    { id: 'c1', user: 'Bob Williams', date: '2024-05-10 10:30', status: 'Resolvido', snippet: 'Usuário perguntou sobre cobrança e o problema foi resolvido...' },
    { id: 'c2', user: 'Diana Miller', date: '2024-05-10 09:15', status: 'Aberto', snippet: 'Problema técnico com integração de API, escalando...' },
    { id: 'c3', user: 'Alice Johnson', date: '2024-05-09 17:20', status: 'Resolvido', snippet: 'Solicitação de redefinição de senha tratada com sucesso.' },
    { id: 'c4', user: 'Novo Visitante', date: '2024-05-09 15:00', status: 'Abandonado', snippet: 'Usuário deixou o chat antes que uma solução fosse encontrada.' },
];

export const interactionsData: ContactInteraction[] = [
  { id: 'int1', contactId: '2', adminId: 'admin-vendas', type: 'Chat', timestamp: '2024-05-15 11:00', notes: 'Iniciou um chat sobre a fatura de Abril.'},
  { id: 'int2', contactId: '4', adminId: 'admin-suporte', type: 'Ligação', timestamp: '2024-05-15 10:30', notes: 'Ligação para acompanhar o ticket #5421.'},
  { id: 'int3', contactId: '1', adminId: 'super-admin', type: 'Email', timestamp: '2024-05-14 16:20', notes: 'Enviou e-mail de boas-vindas ao plano VIP.'},
  { id: 'int4', contactId: '3', adminId: 'super-admin', type: 'Chat', timestamp: '2024-05-14 14:00', notes: 'Respondida dúvida sobre nova funcionalidade X.'},
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
        ]
    },
    {
        id: 'chat2',
        contact: { id: '8', name: 'Visitante 2', avatar: 'https://picsum.photos/seed/guest2/40/40' },
        lastMessage: 'Sim, por favor. Eu preciso de ajuda.',
        timestamp: '10:35 AM',
        unreadCount: 0,
        messages: [
            { role: 'assistant', content: 'Bem-vindo ao nosso suporte! Precisa de ajuda?' },
            { role: 'user', content: 'Sim, por favor. Eu preciso de ajuda.' },
        ]
    },
     {
        id: 'chat3',
        contact: { id: '9', name: 'Visitante 3', avatar: 'https://picsum.photos/seed/guest3/40/40' },
        lastMessage: 'Meu aplicativo está travando.',
        timestamp: '10:32 AM',
        unreadCount: 1,
        messages: [
            { role: 'user', content: 'Meu aplicativo está travando.' },
        ]
    }
]


export const chartData = [
  { date: "2024-04-01", chats: 28 },
  { date: "2024-04-02", chats: 45 },
  { date: "2024-04-03", chats: 32 },
  { date: "2024-04-04", chats: 51 },
  { date: "2024-04-05", chats: 48 },
  { date: "2024-04-06", chats: 62 },
  { date: "2024-04-07", chats: 55 },
];
