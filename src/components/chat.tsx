'use client';

import { useState, useEffect, useRef } from 'react';
import { db, functions } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, getDocs, deleteDoc, writeBatch, where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MoreVertical, Sparkles, Trash2, Loader2, MessageSquare, Archive, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Conversation, PlatformUser, Message } from '@/lib/types';

const archiveAndSummarizeConversation = httpsCallable(functions, 'archiveAndSummarizeConversation');
const summarizeConversation = httpsCallable(functions, 'summarizeConversation');

export function Chat({ user }: { user: PlatformUser }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);

  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const userId = user.id;

  useEffect(() => {
    if (!userId) return;
    setLoadingConversations(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // CORREÇÃO: Simplificada a query para evitar a necessidade de um índice composto.
    // O filtro de status 'arquivado' será aplicado no lado do cliente.
    const baseQuery = [
      where('lastMessageTimestamp', '>=', thirtyDaysAgo),
      orderBy('lastMessageTimestamp', 'desc')
    ];

    const q = user.role === 'superadmin'
      ? query(collection(db, "conversations"), ...baseQuery)
      : query(collection(db, "conversations"), where("adminId", "==", userId), ...baseQuery);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs
        .map(doc => ({ id: doc.id, path: doc.ref.path, ...doc.data() } as Conversation))
        .filter(convo => convo.status !== 'archived'); // Filtro de status aplicado no cliente.
      
      setConversations(convos);
      setLoadingConversations(false);
    }, (error) => {
      console.error("Error listening to conversations:", error);
      toast({ variant: "destructive", title: "Erro ao carregar conversas", description: "A consulta ao banco de dados falhou. Verifique o console para mais detalhes." });
      setLoadingConversations(false);
    });
    return () => unsubscribe();
  }, [userId, user.role, toast]);

  useEffect(() => {
    const conversationPath = selectedConversation?.path;
    if (!conversationPath) {
      setMessages([]);
      return;
    }

    const q = query(collection(db, conversationPath, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      const batch = writeBatch(db);
      snapshot.docs.forEach((msgDoc) => {
        if (msgDoc.data().senderId !== userId && !msgDoc.data().read) {
          batch.update(msgDoc.ref, { read: true });
        }
      });
      batch.commit().catch(err => console.error("Failed to update read status", err));
    });
    return () => unsubscribe();
  }, [selectedConversation, userId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async () => {
    const conversationPath = selectedConversation?.path;
    if (newMessage.trim() === '' || !conversationPath) return;
    
    const tempMessage = newMessage; 
    setNewMessage('');
    try {
        await addDoc(collection(db, conversationPath, 'messages'), { text: tempMessage, senderId: userId, timestamp: serverTimestamp(), read: false });
        await updateDoc(doc(db, conversationPath), { lastMessage: tempMessage, lastMessageTimestamp: serverTimestamp(), status: 'open' });
    } catch(err) {
        console.error("Failed to send message", err);
        setNewMessage(tempMessage);
    }
  };

  const handleConversationAction = async (action: 'archive' | 'summarize') => {
    const conversationId = selectedConversation?.id;
    if (!conversationId) return;
    setIsProcessing(true);
    try {
      const func = action === 'archive' ? archiveAndSummarizeConversation : summarizeConversation;
      await func({ conversationId: conversationId });
      if(action === 'archive') setSelectedConversation(null);
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConversation = async () => {
    const conversationId = selectedConversation?.id;
    if (!conversationId) return;
    setIsProcessing(true);
    try {
      const messagesSnap = await getDocs(collection(db, 'conversations', conversationId, 'messages'));
      const batch = writeBatch(db);
      messagesSnap.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, 'conversations', conversationId));
      await batch.commit();
      setSelectedConversation(null);
    } catch(error) {
      console.error("Error deleting conversation:", error);
    } finally {
      setShowDeleteDialog(false);
      setIsProcessing(false);
    }
  };

  const handleContactAdded = () => {
    setAddContactModalOpen(false);
    toast({ title: "Sucesso", description: "Novo contato adicionado." });
  };

  const filteredConversations = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] border rounded-lg bg-card text-card-foreground">
        <aside className="w-1/3 md:w-1/4 border-r flex flex-col">
          <div className="p-4 border-b"><Input placeholder="Buscar conversas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <ScrollArea className="flex-1">
            {loadingConversations ? <div className="p-4 text-center text-muted-foreground">Carregando...</div> :
              filteredConversations.length > 0 ? filteredConversations.map(c => (
                <Button key={c.id} variant="ghost" className={cn("w-full justify-start h-auto p-4 rounded-none", selectedConversation?.id === c.id && "bg-muted")} onClick={() => setSelectedConversation(c)}>
                  <div className="flex items-center gap-4 w-full truncate"><Avatar className="h-10 w-10"><AvatarFallback>{(c.name || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="w-full truncate text-left"><p className="font-semibold truncate">{c.name || 'Conversa'}</p><p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p></div></div>
                </Button>
              )) : <p className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada.</p>}
          </ScrollArea>
          <div className="p-2 border-t"><Button className="w-full" onClick={() => setAddContactModalOpen(true)}><UserPlus className="mr-2 h-4 w-4"/>Novo Contato</Button></div>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 truncate"><Avatar><AvatarFallback>{(selectedConversation.name || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar><h3 className="text-lg font-semibold truncate">{selectedConversation.name || 'Conversa'}</h3></div>
                <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" disabled={isProcessing}><MoreVertical/></Button></PopoverTrigger>
                  <PopoverContent className="w-56"><div className="grid gap-1">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleConversationAction('archive')} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}Arquivar</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleConversationAction('summarize')} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Resumir</Button>
                    <Separator className="my-1" />
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)} disabled={isProcessing}><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button>
                  </div></PopoverContent>
                </Popover>
              </div>
              <ScrollArea className="flex-1 p-4 bg-background/50">{messages.map((msg) => (<div key={msg.id} className={cn("flex mb-4", msg.senderId === userId ? "justify-end" : "justify-start")}><div className={cn("rounded-lg px-4 py-2 max-w-sm", msg.senderId === userId ? "bg-primary text-primary-foreground" : "bg-muted")}>{msg.text}</div></div>))}<div ref={messagesEndRef} /></ScrollArea>
              <div className="p-4 border-t"><form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-4"><Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." autoComplete="off" /><Button type="submit" size="icon" disabled={!newMessage.trim()}><Send/></Button></form></div>
            </>
          ) : (<div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background/50"><MessageSquare className="h-12 w-12 mb-4"/><p className="text-lg">Selecione uma conversa</p><p className="text-sm mt-2">Suas conversas ativas aparecerão aqui.</p></div>)}
        </main>
      </div>
      <AddContactModal isOpen={isAddContactModalOpen} onClose={() => setAddContactModalOpen(false)} adminUid={userId} onSuccess={handleContactAdded} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível e apagará todo o histórico da conversa.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConversation} disabled={isProcessing}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apagar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
