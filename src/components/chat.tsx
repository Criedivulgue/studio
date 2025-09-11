'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db, functions } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, getDocs, deleteDoc, writeBatch, where, Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreVertical, Sparkles, Trash2, Loader2, MessageSquare, Archive, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Conversation, PlatformUser, Message, ChatSession } from '@/lib/types';
import { LeadIdentificationModal } from '@/components/chat/LeadIdentificationModal';

export type ActiveChat = (Conversation & { type: 'CONVERSATION' }) | (ChatSession & { type: 'SESSION' });

const archiveAndSummarizeConversation = httpsCallable(functions, 'archiveAndSummarizeConversation');

export function Chat({ user }: { user: PlatformUser }) {
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
    if (!adminId) return;
    setLoading(true);

    const sessionsQuery = query(collection(db, "chatSessions"), where("adminId", "==", adminId), orderBy('createdAt', 'desc'));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setAnonymousChats(sessions);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to chat sessions:", error);
    });

    const convosQuery = query(collection(db, "conversations"), where("adminId", "==", adminId), orderBy('lastMessageTimestamp', 'desc'));
    const unsubscribeConvos = onSnapshot(convosQuery, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setIdentifiedChats(convos.filter(c => c.status !== 'archived'));
      setLoading(false);
    }, (error) => {
      console.error("Error listening to conversations:", error);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeConvos();
    };
  }, [adminId, toast]);

  useEffect(() => {
    if (!selectedChat) {
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
  }, [selectedChat, adminId]);

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
    const name = c.type === 'CONVERSATION' ? c.contactName : (c.visitorName || 'Anonymous Visitor');
    const lastMessage = c.lastMessage || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedChat) return;

    const collectionName = selectedChat.type === 'CONVERSATION' ? 'conversations' : 'chatSessions';
    const chatPath = `${collectionName}/${selectedChat.id}`;
    const messagesPath = `${chatPath}/messages`;
    
    const tempMessage = newMessage; 
    setNewMessage('');
    try {
        const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
            content: tempMessage,
            senderId: adminId,
            role: 'admin',
            read: true
        };
        await addDoc(collection(db, messagesPath), { ...messagePayload, timestamp: serverTimestamp() });
        await updateDoc(doc(db, chatPath), { lastMessage: tempMessage, lastMessageTimestamp: serverTimestamp() });
    } catch(err) {
        console.error("Failed to send message", err);
        setNewMessage(tempMessage);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' })
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedChat || selectedChat.type !== 'CONVERSATION') return;
    setIsProcessing(true);
    try {
      const messagesSnap = await getDocs(collection(db, 'conversations', selectedChat.id, 'messages'));
      const batch = writeBatch(db);
      messagesSnap.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, 'conversations', selectedChat.id));
      await batch.commit();
      setSelectedChat(null);
    } catch(error) {
      console.error("Error deleting conversation:", error);
    } finally {
      setShowDeleteDialog(false);
      setIsProcessing(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedChat || selectedChat.type !== 'CONVERSATION') return;
    setIsProcessing(true);
    try {
      await archiveAndSummarizeConversation({ 
        conversationId: selectedChat.id, 
        contactId: selectedChat.contactId 
      });
      toast({ title: 'Success', description: 'Conversation has been archived and summarized.' });
      setSelectedChat(null);
    } catch (error) {
      console.error(`Error during archive:`, error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to archive conversation.' })
    } finally {
      setIsProcessing(false);
    }
  }

  const handleIdentifyModalOpen = () => {
      if (selectedChat?.type === 'SESSION') {
          setIdentifyModalOpen(true)
      }
  }

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] border rounded-lg bg-card text-card-foreground">
        <aside className="w-1/3 md:w-1/4 border-r flex flex-col">
          <div className="p-4 border-b"><Input placeholder="Search chats..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <ScrollArea className="flex-1">
            {loading ? <div className="p-4 text-center text-muted-foreground">Loading...</div> :
              filteredChats.length > 0 ? filteredChats.map(c => (
                <Button key={c.id} variant="ghost" className={cn("w-full justify-start h-auto p-4 rounded-none", selectedChat?.id === c.id && "bg-muted")} onClick={() => setSelectedChat(c)}>
                  <div className="flex items-center gap-4 w-full truncate">
                    <Avatar className={cn("h-10 w-10", c.type === 'SESSION' && 'border-2 border-dashed border-primary')}><AvatarFallback>{c.type === 'SESSION' ? <Users className='h-5 w-5'/> : (c.contactName || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="w-full truncate text-left">
                      <p className="font-semibold truncate">{c.type === 'CONVERSATION' ? c.contactName : (c.visitorName || 'Anonymous Visitor')}</p>
                      <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                  </div>
                </Button>
              )) : <p className="p-4 text-center text-muted-foreground">No active chats found.</p>}
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 truncate">
                  <Avatar><AvatarFallback>{selectedChat.type === 'SESSION' ? <Users className='h-5 w-5'/> : (selectedChat.contactName || ' ').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <h3 className="text-lg font-semibold truncate">{selectedChat.type === 'CONVERSATION' ? selectedChat.contactName : (selectedChat.visitorName || 'Anonymous Visitor')}</h3>
                </div>
                <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" disabled={isProcessing}><MoreVertical/></Button></PopoverTrigger>
                  <PopoverContent className="w-56"><div className="grid gap-1">
                    {selectedChat.type === 'CONVERSATION' ? (
                      <>
                        <Button variant="ghost" className="w-full justify-start" onClick={handleArchiveConversation} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}Archive</Button>
                        <Separator className="my-1" />
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)} disabled={isProcessing}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="w-full justify-start" onClick={handleIdentifyModalOpen} disabled={isProcessing}><UserPlus className="mr-2 h-4 w-4"/>Identify Lead</Button>
                    )}
                  </div></PopoverContent>
                </Popover>
              </div>
              <ScrollArea className="flex-1 p-4 bg-background/50">{messages.map((msg) => (<div key={msg.id} className={cn("flex mb-4", msg.senderId === adminId ? "justify-end" : "justify-start")}><div className={cn("rounded-lg px-4 py-2 max-w-sm", msg.senderId === adminId ? "bg-primary text-primary-foreground" : "bg-muted")}>{msg.content}</div></div>))}<div ref={messagesEndRef} /></ScrollArea>
              <div className="p-4 border-t"><form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-4"><Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." autoComplete="off" /><Button type="submit" size="icon" disabled={!newMessage.trim()}><Send/></Button></form></div>
            </>
          ) : (<div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background/50"><MessageSquare className="h-12 w-12 mb-4"/><p className="text-lg">Select a conversation</p><p className="text-sm mt-2">Your active chats will appear here.</p></div>)}
        </main>
      </div>
      {selectedChat?.type === 'SESSION' && <LeadIdentificationModal isOpen={isIdentifyModalOpen} onClose={() => setIdentifyModalOpen(false)} adminId={adminId} session={selectedChat} />}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm delete?</AlertDialogTitle><AlertDialogDescription>This action is irreversible and will delete the entire conversation history.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConversation} disabled={isProcessing}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
