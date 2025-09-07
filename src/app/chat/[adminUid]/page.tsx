"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot, User, Loader2, Sparkles, NotebookText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { suggestResponse } from "@/ai/flows/suggest-response";
import { summarizeChatHistory } from "@/ai/flows/summarize-chat-history";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function ChatPage() {
  const { adminUid } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [useCustomInfo, setUseCustomInfo] = useState(true);
  const [summary, setSummary] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        adminUid: Array.isArray(adminUid) ? adminUid[0] : adminUid,
        useCustomInformation: useCustomInfo,
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
      setMessages(prev => prev.slice(0, -1)); // Remove the user message on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSummarize = async () => {
    if(isSummarizing || messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const result = await summarizeChatHistory({ chatHistory });
      setSummary(result.summary);
      // The dialog trigger will open the dialog, so we just need to set the content.
    } catch (error) {
       console.error("AI summary error:", error);
       toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao resumir o histórico de chat.",
      });
    } finally {
        setIsSummarizing(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4 shadow-sm">
        <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <div>
                <h1 className="text-lg font-headline font-semibold">Assistente de IA</h1>
                <p className="text-sm text-muted-foreground">Conversando como: {adminUid}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch id="custom-info-toggle" checked={useCustomInfo} onCheckedChange={setUseCustomInfo} />
            <Label htmlFor="custom-info-toggle" className="flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-primary" /> Info Personalizada
            </Label>
          </div>
          <Dialog>
             <DialogTrigger asChild>
                <Button variant="outline" onClick={handleSummarize} disabled={isSummarizing || messages.length === 0}>
                   {isSummarizing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   ) : (
                      <NotebookText className="mr-2 h-4 w-4" />
                   )}
                   Resumir
                </Button>
             </DialogTrigger>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Resumo do Chat</DialogTitle>
                    <DialogDescription>
                       Um resumo conciso da conversa atual.
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground py-4">{summary || "Nenhum resumo disponível."}</p>
             </DialogContent>
          </Dialog>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 border-2 border-primary/50">
                <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-md rounded-xl px-4 py-3 text-sm shadow-md",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-card-foreground rounded-bl-none"
              )}
            >
              {message.content}
            </div>
            {message.role === "user" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start gap-4 justify-start">
               <Avatar className="h-8 w-8 border-2 border-primary/50">
                <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
              </Avatar>
                <div className="max-w-md rounded-xl px-4 py-3 text-sm shadow-md bg-card text-card-foreground rounded-bl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span>Pensando...</span>
                </div>
            </div>
        )}
        </div>
      </ScrollArea>

      <footer className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
            placeholder="Faça uma pergunta..."
            className="w-full resize-none rounded-xl border-2 pr-20"
            rows={1}
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
    </div>
  );
}
