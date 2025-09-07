export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: 'VIP' | 'New User' | 'Active' | 'Inactive';
  avatar: string;
};

export type Broadcast = {
  id: string;
  message: string;
  channels: ('Email' | 'WhatsApp' | 'Push')[];
  target: 'All Users' | 'New User' | 'VIP' | 'Active' | 'Inactive';
  status: 'Sent' | 'Scheduled' | 'Draft' | 'Failed';
  date: string;
};

export type ChatSession = {
    id: string;
    user: string;
    date: string;
    status: 'Resolved' | 'Open' | 'Abandoned';
    snippet: string;
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
