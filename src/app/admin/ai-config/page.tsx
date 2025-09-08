'use client';

import { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function AiConfigPage() {
  const { user } = useAuth(); // Hook de autenticação
  const { toast } = useToast();
  
  // Otimização: inicializa o estado com o prompt do usuário ou um padrão
  const [prompt, setPrompt] = useState(user?.aiPrompt || 'Seja um assistente prestativo.');
  const [isLoading, setIsLoading] = useState(false);

  // Se o usuário ainda não foi carregado, exibe um loader.
  // Isso também resolve o erro do TypeScript "'user' is possibly 'null'"
  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsLoading(true);
    toast({ title: "Salvando...", description: "Suas alterações no prompt de IA estão sendo salvas." });
    
    // Simulação de chamada de API para salvar o prompt
    console.log("Salvando prompt para o usuário:", user.id);
    console.log("Novo prompt:", prompt);
    
    // Simular um atraso de rede
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Salvo com sucesso!", description: "Seu prompt de IA foi atualizado." });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <Heading title="Configurações de IA" description="Personalize o comportamento do seu assistente de IA." />
        <Separator className="mt-4" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Prompt do Sistema</Label>
          <p className="text-sm text-muted-foreground">
            Este prompt definirá o contexto e a personalidade do seu assistente de IA em todas as interações.
          </p>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Você é um assistente amigável e especialista em nossos produtos..."
            className="min-h-[200px]"
          />
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
