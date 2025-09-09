
import { Timestamp } from "firebase/firestore";

/**
 * Modelo Canônico para um Contato (Lead) na plataforma.
 * Representa a fonte de verdade para os dados de um contato.
 */
export interface Contact {
  id: string; // ID do documento no Firestore
  ownerId: string; // UID do admin a quem este contato pertence
  name: string;
  email: string;
  phone?: string; // Número de telefone principal
  whatsapp?: string; // Número de WhatsApp, pode ser diferente do phone
  status: 'active' | 'inactive' | 'archived'; // Status do lead
  interesses: string[]; // Lista de interesses ou tags
  ownerName?: string; // Nome do admin (denormalizado para eficiência)
  createdAt: Date | Timestamp; // Data de criação do contato
  lastInteraction?: Date | Timestamp; // Data da última interação significativa
  canal?: string; // Canal de origem (ex: 'site', 'whatsapp', 'manual')
  group?: string; // Grupo ou campanha ao qual o contato pertence
}

/**
 * Representa a informação de um formulário de captura de leads.
 */
export interface Form {
  id: string;
  adminId: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
}

/**
 * Define um campo individual dentro de um formulário.
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}

/**
 * Define a estrutura para um Webhook.
 */
export interface Webhook {
  id: string;
  url: string;
  eventName: string; // Ex: 'contact_created', 'message_received'
  adminId: string;
  createdAt: Date;
}

/**
 * Representa as configurações de um administrador.
 */
export interface AdminSettings {
  id: string; // Geralmente o mesmo que o adminId
  aiName: string;
  aiInstruction: string;
  companyName: string;
  companyInfo: string;
}

/**
 * Representa uma mensagem individual dentro de um chat ativo.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  senderId?: string;
  timestamp?: any; // Usado para ordenação no Firestore
  text?: string; // Adicionado para compatibilidade
}

/**
 * Representa a informação de um contato dentro de um chat ativo.
 */
export interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
}

/**
 * Representa um chat atualmente ativo na plataforma.
 */
export interface ActiveChat {
  id: string;
  contact: ChatContact;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
  adminId: string;
}

/**
 * Representa um item na lista de conversas do componente de chat.
 * ESTA É A INTERFACE PRINCIPAL DO DOCUMENTO DE CONVERSA.
 */
export interface Conversation {
  id?: string; // O ID é o do documento, pode não estar no corpo dos dados
  path?: string; // O path é contextual, não é um campo do DB
  name?: string; // O nome do contato, pode ser denormalizado
  lastMessage: string;
  unreadCount?: number;
  lastMessageTimestamp?: any;
  adminId: string;
  contactId?: string; // ID do contato após identificação
  // Status da conversa, crucial para o fluxo da IA
  status: 'anonymous' | 'pending_identification' | 'active' | 'closed' | 'expired';
  createdAt: any;
}
