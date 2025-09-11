'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, X, UserSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, getDocs
} from 'firebase/firestore';
import type { ChatMessage, Contact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LeadCaptureModal } from "@/components/chat/LeadCaptureModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PublicChatViewProps {
  adminUid: string;
}

type AdminProfile = {
  name: string;
  avatarUrl?: string;
  headline?: string;
};

export function PublicChatView({ adminUid }: PublicChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionPath, setSessionPath] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isAdminProfileLoading, setIsAdminProfileLoading] = useState(true);
  const [visitorUid, setVisitorUid] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Efeito para autenticação anônima e inicialização da sessão
  useEffect(() => {
    if (!adminUid) return;

    const initializeSession = async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        setVisitorUid(uid);

        // A chave da sessão é baseada no admin e no visitante para evitar duplicatas
        const sessionId = `session_${adminUid}_${uid}`;
        const path = `chatSessions/${sessionId}`;
        setSessionPath(path);

        const sessionRef = doc(db, path);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
          await setDoc(sessionRef, {
            adminId: adminUid,
            visitorUid: uid,
            status: 'active',
            lastMessage: 'Sessão iniciada.',
            lastMessageTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            unreadCount: 0
          });
        }
      } catch (error) {
        console.error("Erro na inicialização da sessão anônima:", error);
        toast({ title: "Erro de Conexão", description: "Não foi possível iniciar o chat.", variant: "destructive" });
      }
    };

    initializeSession();

  }, [adminUid, toast]);

  // Efeito para buscar o perfil do administrador
  useEffect(() => {
    if (!adminUid) return;

    const fetchAdminProfile = async () => {
      setIsAdminProfileLoading(true);
      try {
        const profileDocRef = doc(db, 'public_profiles', adminUid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          const profileData = profileDocSnap.data();
          setAdminProfile({
            name: profileData.name || 'Atendimento',
            avatarUrl: profileData.avatarUrl,
            headline: profileData.headline,
          });
        } else {
          console.warn(`Perfil público não encontrado para o admin: ${adminUid}.`);
          setAdminProfile({ name: 'Atendimento', headline: 'Pronto para ajudar' });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do admin:", error);
        setAdminProfile({ name: 'Atendimento', headline: 'Pronto para ajudar' });
      } finally {
        setIsAdminProfileLoading(false);
      }
    };

    fetchAdminProfile();
  }, [adminUid]);

  // Efeito para ouvir novas mensagens
  useEffect(() => {
    if (!sessionPath) return;
    const messagesQuery = query(collection(db, `${sessionPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      setMessages(msgs);
    }, (error) => {
      console.error("Erro ao ouvir mensagens:", error);
      toast({ title: "Erro de comunicação", description: "Não foi possível carregar as mensagens.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [sessionPath, toast]);

  // Efeito para rolagem automática
  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !sessionPath || !visitorUid) return;
    
    const content = input;
    setInput("");
    setIsSending(true);

    try {
      const batch = writeBatch(db);
      const sessionRef = doc(db, sessionPath);
      const messageRef = doc(collection(db, `${sessionPath}/messages`));

      batch.set(messageRef, {
        content: content,
        role: 'user',
        senderId: visitorUid, // O ID do visitante anônimo
        timestamp: serverTimestamp(),
      });

      batch.update(sessionRef, {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        unreadCount: increment(1)
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

  // Renderização do componente
  if (!adminUid || isAdminProfileLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b p-4 shadow-sm bg-card">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                    {adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />}
                    <AvatarFallback>
                        {adminProfile?.name ? adminProfile.name[0].toUpperCase() : <Bot className="h-5 w-5"/>}
                    </AvatarFallback>
                </Avatar>
              <div>
                  <h1 className="text-lg font-headline font-semibold">{adminProfile?.name || 'Assistente Virtual'}</h1>
                  <p className="text-sm text-muted-foreground">{adminProfile?.headline || "Pronto para ajudar"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} aria-label="Encerrar Chat">
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
        </header>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}><div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role !== "user" && (
                  <Avatar className="h-8 w-8">
                      {message.role === 'admin' && adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />}
                      <AvatarFallback>
                          {message.role === 'assistant' && <Bot className="h-5 w-5"/>}
                          {message.role === 'admin' && (adminProfile?.name ? adminProfile.name[0].toUpperCase() : <User className="h-5 w-5"/>)}
                      </AvatarFallback>
                  </Avatar>
              )}
              <div className={cn("max-w-md rounded-xl px-4 py-3 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : (message.role === 'admin' ? "bg-amber-100 text-amber-900" : "bg-card"))}>
                {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">{adminProfile?.name || 'Atendente'}</p>}
                {message.content}
              </div>
              {message.role === "user" && (<Avatar className="h-8 w-8"><AvatarFallback><User/></AvatarFallback></Avatar>)}
            </div>
          ))}
          {isAiTyping && (<div className="flex items-start gap-4 justify-start"><Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar><div className="max-w-md rounded-xl px-4 py-3 text-sm bg-card"><Loader2 className="h-4 w-4 animate-spin"/></div></div>)}
        </div>
        </ScrollArea>

        <footer className="border-t bg-card p-4"><form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder={"Faça uma pergunta..."} className="w-full resize-none rounded-xl pr-20" rows={1} disabled={isSending || !sessionPath}/>
          <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSending || !input.trim() || !sessionPath}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}</Button>
        </form></footer>
      </div>
    </>
  );
}
