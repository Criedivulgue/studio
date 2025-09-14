'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Firestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, deleteDoc, writeBatch, where, Timestamp } from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreVertical, Sparkles, Trash2, Loader2, MessageSquare, Archive, UserPlus, Users, ArrowLeft, ZapOff, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Conversation, PlatformUser, Message, ChatSession } from '@/lib/types';
import { LeadIdentificationModal } from '@/components/chat/LeadIdentificationModal';

export type ActiveChat = (Conversation & { type: 'CONVERSATION' }) | (ChatSession & { type: 'SESSION' });

export function Chat({ user }: { user: PlatformUser }) {
  const [db, setDb] = useState<Firestore | null>(null);
  const [functions, setFunctions] = useState<Functions | null>(null);

  const [identifiedChats, setIdentifiedChats] = useState<Conversation[]>([]);
  const [anonymousChats, setAnonymousChats] = useState<ChatSession[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isIdentifyModalOpen, setIdentifyModalOpen] = useState(false);

  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const adminId = user.id;

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb, functions: firebaseFunctions } = getFirebaseInstances();
        setDb(firestoreDb);
        setFunctions(firebaseFunctions);
      } catch (error) {
        console.error("Firebase init error in Chat:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'O chat não pôde ser carregado. Recarregue a página.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  // CORREÇÃO: Removido selectedChat das dependências para evitar re-subscriptions desnecessárias.
  useEffect(() => {
    if (!adminId || !db) {
      if (db) setLoading(false);
      return;
    }
    setLoading(true);

    const sessionsQuery = query(collection(db, "chatSessions"), where("adminId", "==", adminId), orderBy('createdAt', 'desc'));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setAnonymousChats(sessions);
      // CORREÇÃO: Se um chat de sessão estiver selecionado, atualiza seus dados.
      if (selectedChat?.type === 'SESSION') {
        const updatedChat = sessions.find(s => s.id === selectedChat.id);
        if (updatedChat) {
          setSelectedChat({ ...updatedChat, type: 'SESSION' });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to chat sessions:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os chats anônimos.'});
    });

    const convosQuery = query(collection(db, "conversations"), where("adminId", "==", adminId), orderBy('lastMessageTimestamp', 'desc'));
    const unsubscribeConvos = onSnapshot(convosQuery, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setIdentifiedChats(convos.filter(c => c.status !== 'archived'));
      // CORREÇÃO: Se um chat de conversação estiver selecionado, atualiza seus dados.
      if (selectedChat?.type === 'CONVERSATION') {
        const updatedChat = convos.find(c => c.id === selectedChat.id);
        if (updatedChat) {
            setSelectedChat({ ...updatedChat, type: 'CONVERSATION' });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to conversations:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as conversas.'});
    });

    return () => {
      unsubscribeSessions();
      unsubscribeConvos();
    };
  }, [adminId, db, toast]); // selectedChat removido daqui


  useEffect(() => {
    if (!selectedChat || !db) {
      setMessages([]);
      return;
    }

    const collectionName = selectedChat.type === 'CONVERSATION' ? 'conversations' : 'chatSessions';
    const messagesPath = `${collectionName}/${selectedChat.id}/messages`;

    const q = query(collection(db, messagesPath), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);

      const batch = writeBatch(db);
      snapshot.docs.forEach((msgDoc) => {
        const data = msgDoc.data() as Message;
        if (data.role === 'user' && !data.read) {
          batch.update(msgDoc.ref, { read: true });
        }
      });
      batch.commit().catch(err => console.error("Failed to update read status", err));
    });

    return () => unsubscribe();
  }, [selectedChat, db]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const allChats = useMemo(() => {
    const combined: ActiveChat[] = [
      ...anonymousChats.map(c => ({ ...c, type: 'SESSION' as const })),
      ...identifiedChats.map(c => ({ ...c, type: 'CONVERSATION' as const }))
    ];
    return combined.sort((a, b) => {
      const timeA = a.lastMessageTimestamp?.toMillis() || a.createdAt?.toMillis() || 0;
      const timeB = b.lastMessageTimestamp?.toMillis() || b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });
  }, [anonymousChats, identifiedChats]);

  const filteredChats = allChats.filter(c => {
    const name = c.type === 'CONVERSATION' ? c.contactName : (c.visitorName || 'Visitante Anônimo');
    const lastMessage = c.lastMessage || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedChat || !db) return;

    const collectionName = selectedChat.type === 'CONVERSATION' ? 'conversations' : 'chatSessions';
    const chatPath = `${collectionName}/${selectedChat.id}`;
    const messagesPath = `${chatPath}/messages`;
    
    const tempMessage = newMessage; 
    setNewMessage('');
    try {
        const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
            content: tempMessage, senderId: adminId, role: 'admin', read: true
        };
        await addDoc(collection(db, messagesPath), { ...messagePayload, timestamp: serverTimestamp() });
        await updateDoc(doc(db, chatPath), { lastMessage: tempMessage, lastMessageTimestamp: serverTimestamp() });
    } catch(err) {
        console.error("Failed to send message", err);
        setNewMessage(tempMessage);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a mensagem.' })
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedChat || selectedChat.type !== 'CONVERSATION' || !db) return;
    setIsProcessing(true);
    try {
      const messagesSnap = await getDocs(collection(db, 'conversations', selectedChat.id, 'messages'));
      const batch = writeBatch(db);
      messagesSnap.forEach(docRef => batch.delete(docRef.ref));
      batch.delete(doc(db, 'conversations', selectedChat.id));
      await batch.commit();
      setSelectedChat(null);
    } catch(error) {
      console.error("Error deleting conversation:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao deletar a conversa.' })
    } finally {
      setShowDeleteDialog(false);
      setIsProcessing(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedChat || selectedChat.type !== 'CONVERSATION' || !functions) return;
    setIsProcessing(true);
    try {
      const archiveAndSummarizeConversation = httpsCallable(functions, 'archiveAndSummarizeConversation');
      await archiveAndSummarizeConversation({ conversationId: selectedChat.id, contactId: selectedChat.contactId });
      toast({ title: 'Sucesso', description: 'Conversa arquivada e resumida.' });
      setSelectedChat(null);
    } catch (error) {
      console.error(`Error during archive:`, error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao arquivar a conversa.' })
    } finally {
      setIsProcessing(false);
    }
  }
  
  const handleToggleAI = async () => {
    if (!selectedChat || !functions) return;
    setIsProcessing(true);
    try {
        const toggleAIChat = httpsCallable(functions, 'toggleAIChat');
        const result = await toggleAIChat({ sessionId: selectedChat.id, enabled: !isAIEnabled });
        toast({ title: 'Sucesso', description: (result.data as any).message });
    } catch (error) {
        console.error("Error toggling AI:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível alterar o estado da IA.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleIdentifyModalOpen = () => {
      if (selectedChat?.type === 'SESSION') setIdentifyModalOpen(true);
  }
  
  const isLoading = loading || !db || !functions;
  // A lógica do isAIEnabled depende do selectedChat ser atualizado corretamente.
  const isAIEnabled = selectedChat?.aiEnabled !== false;

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] border rounded-lg bg-card text-card-foreground overflow-hidden">
        
        <aside className={cn(
          "h-full flex flex-col border-r",
          selectedChat ? "hidden md:flex md:w-1/3 lg:w-1/4" : "w-full md:flex md:w-1/3 lg:w-1/4"
        )}>
          <div className="p-4 border-b"><Input placeholder="Buscar chats..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading} /></div>
          <ScrollArea className="flex-1">
            {isLoading ? <div className="p-4 text-center text-muted-foreground flex items-center justify-center h-full"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Carregando...</div> :
              filteredChats.length > 0 ? filteredChats.map(c => (
                <Button key={c.id} variant="ghost" className={cn("w-full justify-start h-auto p-4 rounded-none", selectedChat?.id === c.id && "bg-muted")} onClick={() => setSelectedChat(c)}>
                  <div className="flex items-center gap-4 w-full truncate">
                    <Avatar className={cn("h-10 w-10", c.type === 'SESSION' && 'border-2 border-dashed border-primary')}><AvatarFallback>{c.type === 'SESSION' ? <Users className='h-5 w-5'/> : (c.contactName || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="w-full truncate text-left">
                      <p className="font-semibold truncate">{c.type === 'CONVERSATION' ? c.contactName : (c.visitorName || 'Visitante Anônimo')}</p>
                      <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                  </div>
                </Button>
              )) : <p className="p-4 text-center text-muted-foreground">Nenhum chat ativo encontrado.</p>}
          </ScrollArea>
        </aside>

        <main className={cn(
          "h-full flex-1 flex-col",
          selectedChat ? "flex" : "hidden md:flex"
        )}>
          {selectedChat ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 truncate">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChat(null)}>
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar><AvatarFallback>{selectedChat.type === 'SESSION' ? <Users className='h-5 w-5'/> : (selectedChat.contactName || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <h3 className="text-lg font-semibold truncate">{selectedChat.type === 'CONVERSATION' ? selectedChat.contactName : (selectedChat.visitorName || 'Visitante Anônimo')}</h3>
                </div>
                <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" disabled={isProcessing}><MoreVertical/></Button></PopoverTrigger>
                  <PopoverContent className="w-56"><div className="grid gap-1">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleToggleAI} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isAIEnabled ? <ZapOff className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />)}
                      {isAIEnabled ? 'Desativar IA' : 'Ativar IA'}
                    </Button>
                    <Separator className="my-1" />
                    {selectedChat.type === 'CONVERSATION' ? (
                      <>
                        <Button variant="ghost" className="w-full justify-start" onClick={handleArchiveConversation} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}Arquivar</Button>
                        <Separator className="my-1" />
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)} disabled={isProcessing}><Trash2 className="mr-2 h-4 w-4"/>Deletar</Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="w-full justify-start" onClick={handleIdentifyModalOpen} disabled={isProcessing}>
                          <UserPlus className="mr-2 h-4 w-4"/>Identificar / Conectar
                      </Button>
                    )}
                  </div></PopoverContent>
                </Popover>
              </div>
              <ScrollArea className="flex-1 p-4 bg-background/50">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.role === 'admin' ? "justify-end" : "justify-start")}>
                      {msg.role !== 'admin' && (
                        <Avatar className="h-8 w-8">
                           <AvatarFallback>{msg.role === 'user' ? <Users className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("rounded-lg px-3 py-2 max-w-sm break-words prose dark:prose-invert", msg.role === 'admin' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
              <div className="p-4 border-t"><form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-4"><Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." autoComplete="off" disabled={isProcessing}/><Button type="submit" size="icon" disabled={!newMessage.trim() || isProcessing}><Send/></Button></form></div>
            </>
          ) : (<div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background/50"><MessageSquare className="h-12 w-12 mb-4"/><p className="text-lg">Selecione uma conversa</p><p className="text-sm mt-2">Seus chats ativos aparecerão aqui.</p></div>)}
        </main>
      </div>
      {selectedChat?.type === 'SESSION' && <LeadIdentificationModal isOpen={isIdentifyModalOpen} onClose={() => setIdentifyModalOpen(false)} adminId={adminId} session={selectedChat} />}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível e irá deletar todo o histórico da conversa.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConversation} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Deletar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
