'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, X, PartyPopper, UserSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, getDocs, deleteDoc
} from 'firebase/firestore';
import type { ChatMessage, Contact, Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LeadCaptureModal } from "@/components/chat/LeadCaptureModal";

const getAnonymousId = (adminUid: string) => {
  const key = `anonymous_id_${adminUid}`;
  let anonId = localStorage.getItem(key);
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, anonId);
  }
  return anonId;
}

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
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [adminName, setAdminName] = useState('Atendimento');
  const [isIdentified, setIsIdentified] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  useEffect(() => {
    if (!adminUid) return;

    const contactId = localStorage.getItem(`contact_id_${adminUid}`);

    const setupConversation = async () => {
      if (contactId) {
        const contactDoc = await getDoc(doc(db, 'contacts', contactId));
        if (contactDoc.exists()) {
          const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
          setVisitor(contactData);
          setIsIdentified(true);
          setConversationPath(`conversations/${contactId}`);
        } else {
          localStorage.removeItem(`contact_id_${adminUid}`);
          await createAnonymousConversation();
        }
      } else {
        await createAnonymousConversation();
      }
    };
    
    const createAnonymousConversation = async () => {
      if (!adminUid) return;
      const anonId = getAnonymousId(adminUid);
      const path = `conversations/anonymous_${anonId}`;
      setConversationPath(path);
      
      const convoRef = doc(db, path);
      const convoSnap = await getDoc(convoRef);
      if (!convoSnap.exists()) {
        try {
          await setDoc(convoRef, {
            adminId: adminUid,
            status: 'anonymous',
            lastMessage: 'Sessão anônima iniciada.',
            lastMessageTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Erro ao criar conversa anônima: ", error);
          toast({ title: "Erro de Conexão", description: "Não foi possível iniciar o chat.", variant: "destructive" });
        }
      }
    };

    setupConversation();

  }, [adminUid, toast]);

  // Efeito para OUVIR O DOCUMENTO DA CONVERSA (para gatilhos da IA)
  useEffect(() => {
    if (!conversationPath) return;

    const unsubscribe = onSnapshot(doc(db, conversationPath), (doc) => {
        const conversationData = doc.data() as Conversation;
        if (conversationData && conversationData.status === 'pending_identification') {
            if (!isIdentified) { // Só abre o modal se o usuário ainda não se identificou
                setIsModalOpen(true);
            }
        }
    });

    return () => unsubscribe();
  }, [conversationPath, isIdentified]);


  useEffect(() => {
    if (!conversationPath) return;

    const messagesQuery = query(collection(db, `${conversationPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      setMessages(msgs);
    }, (error) => {
      console.error("Erro ao ouvir mensagens: ", error);
      toast({ title: "Erro de comunicação", description: "Não foi possível carregar as mensagens.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [conversationPath, toast]);

  useEffect(() => {
    if (isChatFinished) {
      const timer = setTimeout(() => router.push('/'), 5000);
      return () => clearTimeout(timer);
    }
  }, [isChatFinished, router]);

  const handleLeadCaptureSuccess = async (newContact: Contact) => {
    if (!adminUid || !conversationPath || !conversationPath.startsWith('conversations/anonymous_')) {
        toast({ title: 'Erro de Migração', description: 'Não foi possível encontrar a conversa anônima para migrar.', variant: 'destructive' });
        return;
    }

    const anonymousConvoPath = conversationPath;
    const newConvoPath = `conversations/${newContact.id}`;

    try {
      const batch = writeBatch(db);
      const messagesQuery = query(collection(db, `${anonymousConvoPath}/messages`));
      const messagesSnapshot = await getDocs(messagesQuery);
      const oldMessages = messagesSnapshot.docs;
      
      let lastMessage = 'Conversa iniciada.';
      let lastMessageTimestamp = serverTimestamp();

      oldMessages.forEach(msgDoc => {
        const newMessageRef = doc(collection(db, `${newConvoPath}/messages`));
        const messageData = msgDoc.data();
        
        if (messageData.role === 'user') {
            messageData.senderId = newContact.id;
        }

        batch.set(newMessageRef, messageData);
        lastMessage = messageData.content;
        lastMessageTimestamp = messageData.timestamp;
      });
      
      const newConvoRef = doc(db, newConvoPath);
      batch.set(newConvoRef, {
        adminId: adminUid,
        contactId: newContact.id,
        name: newContact.name,
        status: 'active',
        lastMessage: lastMessage,
        lastMessageTimestamp: lastMessageTimestamp,
        createdAt: serverTimestamp(),
        unreadCount: 1,
      });

      oldMessages.forEach(msgDoc => {
        batch.delete(msgDoc.ref);
      });
      const oldConvoRef = doc(db, anonymousConvoPath);
      batch.delete(oldConvoRef);
      
      await batch.commit();

      localStorage.setItem(`contact_id_${adminUid}`, newContact.id);
      localStorage.removeItem(`anonymous_id_${adminUid}`);
      
      setVisitor(newContact);
      setIsIdentified(true);
      setIsModalOpen(false);
      setConversationPath(newConvoPath);
      
      toast({ title: 'Identificado com sucesso!', description: 'Você agora está conectado com nosso time.' });

    } catch (error) {
      console.error("Erro ao migrar conversa:", error);
      toast({ title: 'Erro Crítico', description: 'Ocorreu uma falha ao transferir seu histórico. Por favor, recarregue a página.', variant: 'destructive' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !conversationPath) return;

    const content = input;
    setInput("");
    setIsSending(true);

    try {
      const batch = writeBatch(db);
      const conversationRef = doc(db, conversationPath);
      const messageRef = doc(collection(db, `${conversationPath}/messages`));

      batch.set(messageRef, {
        content: content,
        role: 'user',
        senderId: isIdentified ? visitor?.id : conversationPath.split('_')[1],
        timestamp: serverTimestamp(),
      });

      batch.update(conversationRef, {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        ...(isIdentified && { unreadCount: increment(1) })
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

  if (isChatFinished) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center p-8">
        <PartyPopper className="h-16 w-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Obrigado pelo seu contato, {visitor?.name || 'visitante'}!</h1>
        <p className="text-lg text-muted-foreground">A equipe da Omniflow agradece.</p>
        <p className="text-sm text-muted-foreground mt-8">Você será redirecionado em alguns instantes...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <LeadCaptureModal open={isModalOpen} onOpenChange={setIsModalOpen} adminUid={adminUid} onSuccess={handleLeadCaptureSuccess} />
      
      <header className="flex items-center justify-between border-b p-4 shadow-sm bg-card">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-headline font-semibold">Assistente Omniflow</h1>
            <p className="text-sm text-muted-foreground">{isIdentified ? `Atendimento com ${adminName}` : "Converse com nossa IA"}</p>
          </div>
        </div>
        <div>
          {!isIdentified && (
            <Button onClick={() => setIsModalOpen(true)}>
              <UserSquare className="mr-2 h-4 w-4"/> Falar com Atendente
            </Button>
          )}
          {isIdentified && (
            <Button variant="ghost" size="icon" onClick={() => setIsChatFinished(true)} aria-label="Encerrar atendimento">
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}><div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <div key={index} className={cn("flex items-start gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role !== "user" && (<Avatar className="h-8 w-8"><AvatarFallback>{message.role === 'assistant' ? <Bot className="h-5 w-5"/> : <User className="h-5 w-5"/>}</AvatarFallback></Avatar>)}
            <div className={cn("max-w-md rounded-xl px-4 py-3 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : (message.role === 'admin' ? "bg-amber-100 text-amber-900" : "bg-card"))}>
              {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">{adminName}</p>}
              {message.content}
            </div>
            {message.role === "user" && (<Avatar className="h-8 w-8"><AvatarFallback>{isIdentified ? visitor?.name[0].toUpperCase() : 'A'}</AvatarFallback></Avatar>)}
          </div>
        ))}
        {isAiTyping && (<div className="flex items-start gap-4 justify-start"><Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar><div className="max-w-md rounded-xl px-4 py-3 text-sm bg-card"><Loader2 className="h-4 w-4 animate-spin"/></div></div>)}
      </div>
</ScrollArea>

      <footer className="border-t bg-card p-4"><form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder={"Faça uma pergunta..."} className="w-full resize-none rounded-xl pr-20" rows={1} disabled={isSending || !conversationPath}/>
        <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSending || !input.trim() || !conversationPath}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}</Button>
      </form></footer>
    </div>
  );
}
