
import { Timestamp } from "firebase/firestore";

// =================================================================================
// UNIFIED CORE TYPES - Post-Refactor v2.0
// This file is the single source of truth for all data models in the application.
// =================================================================================

export type UserRole = 'superadmin' | 'admin';

/**
 * Represents an authenticated user in the system (Super Admin or Admin).
 * The document ID in Firestore is the user's UID from Firebase Auth.
 */
export interface PlatformUser {
  id: string; // UID from Firebase Auth
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date | Timestamp;
  // Optional/Profile-related fields
  whatsapp?: string;
  avatar?: string;
  fcmToken?: string;
  // AI-specific settings
  aiPrompt?: string;
  useCustomInfo?: boolean;
  contactGroups?: string[];
}

/**
 * The "Public Badge" for an Admin.
 * Contains only safe, publicly-displayable information for the chat widget.
 */
export interface PublicProfile {
  displayName: string;
  avatarUrl: string;
  greeting: string;
  ownerId: string; // The UID of the admin this profile belongs to
}

/**
 * Represents an identified customer contact belonging to an Admin.
 */
export interface Contact {
  id: string;
  ownerId: string; // UID of the Admin who owns this contact
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'archived';
  // Optional fields
  phone?: string;
  whatsapp?: string;
  interesses?: string[];
  ownerName?: string;
  createdAt?: Date | Timestamp;
  lastInteraction?: Date | Timestamp;
  canal?: string;
  group?: string;
  avatar?: string;
}

// =================================================================================
// UNIFIED CHAT & CONVERSATION TYPES
// =================================================================================

/**
 * [UNIFIED] Represents a single message within any chat.
 * This is the single source of truth for message objects, replacing the old
 * 'ChatMessage' and 'Message' types.
 */
export interface Message {
  id: string;
  senderId: string; // UID of the visitor or admin who sent it
  role: 'user' | 'assistant' | 'admin'; // 'user' for visitor, 'admin' for admin/superadmin
  content: string; // The text content of the message
  timestamp: Timestamp;
  read: boolean;
}

/**
 * Represents a temporary, anonymous chat session in the "waiting room".
 * These are stored in the `chatSessions` collection.
 */
export interface ChatSession {
  id: string;
  adminId: string;    // The Admin (shop owner) being contacted
  visitorUid: string; // The anonymous UID of the visitor
  status: 'open' | 'closed';
  createdAt: Timestamp;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  // Optional info captured from the visitor
  visitorName?: string;
  visitorEmail?: string;
}

/**
 * Represents a permanent, identified conversation stored in the "main archive".
 * These are stored in the `conversations` collection after a lead is identified.
 */
export interface Conversation {
  id: string;
  adminId: string;  // The Admin who owns this conversation
  contactId: string; // The ID of the identified Contact
  status: 'active' | 'closed' | 'archived';
  createdAt: Timestamp;
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  unreadCount: number;
  
  // ERROR FIX: Denormalized contact info for efficient display
  contactName: string;
  contactAvatar?: string;

  // AI-generated summaries
  summary?: string;
  archivedAt?: Timestamp;
}

// =================================================================================
// Other types (Forms, Webhooks, etc.) - To be reviewed/refactored later
// =================================================================================

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
