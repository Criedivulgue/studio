import type { Contact, Broadcast, ChatSession } from "./types";

export const contactsData: Contact[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', group: 'VIP', avatar: '/avatars/01.png' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', group: 'New User', avatar: '/avatars/02.png' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', group: 'Active', avatar: '/avatars/03.png' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', phone: '456-789-0123', group: 'VIP', avatar: '/avatars/04.png' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', phone: '567-890-1234', group: 'Inactive', avatar: '/avatars/05.png' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', phone: '678-901-2345', group: 'New User', avatar: '/avatars/01.png' },
];

export const broadcastData: Broadcast[] = [
  { id: 'b1', message: '🎉 New Feature Alert: You can now customize your AI assistant!', channels: ['Email', 'Push'], target: 'All Users', status: 'Sent', date: '2024-05-10' },
  { id: 'b2', message: 'Get 20% off on all premium plans. Limited time offer!', channels: ['Email', 'WhatsApp'], target: 'New User', status: 'Sent', date: '2024-05-08' },
  { id: 'b3', message: 'Scheduled maintenance this Sunday at 2 AM.', channels: ['Push'], target: 'All Users', status: 'Scheduled', date: '2024-05-15' },
  { id: 'b4', message: 'Welcome to OmniFlow AI! We are here to help you.', channels: ['Email'], target: 'New User', status: 'Draft', date: '2024-05-20' },
];

export const chatHistoryData: ChatSession[] = [
    { id: 'c1', user: 'Bob Williams', date: '2024-05-10 10:30 AM', status: 'Resolved', snippet: 'User asked about billing and issue was resolved...' },
    { id: 'c2', user: 'Diana Miller', date: '2024-05-10 09:15 AM', status: 'Open', snippet: 'Technical issue with API integration, escalating...' },
    { id: 'c3', user: 'Alice Johnson', date: '2024-05-09 05:20 PM', status: 'Resolved', snippet: 'Password reset request successfully handled.' },
    { id: 'c4', user: 'New Guest', date: '2024-05-09 03:00 PM', status: 'Abandoned', snippet: 'User left the chat before a resolution was found.' },
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
