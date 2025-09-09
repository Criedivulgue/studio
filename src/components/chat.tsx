'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, getDocs, deleteDoc, writeBatch, where
} from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MoreVertical, Sparkles, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { User, Conversation } from '@/lib/types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
}

export function Chat({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const userId = user.id;

  // REATORADO: Ouve a coleção GLOBAL `conversations` filtrando pelo adminId
  useEffect(() => {
    if (!userId) return;

    setLoadingConversations(true);

    const conversationsQuery = query(
      collection(db, "conversations"), 
      where("adminId", "==", userId), 
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const convos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          path: doc.ref.path,
          name: data.contactName || 'Conversa desconhecida',
          lastMessage: data.lastMessage || '',
          unreadCount: data.unreadCount || 0,
        } as Conversation;
      });
      setConversations(convos);
      setLoadingConversations(false);
    }, (error) => {
      console.error("Error listening to conversations:", error);
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível buscar as conversas. Verifique sua conexão e as regras do Firestore."
      });
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);


  useEffect(() => {
    if (selectedConversation) {
      const messagesQuery = query(collection(db, selectedConversation.path, 'messages'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        const batch = writeBatch(db);
        snapshot.docs.forEach((msgDoc) => {
          if (msgDoc.data().senderId !== userId && !msgDoc.data().read) {
            batch.update(msgDoc.ref, { read: true });
          }
        });
        batch.commit().catch(err => console.error("Failed to batch update message read status", err));
      }, err => {
        console.error(`Error fetching messages for ${selectedConversation.id}`, err);
        toast({variant: "destructive", title: "Erro ao buscar mensagens"});
      });
      return () => unsubscribe();
    }
  }, [selectedConversation, userId, toast]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSelectConversation = (convo: Conversation) => {
    setSelectedConversation(convo);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation) return;
    const tempMessage = newMessage;
    setNewMessage('');
    try {
        const messagesCol = collection(db, selectedConversation.path, 'messages');
        await addDoc(messagesCol, { text: tempMessage, senderId: userId, timestamp: serverTimestamp(), read: false });
        await updateDoc(doc(db, selectedConversation.path), { lastMessage: tempMessage, lastMessageTimestamp: serverTimestamp() });
    } catch(err) {
        console.error("Failed to send message", err);
        toast({title: "Erro ao enviar mensagem", variant: "destructive"});
        setNewMessage(tempMessage);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedConversation || messages.length === 0) {
      toast({ title: "Não há mensagens para resumir.", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationPath: selectedConversation.path }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o resumo.');
      }
      const { summary } = await response.json();
      toast({ title: "Resumo Gerado pela IA", description: summary, duration: 15000 });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    const convoToDelete = selectedConversation;
    setShowDeleteDialog(false);
    setSelectedConversation(null);
    setMessages([]);

    try {
      const batch = writeBatch(db);
      const messagesQuery = query(collection(db, convoToDelete.path, 'messages'));
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(doc => batch.delete(doc.ref));
      const conversationDocRef = doc(db, convoToDelete.path);
      batch.delete(conversationDocRef);
      await batch.commit();
      toast({ title: "Conversa excluída!" });
    } catch (error) {
      console.error("Erro ao excluir conversa: ", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  }

  const filteredConversations = conversations.filter(convo => convo.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] border rounded-lg bg-card text-card-foreground">
        <aside className="w-1/3 md:w-1/4 border-r flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contatos</h2>
            <AddContactModal adminUid={userId} onSuccess={() => {}} />
          </div>
          <div className="p-2 border-b">
            <Input placeholder="Buscar contato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="flex justify-center items-center h-full p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredConversations.length > 0 ? (
                filteredConversations.map(convo => (
                  <div key={convo.id} className={cn("p-4 cursor-pointer hover:bg-muted/50 border-b flex justify-between items-center", selectedConversation?.id === convo.id && "bg-muted")} onClick={() => handleSelectConversation(convo)}>
                    <div className="w-full truncate">
                      <p className="font-semibold truncate">{convo.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                    {convo.unreadCount > 0 && <Badge className="flex-shrink-0 ml-2">{convo.unreadCount}</Badge>}
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground text-sm">Nenhuma conversa encontrada.</div>
            )}
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 truncate">
                  <Avatar><AvatarFallback>{selectedConversation.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <h3 className="text-lg font-semibold truncate">{selectedConversation.name}</h3>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical/></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="grid gap-1">
                      <Button variant="ghost" className="w-full justify-start" onClick={handleGenerateSummary} disabled={isSummarizing}>
                        {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                        Resumir com IA
                      </Button>
                      <Separator className="my-1" />
                      <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}><Trash2 className="mr-2 h-4 w-4"/>Excluir Conversa</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <ScrollArea className="flex-1 p-4 bg-background/50">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex mb-4", msg.senderId === userId ? "justify-end" : "justify-start")}>
                    <div className={cn("rounded-lg px-4 py-2 max-w-sm break-words", msg.senderId === userId ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." autoComplete="off"/>
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send className="h-4 w-4"/></Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background/50">
              <MessageSquare className="h-12 w-12 mb-4"/>
              <p className="text-lg">Selecione uma conversa para começar</p>
              <p className="text-sm mt-2">Ou compartilhe seu link de chat para receber novos contatos.</p>
            </div>
          )}
        </main>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação excluirá permanentemente o histórico de mensagens com {selectedConversation?.name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
