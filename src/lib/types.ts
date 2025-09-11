import { Timestamp } from "firebase/firestore";

// ETAPA DE CORREÇÃO: Arquivo de Tipos Central
// A maioria dos erros de tipo se origina aqui. Corrigir este arquivo primeiro.

export type UserRole = 'superadmin' | 'admin';

/**
 * Representa um usuário autenticado na plataforma.
 * O ID do documento do Firestore é a fonte de verdade.
 * Renomeado para PlatformUser para evitar conflitos de nome.
 * Propriedade 'id' padronizada e campos ausentes adicionados.
 */
export interface PlatformUser {
  id: string; // Padronizado para 'id' em vez de 'uid' para consistência.
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  whatsapp: string;
  avatar?: string;
  createdAt: Date | Timestamp;
  fcmToken?: string;
  aiPrompt?: string; // Propriedade ausente adicionada
  useCustomInfo?: boolean; // Propriedade para controlar o uso de dados do cliente
  contactGroups?: string[]; // Propriedade ausente adicionada
}

// A interface User original é mantida para compatibilidade, mas estende a nova.
export interface User extends PlatformUser {}

/**
 * Modelo para um Contato (Lead).
 * Campo 'avatar' adicionado.
 */
export interface Contact {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  status: 'active' | 'inactive' | 'archived';
  interesses: string[];
  ownerName?: string;
  createdAt: Date | Timestamp;
  lastInteraction?: Date | Timestamp;
  canal?: string;
  group?: string;
  avatar?: string; // Propriedade ausente adicionada
}

/**
 * Representa uma mensagem dentro de uma conversa no chat.
 */
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any; // Idealmente, deveria ser Timestamp
  read: boolean;
}


/**
 * Tipo placeholder para resolver erro de importação.
 */
export interface ChatSession {
  id: string;
  // outras propriedades conforme necessário
}

/**
 * Tipo placeholder para resolver erro de importação.
 */
export interface ContactInteraction {
  id: string;
  // outras propriedades conforme necessário
}


// --- Outros tipos existentes (sem alterações) ---

export interface PublicProfile {
  displayName: string;
  avatarUrl: string;
  greeting: string;
  ownerId: string;
}

export interface Form {
  id: string;
  adminId: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  eventName: string;
  adminId: string;
  createdAt: Date;
}

export interface AdminSettings {
  id: string;
  aiName: string;
  aiInstruction: string;
  companyName: string;
  companyInfo: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  senderId?: string;
  timestamp?: any;
  text?: string;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
}

export interface ActiveChat {
  id: string;
  contact: ChatContact;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
  adminId: string;
}

export interface Conversation {
  id?: string;
  path?: string;
  name?: string;
  lastMessage: string;
  unreadCount?: number;
  lastMessageTimestamp?: any;
  adminId: string;
  contactId?: string;
  status: 'anonymous' | 'pending_identification' | 'active' | 'closed' | 'expired' | 'archived'; // Adicionado 'archived'
  createdAt: any;
  summary?: string; // Adicionado para histórico
  archivedAt?: any; // Adicionado para histórico
}
