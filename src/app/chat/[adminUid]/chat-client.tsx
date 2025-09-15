'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, Loader2, X, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, Timestamp
} from 'firebase/firestore';
import type { Message, PublicProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const VISITOR_ID_KEY = 'plataforma_visitor_id';

interface FirebaseServices {
  db: any;
  auth: any;
}

interface ChatClientProps {
  adminUid: string;
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.096l-.327 1.201 1.23 1.203zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function ChatClient({ adminUid }: ChatClientProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  const [sessionPath, setSessionPath] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [initializing, setInitializing] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createSessionWithRetry = async (db: any, userId: string, anonymousVisitorId: string | null) => {
      const sessionId = `session_${adminUid}_${userId}`;
      const path = `chatSessions/${sessionId}`;
      const sessionRef = doc(db, path);

      try {
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
          return path;
        }
      } catch (error: any) {
        console.warn(`Aviso ao verificar sessão existente (isto pode ser normal): ${error.code}`);
      }

      const sessionData: any = {
        id: sessionId, 
        adminId: adminUid, 
        visitorUid: userId, 
        status: 'open', 
        createdAt: Timestamp.now(), 
        lastMessage: 'Sessão iniciada.', 
        lastMessageTimestamp: Timestamp.now(), 
        unreadCount: 0,
        originDomain: typeof window !== "undefined" ? window.location.origin : '' // **NOVA LINHA**
      };

      if (anonymousVisitorId) {
        sessionData.anonymousVisitorId = anonymousVisitorId;
      }

      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await setDoc(sessionRef, sessionData);
          return path;
        } catch (err: any) {
          if (err.code === 'permission-denied' && attempt < 5) {
            await new Promise(res => setTimeout(res, 300 * attempt));
          } else {
            throw err;
          }
        }
      }
      throw new Error("Não foi possível criar a sessão após várias tentativas.");
    };

    const initialize = async () => {
      try {
        if (authLoading) return;
        const services = getFirebaseInstances();
        setFirebase(services);
        const { db, auth } = services;

        if (authUser && authUser.id === adminUid) {
          setIsPreview(true);
          setInitializing(false);
          return;
        }

        const profileDocRef = doc(db, 'public_profiles', adminUid);
        const profileDocSnap = await getDoc(profileDocRef);

        if (!profileDocSnap.exists()) {
          throw new Error("ADMIN_PROFILE_NOT_FOUND");
        }
        setAdminProfile(profileDocSnap.data() as PublicProfile);

        let effectiveUser = auth.currentUser;
        if (!effectiveUser) {
          const userCredential = await signInAnonymously(auth);
          effectiveUser = userCredential.user;
          localStorage.setItem(VISITOR_ID_KEY, effectiveUser.uid);
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (!effectiveUser) throw new Error("Falha crítica: Nenhum usuário válido após tentativas.");
        setCurrentUserId(effectiveUser.uid);
        
        const anonymousVisitorId = localStorage.getItem(VISITOR_ID_KEY);
        
        const newSessionPath = await createSessionWithRetry(db, effectiveUser.uid, anonymousVisitorId);
        setSessionPath(newSessionPath);

      } catch (err: any) {
        if (err.message === "ADMIN_PROFILE_NOT_FOUND") {
          setError("Este link de chat é inválido ou o administrador ainda não configurou o seu perfil.");
        } else {
          setError(`Ocorreu uma falha ao iniciar o chat. Por favor, recarregue a página.`);
        }
      } finally {
        setInitializing(false);
      }
    };
    ensureFirebaseInitialized().then(() => initialize());
  }, [authUser, authLoading, adminUid, router]);

  useEffect(() => {
    if (!sessionPath || !firebase) return;
    const { db } = firebase;
    const messagesQuery = query(collection(db, `${sessionPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
        setMessages(fetchedMessages);
      },
      (err) => {
        console.error("Erro ao escutar mensagens:", err);
        toast({ title: "Erro de Comunicação", variant: "destructive" });
      }
    );
    return () => unsubscribe();
  }, [sessionPath, firebase, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !sessionPath || !currentUserId || !firebase) return;
    const { db } = firebase;
    const content = input;
    setInput("");
    setIsSending(true);
    try {
      const batch = writeBatch(db);
      const sessionRef = doc(db, sessionPath);
      const messageRef = doc(collection(db, `${sessionPath}/messages`));
      batch.set(messageRef, { senderId: currentUserId, role: 'user', content, read: false, timestamp: serverTimestamp() });
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

  if (initializing) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3">A conectar ao chat...</p></div>;
  }

  if (isPreview) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <Info className="h-10 w-10 text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Modo de Pré-Visualização</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Esta é a página que os seus clientes verão. Para testar, aceda a este link numa janela anónima ou após fazer logout.</p>
        <Button onClick={() => router.push('/')}><X className="mr-2 h-4 w-4"/> Fechar</Button>
      </div>
    );
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
            <AvatarImage src={adminProfile?.avatarUrl} alt={adminProfile?.displayName || 'Admin'} />
            <AvatarFallback>{adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <Bot />}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-headline font-semibold">{adminProfile?.displayName || 'Assistente'}</h1>
            <p className="text-sm text-muted-foreground">{adminProfile?.greeting || "Pronto para ajudar"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <WhatsAppIcon className="h-4 w-4 mr-2 fill-current" />
            Voltar ao WhatsApp
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} aria-label="Fechar Chat">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex items-end gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
              
              {message.role !== "user" && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={message.role === 'admin' ? adminProfile?.avatarUrl : undefined} alt={adminProfile?.displayName || 'Admin'} />
                  <AvatarFallback>
                    {message.role === 'admin' && (adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : 'A')}
                    {message.role === 'assistant' && <Bot className="h-5 w-5"/>}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn(
                "max-w-md rounded-xl px-4 py-3 text-sm prose dark:prose-invert break-words",
                message.role === "user" && "bg-primary text-primary-foreground",
                message.role === "admin" && "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50",
                message.role === "assistant" && "bg-card border"
              )}>
                {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 dark:text-amber-400 pb-1">{adminProfile?.displayName || 'Agente'}</p>}
                <ReactMarkdown components={{ p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} /> }}>
                  {message.content}
                </ReactMarkdown>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/whatsapp.png" alt="Visitante" />
                    <AvatarFallback>V</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder={"Faça uma pergunta..."}
            className="w-full resize-none rounded-xl pr-20"
            rows={1}
            disabled={isSending || !sessionPath}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            disabled={isSending || !input.trim() || !sessionPath}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
