'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, serverTimestamp, orderBy, getDoc, setDoc, writeBatch, increment, Timestamp
} from 'firebase/firestore';
// PHASE 2 REFACTOR: Using the new unified Message and PublicProfile types
import type { Message, PublicProfile, ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PublicChatViewProps {
  adminUid: string;
}

export function PublicChatView({ adminUid }: PublicChatViewProps) {
  // PHASE 2 REFACTOR: Using the unified Message type
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sessionPath, setSessionPath] = useState<string | null>(null);
  // PHASE 2 REFACTOR: Using the unified PublicProfile type
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const [isAdminProfileLoading, setIsAdminProfileLoading] = useState(true);
  const [visitorUid, setVisitorUid] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Effect for anonymous authentication and session initialization
  useEffect(() => {
    if (!adminUid) return;

    const initializeSession = async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        setVisitorUid(uid);

        const sessionId = `session_${adminUid}_${uid}`;
        const path = `chatSessions/${sessionId}`;
        setSessionPath(path);

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
      } catch (error) {
        console.error("Error in anonymous session initialization:", error);
        toast({ title: "Connection Error", description: "Could not start the chat.", variant: "destructive" });
      }
    };

    initializeSession();

  }, [adminUid, toast]);

  // Effect to fetch the administrator's public profile
  useEffect(() => {
    if (!adminUid) return;

    const fetchAdminProfile = async () => {
      setIsAdminProfileLoading(true);
      try {
        const profileDocRef = doc(db, 'public_profiles', adminUid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          // PHASE 2 REFACTOR: Using the correct fields from PublicProfile
          const profileData = profileDocSnap.data() as PublicProfile;
          setAdminProfile(profileData);
        } else {
          console.warn(`Public profile not found for admin: ${adminUid}.`);
          setAdminProfile({ displayName: 'Support', greeting: 'Ready to help', avatarUrl: '', ownerId: adminUid });
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
        setAdminProfile({ displayName: 'Support', greeting: 'Ready to help', avatarUrl: '', ownerId: adminUid });
      } finally {
        setIsAdminProfileLoading(false);
      }
    };

    fetchAdminProfile();
  }, [adminUid]);

  // Effect to listen for new messages
  useEffect(() => {
    if (!sessionPath) return;
    const messagesQuery = query(collection(db, `${sessionPath}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      // PHASE 2 REFACTOR: Casting to the unified Message type
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
      setMessages(msgs);
    }, (error) => {
      console.error("Error listening for messages:", error);
      toast({ title: "Communication Error", description: "Could not load messages.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, [sessionPath, toast]);

  // Effect for auto-scrolling
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

      // PHASE 2 REFACTOR: Creating a payload that matches the new unified Message interface
      const newMessage: Omit<Message, 'id' | 'timestamp'> = {
        senderId: visitorUid,
        role: 'user',
        content: content,
        read: false,
      };

      batch.set(messageRef, { ...newMessage, timestamp: serverTimestamp() });

      batch.update(sessionRef, {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        unreadCount: increment(1)
      });

      await batch.commit();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Your message could not be sent.", variant: "destructive" });
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  if (!adminUid || isAdminProfileLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b p-4 shadow-sm bg-card">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                    {adminProfile?.avatarUrl && <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.displayName} />}
                    <AvatarFallback>
                        {adminProfile?.displayName ? adminProfile.displayName[0].toUpperCase() : <Bot className="h-5 w-5"/>}
                    </AvatarFallback>
                </Avatar>
              <div>
                  {/* PHASE 2 REFACTOR: Using correct profile fields */}
                  <h1 className="text-lg font-headline font-semibold">{adminProfile?.displayName || 'Virtual Assistant'}</h1>
                  <p className="text-sm text-muted-foreground">{adminProfile?.greeting || "Ready to help"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} aria-label="End Chat">
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
                {message.role === 'admin' && <p className="text-xs font-bold text-amber-700 pb-1">{adminProfile?.displayName || 'Agent'}</p>}
                {message.content}
              </div>
              {message.role === "user" && (<Avatar className="h-8 w-8"><AvatarFallback><User/></AvatarFallback></Avatar>)}
            </div>
          ))}
          {isAiTyping && (<div className="flex items-start gap-4 justify-start"><Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar><div className="max-w-md rounded-xl px-4 py-3 text-sm bg-card"><Loader2 className="h-4 w-4 animate-spin"/></div></div>)}
        </div>
        </ScrollArea>

        <footer className="border-t bg-card p-4"><form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder={"Ask a question..."} className="w-full resize-none rounded-xl pr-20" rows={1} disabled={isSending || !sessionPath}/>
          <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSending || !input.trim() || !sessionPath}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}</Button>
        </form></footer>
      </div>
    </>
  );
}
