'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User as UserIcon, Loader2, X, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, Timestamp
} from 'firebase/firestore';
import type { Message, PublicProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface FirebaseServices {
  db: any;
  auth: any;
}

interface ChatClientProps {
  adminUid: string;
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
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createSessionWithRetry = async (db: any, userId: string) => {
      const sessionId = `session_${adminUid}_${userId}`;
      const path = `chatSessions/${sessionId}`;
      const sessionRef = doc(db, path);

      try {
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
          console.log("Sessão já existente encontrada.");
          return path;
        }
      } catch (error: any) {
        console.warn(`Aviso ao verificar sessão existente (isto pode ser normal): ${error.code}`);
      }

      const sessionData = {
        id: sessionId, adminId: adminUid, visitorUid: userId, status: 'open', createdAt: Timestamp.now(), 
        lastMessage: 'Sessão iniciada.', lastMessageTimestamp: Timestamp.now(), unreadCount: 0,
      };

      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await setDoc(sessionRef, sessionData);
          console.log(`✅ Sessão criada com sucesso na tentativa ${attempt}`);
          return path;
        } catch (err: any) {
          if (err.code === 'permission-denied' && attempt < 5) {
            console.warn(`Tentativa ${attempt} falhou. Tentando novamente em ${300 * attempt}ms...`);
            await new Promise(res => setTimeout(res, 300 * attempt));
          } else {
            console.error("Erro crítico ao CRIAR sessão (setDoc):", err);
            throw err;
          }
        }
      }
      throw new Error("Não foi possível criar a sessão após várias tentativas.");
    };

    const initialize = async () => {
      try {
        console.log("=== INICIANDO CHAT ===");
        if (authLoading) {
          console.log("Aguardando auth...");
          return;
        }
        const services = getFirebaseInstances();
        setFirebase(services);
        const { db, auth } = services;

        if (authUser && authUser.id === adminUid) {
          console.log("✅ Modo preview ativado para admin.");
          setIsPreview(true);
          setInitializing(false);
          return;
        }

        let effectiveUser = auth.currentUser;
        if (!effectiveUser) {
          console.log("🔐 Nenhum usuário na sessão. Tentando login anônimo...");
          try {
            const userCredential = await signInAnonymously(auth);
            effectiveUser = userCredential.user;
            console.log("✅ Login anônimo OK. UID:", effectiveUser.uid);
            console.log("⏳ Aguardando propagação da autenticação (800ms)...");
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (authError: any) {
            console.error("❌ Erro no login anônimo:", authError);
            throw new Error(`Login anônimo falhou: ${authError.code}`);
          }
        } else {
          console.log(`✅ Usuário já existente na sessão. UID: ${effectiveUser.uid}`);
        }

        if (!effectiveUser) throw new Error("Falha crítica: Nenhum usuário válido após tentativas.");
        setCurrentUserId(effectiveUser.uid);
        console.log("👤 User ID definido no estado:", effectiveUser.uid);
        
        const profileDocRef = doc(db, 'public_profiles', adminUid);
        const profileDocSnap = await getDoc(profileDocRef);
        setAdminProfile(profileDocSnap.exists() ? profileDocSnap.data() as PublicProfile : { 
          displayName: 'Assistente', greeting: 'Como posso ajudar?', avatarUrl: '', ownerId: adminUid 
        });
        console.log("👤 Perfil do Admin carregado.");

        console.log("🚀 Tentando criar ou obter a sessão de chat...");
        const newSessionPath = await createSessionWithRetry(db, effectiveUser.uid);
        setSessionPath(newSessionPath);
        console.log("✅ Caminho da sessão definido:", newSessionPath);

      } catch (err: any) {
        console.error("💥 ERRO CRÍTICO NO FLUXO DE INICIALIZAÇÃO:", err);
        setError(`Falha: ${err.code || 'erro desconhecido'}. Por favor, recarregue a página.`);
      } finally {
        setInitializing(false);
      }
    };
    ensureFirebaseInitialized().then(() => initialize());
  }, [authUser, authLoading, adminUid]);


  useEffect(() => {
    if (!sessionPath || !firebase) return;
    const { db } = firebase;
    const messagesQuery = query(collection(db, `${sessionPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message)),
      (err) => {
        console.error("Erro ao escutar mensagens:", err);
        toast({ title: "Erro de Comunicação", variant: "destructive" });
      }
    );
    return () => unsubscribe();
  }, [sessionPath, firebase, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
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
            {adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.displayName} />}
            <AvatarFallback>{adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <Bot />}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-headline font-semibold">{adminProfile?.displayName || 'Assistente'}</h1>
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
                  {message.role === 'admin' && (adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <UserIcon />)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn("max-w-md rounded-xl px-4 py-3 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : (message.role === 'admin' ? "bg-amber-100 text-amber-900" : "bg-card"))}>
              {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">{adminProfile?.displayName || 'Agente'}</p>}
              {message.content}
            </div>
            {message.role === "user" && (<Avatar className="h-8 w-8"><AvatarFallback><UserIcon/></AvatarFallback></Avatar>)}
          </div>
        ))}
        </div>
      </ScrollArea>

      <footer className="border-t bg-card p-4"><form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder={"Faça uma pergunta..."} className="w-full resize-none rounded-xl pr-20" rows={1} disabled={isSending || !sessionPath}/>
        <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSending || !input.trim() || !sessionPath}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal />}</Button>
      </form></footer>
    </div>
  );
}
