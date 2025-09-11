import {
  LayoutDashboard, 
  MessageSquare, 
  Contact, 
  History, 
  Group, 
  Bot, 
  Users, 
  BookUser, 
  Users2,
  Settings
} from 'lucide-react';
import type { NavItem } from '@/components/sidebar-nav';

// Lista de links para o Administrador Comum
export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/admin/live-chat", icon: MessageSquare, label: "Chat ao Vivo" },
  { href: "/admin/contacts", icon: Contact, label: "Meus Contatos" },
  { href: "/admin/groups", icon: Group, label: "Grupos" },
  { href: "/admin/history", icon: History, label: "Histórico" },
  { href: "/admin/ai-config", icon: Bot, label: "Config IA" },
];

// Lista de links para o Super Administrador
export const superAdminNavItems: NavItem[] = [
  {
    href: "/super-admin/dashboard", 
    label: "Painel de Controle",
    icon: LayoutDashboard
  },
  // === SEÇÃO PESSOAL ===
  {
    href: "/super-admin/my-contacts",
    label: "Meus Contatos",
    icon: Contact
  },
  {
    href: "/super-admin/my-groups",
    label: "Meus Grupos",
    icon: Group
  },
  {
    href: "/super-admin/my-ai-config",
    label: "Minha Config IA",
    icon: Bot
  },
  // === SEÇÃO GLOBAL ===
  {
    href: "/super-admin/live-chat", 
    label: "Chat ao Vivo",
    icon: MessageSquare
  },
  {
    href: "/super-admin/history",
    label: "Histórico de Chats",
    icon: History
  },
  {
    href: "/super-admin/admins",
    label: "Administradores",
    icon: Users
  },
  {
    href: "/super-admin/users",
    label: "Todos os Usuários",
    icon: Users2
  },
  {
    href: "/super-admin/contacts",
    label: "Contatos Globais",
    icon: BookUser
  },
  {
    href: "/super-admin/groups",
    label: "Grupos Globais",
    icon: Group
  },
  {
    href: "/super-admin/ai-settings",
    label: "Configurações da IA",
    icon: Settings
  }
];
