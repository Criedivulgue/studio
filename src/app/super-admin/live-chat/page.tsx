"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, SendHorizonal, User, Phone, Video, AlertCircle, Loader2 } from "lucide-react";
import { activeChatsData } from "@/lib/data";
import type { ActiveChat, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LiveChatPage() {
  const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(activeChatsData[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(selectedChat?.messages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectChat = (chat: ActiveChat) => {
    setSelectedChat(chat);
    setMessages(chat.messages);
    // Logic to mark chat as read would go here
    chat.unreadCount = 0;
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessage: ChatMessage = { role: "admin", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] border rounded-lg overflow-hidden">
      {/* Coluna da Lista de Chats */}
      <aside className="flex flex-col border-r bg-card">
        <header className="p-4 border-b">
          <h2 className="text-xl font-headline font-semibold">Conversas Ativas</h2>
          <p className="text-sm text-muted-foreground">Monitorando o chat global</p>
        </header>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {activeChatsData.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b",
                  selectedChat?.id === chat.id && "bg-muted"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chat.contact.avatar} data-ai-hint="profile picture"/>
                  <AvatarFallback>{chat.contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{chat.contact.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                <div className="flex flex-col items-end text-xs text-muted-foreground gap-1">
                  <span>{chat.timestamp}</span>
                  {chat.unreadCount > 0 && (
                    <Badge className="h-5 w-5 flex items-center justify-center p-0">{chat.unreadCount}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Coluna do Chat Ativo */}
      <main className="flex flex-col h-full">
        {selectedChat ? (
          <>
            <header className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedChat.contact.avatar} data-ai-hint="profile picture"/>
                  <AvatarFallback>{selectedChat.contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedChat.contact.name}</p>
                  <p className="text-xs text-muted-foreground">Status: Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" /> Transferir para IA
                 </Button>
              </div>
            </header>

            <ScrollArea className="flex-1 bg-background p-4">
               <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-4",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role !== "user" && (
                      <Avatar className="h-8 w-8 border-2 border-primary/50">
                        <AvatarFallback>
                            {message.role === 'assistant' ? <Bot className="h-5 w-5"/> : <User className="h-5 w-5"/>}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-md rounded-xl px-4 py-3 text-sm shadow-md",
                        message.role === "user" && "bg-primary text-primary-foreground rounded-br-none",
                        message.role === 'assistant' && "bg-card text-card-foreground rounded-bl-none",
                        message.role === 'admin' && "bg-accent text-accent-foreground rounded-bl-none"
                      )}
                    >
                      {message.role === 'assistant' && <p className="text-xs font-semibold text-primary pb-1">[Mensagem da IA]</p>}
                      {message.content}
                    </div>
                     {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                </div>
            </ScrollArea>

            <footer className="p-4 border-t bg-card">
              <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem como Super Admin..."
                  className="w-full resize-none rounded-xl border-2 pr-20"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                </Button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4" />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </main>
    </div>
  );
}
