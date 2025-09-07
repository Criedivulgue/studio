"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, MessageSquare, X, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { suggestResponse } from "@/ai/flows/suggest-response";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChatWidget({ adminUid }: { adminUid: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
        setMessages([
            { role: 'assistant', content: 'Olá! Como posso ajudar você hoje?' }
        ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await suggestResponse({
        userInquiry: input,
        adminUid: adminUid,
        useCustomInformation: true,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.suggestedResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI response error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao obter uma resposta da IA. Por favor, tente novamente.",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
        >
          {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[380px] h-[70vh] p-0 border-0 rounded-xl shadow-2xl mr-4 mb-2"
        sideOffset={16}
      >
        <Card className="h-full flex flex-col border-0">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarFallback><Bot className="h-6 w-6"/></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-headline text-lg">Assistente Virtual</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 text-sm",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 border-2 border-primary/50">
                      <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-lg px-3 py-2 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card text-card-foreground border rounded-bl-none"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                   <Avatar className="h-7 w-7 border-2 border-primary/50">
                    <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                  </Avatar>
                    <div className="max-w-md rounded-lg px-4 py-2 text-sm shadow-sm bg-card border flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span>Pensando...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="relative w-full">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSendMessage(e);
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="w-full resize-none rounded-lg pr-12"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md h-8 w-8"
                disabled={isLoading || !input.trim()}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
