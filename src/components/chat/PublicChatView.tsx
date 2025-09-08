'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import {
  collection, query, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment
} from 'firebase/firestore';
import type { ChatMessage, Contact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LeadCaptureModal } from "@/components/chat/LeadCaptureModal";

interface PublicChatViewProps {
  adminUid: string | null;
}

export function PublicChatView({ adminUid }: PublicChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitor, setVisitor] = useState<Contact | null>(null);
  const [conversationPath, setConversationPath] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  const initializeConversation = useCallback(async (contact: Contact) => {
    if (!adminUid) return;

    const convoPath = `users/${adminUid}/conversations/${contact.id}`;
    const convoRef = doc(db, convoPath);
    setConversationPath(convoPath);

    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) {
      try {
        await setDoc(convoRef, {
          id: contact.id,
          name: contact.name,
          path: convoRef.path,
          lastMessage: `Sessão iniciada por ${contact.name}`,
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: 1, // Inicia com 1 para notificar o admin
        });
      } catch (error) {
        console.error("Erro ao criar a conversa: ", error);
        toast({ title: "Erro Crítico", description: "Não foi possível iniciar a conversa.", variant: "destructive" });
      }
    }
  }, [adminUid, toast]);

  useEffect(() => {
    if (adminUid) {
      const contactId = localStorage.getItem(`contact_id_${adminUid}`);
      if (contactId) {
        const fetchContact = async () => {
          const contactDoc = await getDoc(doc(db, 'contacts', contactId));
          if (contactDoc.exists()) {
            const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
            setVisitor(contactData);
            setIsModalOpen(false);
            initializeConversation(contactData);
          } else {
            localStorage.removeItem(`contact_id_${adminUid}`);
            setIsModalOpen(true);
          }
        };
        fetchContact();
      } else {
        setIsModalOpen(true);
      }
    }
  }, [adminUid, initializeConversation]);

  useEffect(() => {
    if (!conversationPath) return;

    const messagesQuery = query(collection(db, `${conversationPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationPath]);

  const handleLeadCaptureSuccess = (newContact: Contact) => {
    if (adminUid) {
      localStorage.setItem(`contact_id_${adminUid}`, newContact.id);
      setVisitor(newContact);
      setIsModalOpen(false);
      initializeConversation(newContact);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !conversationPath || !visitor) return;

    const content = input;
    setInput("");
    setIsSending(true);

    try {
      const batch = writeBatch(db);
      const conversationRef = doc(db, conversationPath);
      const messageRef = doc(collection(db, `${conversationPath}/messages`));

      batch.set(messageRef, {
        content: content,
        role: 'user', // Papel do remetente
        senderId: visitor.id,
        timestamp: serverTimestamp(),
      });

      batch.update(conversationRef, {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        unreadCount: increment(1),
      });

      await batch.commit();

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({ title: "Erro", description: "Sua mensagem não pôde ser enviada.", variant: "destructive" });
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  if (!adminUid) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <LeadCaptureModal open={isModalOpen} adminUid={adminUid} onSuccess={handleLeadCaptureSuccess} />
      <header className="flex items-center justify-between border-b p-4 shadow-sm bg-card"><div className="flex items-center gap-3"><Bot className="h-6 w-6 text-primary" /><div><h1 className="text-lg font-headline font-semibold">Assistente de IA</h1><p className="text-sm text-muted-foreground">{visitor ? `Conversando como: ${visitor.name}` : "Identifique-se para começar"}</p></div></div></header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}><div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <div key={index} className={cn("flex items-start gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role !== "user" && (<Avatar className="h-8 w-8"><AvatarFallback>{message.role === 'assistant' ? <Bot className="h-5 w-5"/> : <User className="h-5 w-5"/>}</AvatarFallback></Avatar>)}
            <div className={cn("max-w-md rounded-xl px-4 py-3 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : (message.role === 'admin' ? "bg-amber-100 text-amber-900" : "bg-card"))}>
              {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">[Atendente]</p>}
              {message.content}
            </div>
            {message.role === "user" && (<Avatar className="h-8 w-8"><AvatarFallback>{visitor ? visitor.name[0].toUpperCase() : 'V'}</AvatarFallback></Avatar>)}
          </div>
        ))}
        {isAiTyping && (<div className="flex items-start gap-4 justify-start"><Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar><div className="max-w-md rounded-xl px-4 py-3 text-sm bg-card"><Loader2 className="h-4 w-4 animate-spin"/></div></div>)}
      </div></ScrollArea>
      <footer className="border-t bg-card p-4"><form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder={isModalOpen ? "Por favor, preencha seus dados para começar." : "Faça uma pergunta..."} className="w-full resize-none rounded-xl pr-20" rows={1} disabled={isSending || isModalOpen || !visitor}/>
        <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSending || !input.trim() || isModalOpen || !visitor}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}</Button>
      </form></footer>
    </div>
  );
}
