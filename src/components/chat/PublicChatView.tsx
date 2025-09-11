'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, X, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, Timestamp
} from 'firebase/firestore';
import type { Message, PublicProfile, ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PublicChatViewProps {
  adminUid: string;
}

export function PublicChatView({ adminUid }: PublicChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sessionPath, setSessionPath] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const [visitorUid, setVisitorUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!adminUid) {
      setError("ID do administrador não fornecido. O link pode estar quebrado.");
      setIsLoading(false);
      return;
    }

    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Etapa 1: Carregar o perfil do administrador
        const profileDocRef = doc(db, 'public_profiles', adminUid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          setAdminProfile(profileDocSnap.data() as PublicProfile);
        } else {
          console.warn(`Perfil público não encontrado para o admin: ${adminUid}. Usando um padrão.`);
          setAdminProfile({ displayName: 'Assistente', greeting: 'Como posso ajudar?', avatarUrl: '', ownerId: adminUid });
        }

        // Etapa 2: Autenticar o visitante anonimamente
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        setVisitorUid(uid);

        // Etapa 3: Inicializar a sessão de chat no Firestore
        const sessionId = `session_${adminUid}_${uid}`;
        const path = `chatSessions/${sessionId}`;
        const sessionRef = doc(db, path);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
          const newSession: ChatSession = {
            id: sessionId,
            adminId: adminUid,
            visitorUid: uid,
            status: 'open',
            createdAt: Timestamp.now(),
            lastMessage: 'Sessão iniciada.',
            lastMessageTimestamp: Timestamp.now(),
          };
          await setDoc(sessionRef, newSession);
        }
        
        // Etapa 4: Definir o caminho da sessão para ativar os outros efeitos
        setSessionPath(path);

      } catch (err) {
        console.error("Erro ao inicializar o chat:", err);
        setError("Não foi possível iniciar o chat. Verifique sua conexão e tente recarregar a página.");
        toast({ title: "Erro de Conexão", description: "Não foi possível estabelecer uma conexão segura com o chat.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

  }, [adminUid, toast]);

  // Efeito para escutar novas mensagens (permanece o mesmo)
  useEffect(() => {
    if (!sessionPath) return;
    const messagesQuery = query(collection(db, `${sessionPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
      setMessages(msgs);
    }, (err) => {
      console.error("Erro ao escutar mensagens:", err);
      toast({ title: "Erro de Comunicação", description: "Não foi possível carregar novas mensagens.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [sessionPath, toast]);

  // Efeito para auto-scroll (permanece o mesmo)
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
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

      const newMessage: Omit<Message, 'id' | 'timestamp'> = {
        senderId: visitorUid,
        role: 'user',
        content: content,
        read: false,
      };

      batch.set(messageRef, { ...newMessage, timestamp: serverTimestamp() });
      batch.update(sessionRef, { lastMessage: content, lastMessageTimestamp: serverTimestamp(), unreadCount: increment(1) });
      await batch.commit();

    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast({ title: "Erro", description: "Sua mensagem não pôde ser enviada.", variant: "destructive" });
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3">Carregando chat...</p></div>;
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ocorreu um Erro</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4 shadow-sm bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            {adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.displayName} />}
            <AvatarFallback>{adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <Bot className="h-5 w-5"/>}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-headline font-semibold">{adminProfile?.displayName || 'Assistente Virtual'}</h1>
            <p className="text-sm text-muted-foreground">{adminProfile?.greeting || "Pronto para ajudar"}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} aria-label="Fechar Chat">
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}><div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role !== "user" && (
              <Avatar className="h-8 w-8">
                {message.role === 'admin' && adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.displayName} />}
                <AvatarFallback>
                  {message.role === 'assistant' && <Bot className="h-5 w-5"/>}
                  {message.role === 'admin' && (adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <User className="h-5 w-5"/>)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn("max-w-md rounded-xl px-4 py-3 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : (message.role === 'admin' ? "bg-amber-100 text-amber-900" : "bg-card"))}>
              {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">{adminProfile?.displayName || 'Agente'}</p>}
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
  );
}
